from datetime import datetime, timezone
from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response, JSONResponse
import csv
from io import StringIO
import asyncio
from pydantic import BaseModel, Field, validator
from httpx import AsyncClient, HTTPStatusError
import json
import logging
import random
from datetime import datetime
from typing import List, Dict
import csv
import io
from fastapi.responses import StreamingResponse


# Reuse components from historical_processing.py
from historical_processing import (
    get_api_client,
    fetch_paginated_records as hist_fetch_paginated,
    clean_data,
    TimeGap,
    get_token,
    logger,
    HTTPAuthorizationCredentials,
    HTTPBearer
)

router = APIRouter()

# Reuse exact same models from historical processing
class ExportRequest(BaseModel):
    facility: str = Field(..., pattern="^(uoa|istic)$")
    sensor_type: str = Field(
        ..., 
        pattern="^(humidity|luminance|microphone|motion|presence|radio|temperature|thermalmap|thermography)$"
    )
    agent_serial: List[str] = Field(..., min_items=1)
    start: datetime = Field(...)
    end: datetime = Field(...)
    format: str = Field("json", pattern="^(csv|json)$")

    _validate_start = validator('start', allow_reuse=True)(TimeGap.ensure_utc)
    _validate_end = validator('end', allow_reuse=True)(TimeGap.ensure_utc)


def convert_to_csv(records: List[Dict]) -> str:
    fieldnames = [
        "id",
        "agentSerial",
        "deviceType",
        "reading",
        "unit",
        "timeOfReading",
        "timeOfCreate",
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for row in records:
        tor = row.get("timeOfReading")
        if isinstance(tor, datetime):
            tor = tor.isoformat()
        toc = row.get("timeOfCreate")
        if isinstance(toc, datetime):
            toc = toc.isoformat()

        out_row = {
            "id":                row.get("id", ""),
            "agentSerial":       row.get("agentSerial", ""),
            "deviceType":        row.get("deviceType", ""),
            "reading":           row.get("reading", ""),
            "unit":              row.get("unit", ""),
            "timeOfReading":     tor,
            "timeOfCreate":      toc,
        }
        writer.writerow(out_row)

    return output.getvalue()

@router.post("/export")
async def export_data(request: ExportRequest, token: str = Depends(get_token)) -> Response:
    logger.debug(f"Starting export request: {request.dict()}")
    try:
        # Date conversion
        start_utc = request.start.astimezone(timezone.utc)
        end_utc = request.end.astimezone(timezone.utc)
        start_date = start_utc.strftime("%Y-%m-%d")
        end_date = end_utc.strftime("%Y-%m-%d")

        # Fetch
        all_records = []
        async with get_api_client() as client:
            tasks = [
                hist_fetch_paginated(
                    client=client,
                    facility=request.facility,
                    sensor_type=request.sensor_type,
                    agent_serial=agent,
                    start_date=start_date,
                    end_date=end_date,
                    token=token
                ) for agent in request.agent_serial
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            errors = 0
            for idx, result in enumerate(results):
                if isinstance(result, Exception):
                    errors += 1
                else:
                    all_records.extend(result)

            if errors == len(request.agent_serial):
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="All agent data fetches failed"
                )

        # Clean & filter
        cleaned = await clean_data(all_records, request.sensor_type)
        in_window = [d for d in cleaned if request.start <= d["timeOfReading"] <= request.end]
        if not in_window:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No data exists within time window after cleaning"
            )

        # CSV
        if request.format == "csv":
            csv_data = convert_to_csv(in_window)
            return Response(
                content=csv_data,
                media_type="text/csv",
                headers={"Content-Disposition": 'attachment; filename="export.csv"'}
            )

        # JSON as file
        json_bytes = json.dumps(in_window, default=str).encode("utf-8")
        return Response(
            content=json_bytes,
            media_type="application/json",
            headers={"Content-Disposition": 'attachment; filename="export.json"'}
        )

    except HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Historical data service unavailable"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during export"
        )
