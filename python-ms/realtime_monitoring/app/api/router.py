import asyncio
from fastapi import APIRouter, Depends, Request
from sse_starlette.sse import EventSourceResponse
from app.models.schemas import StreamRequest, RealTimeControl
from app.core.state import SessionState
from app.services.event_bus import EventBus
from app.services.aggregator import Aggregator
from app.services.fetcher import APIClient
from app.config import settings
import logging
import json
from datetime import datetime
from pydantic import EmailStr


logger = logging.getLogger(__name__)

stream_router = APIRouter()
state = SessionState()
bus = EventBus()

# Dependency to parse and validate StreamRequest
async def get_stream_params(
    facility: str,
    sensor_box_id: str,
    sensor_type: str,
    email: EmailStr,  
) -> StreamRequest:
    return StreamRequest(
        facility=facility,
        sensor_box_id=sensor_box_id,
        sensor_type=sensor_type,
        email=email, 
    )

@stream_router.get("/{facility}/{sensor_box_id}/{sensor_type}")
async def stream_data(
    request: Request,
    stream_params: StreamRequest = Depends(get_stream_params),
    control: RealTimeControl = Depends()
):
    session_key = f"{stream_params.facility}:{stream_params.sensor_box_id}:{stream_params.sensor_type}"
    state.set_control(session_key, control)
    agg = Aggregator(metric=control.aggregation_metric, buffer_time=control.buffer_time)

    async def event_generator():
        bus.subscribe(
            stream_params.email,
            stream_params.facility,
            stream_params.sensor_box_id,
            stream_params.sensor_type
        )
        logger.info("SSE SUBSCRIBE %s at %s", session_key, datetime.utcnow().isoformat())

        # Send latest value in bus immediately if available
        data = bus.get_latest(
            stream_params.facility,
            stream_params.sensor_box_id,
            stream_params.sensor_type
        )
        if data and data.get("reading") is not None:
            if control.aggregation_metric and control.buffer_time:
                agg.add(data)
                payload = agg.compute()
            else:
                payload = data

            yield {
                "event": "update",
                "data": json.dumps(payload, default=str)
            }
        else:
            # Optionally: fetch directly if nothing in bus
            client = APIClient(email=stream_params.email)
            await client.ensure_token()
            fetched = await client.fetch_data(
                stream_params.facility,
                stream_params.sensor_box_id,
                stream_params.sensor_type
            )
            if fetched and fetched.get("reading") is not None:
                if control.aggregation_metric and control.buffer_time:
                    agg.add(fetched)
                    payload = agg.compute()
                else:
                    payload = fetched

                yield {
                    "event": "update",
                    "data": json.dumps(payload, default=str)
                }

        try:
            while True:
                await bus.wait_for_update(
                    stream_params.facility,
                    stream_params.sensor_box_id,
                    stream_params.sensor_type
                )

                if await request.is_disconnected():
                    logger.info("Client disconnected for %s — exiting generator", session_key)
                    break

                data = bus.get_latest(
                    stream_params.facility,
                    stream_params.sensor_box_id,
                    stream_params.sensor_type
                )
                if data and data.get("reading") is not None:
                    if control.aggregation_metric and control.buffer_time:
                        agg.add(data)
                        payload = agg.compute()
                    else:
                        payload = data

                    yield {
                        "event": "update",
                        "data": json.dumps(payload, default=str)
                    }
        finally:
            bus.unsubscribe(
                stream_params.email,
                stream_params.facility,
                stream_params.sensor_box_id,
                stream_params.sensor_type
            )
            logger.info("SSE UNSUBSCRIBE %s at %s", session_key, datetime.utcnow().isoformat())

    return EventSourceResponse(
        event_generator(),
        headers={"Access-Control-Allow-Origin": "http://localhost:4200"}
    )