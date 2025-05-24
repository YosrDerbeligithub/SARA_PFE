"""
Sensor Data Aggregation API (Container-Ready)
===============================================
Features:
- Secure API Key Authentication
- Hierarchical Time Aggregation with Roll-Up/Down (minute → hourly → etc.)
- Redis Caching with Dynamic TTLs (no persistent TimescaleDB storage)
- Supports both linear metrics (e.g., average, sum, count, min, max) and non-linear metrics (e.g., median, skewness)
- Returns visualization-ready aggregated results
- Implements robust error handling and logging
- Containerized configuration (aligns with docker-compose for sara-cache)
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Tuple, Union
import redis
from fastapi import FastAPI, HTTPException, Depends, Security, Request,Body
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader
from pydantic_settings import BaseSettings
from fastapi.responses import JSONResponse, StreamingResponse 
import uuid
from fastapi.responses import StreamingResponse
import numpy as np





from pydantic import BaseModel, Field, validator
import logging
import math
import json
import random
from fastapi import status
from dateutil.relativedelta import relativedelta
import asyncio
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import time
from httpx import AsyncClient, Limits, Timeout, HTTPStatusError,ReadTimeout
import httpx
import sys
from typing import Any

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Set the logging level to DEBUG
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)  # Log to stdout
    ]
)

# Get the logger for the current module
logger = logging.getLogger("historical_processing")



# --------------------------
# Configuration & Settings
# --------------------------

class Settings(BaseSettings):
    """
    Container-friendly configuration using environment variables.
    These values are injected via Docker Compose or .env file.
    """
    redis_host: str = "sara-cache"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: str = "melik1234"
    cache_historical_ttl: Dict[str, int] = {
        "minute": 604800,    # 7 days
        "hourly": 2592000,   # 30 days
        "daily": 7776000,    # 90 days
        "monthly": 31536000, # 1 year
        "yearly": 63072000   # 2 years
    }

    @property
    def redis_url(self) -> str:
        """Construct Redis URL from components"""
        return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}/{self.redis_db}"

    class Config:
        env_file = ".env"

settings = Settings()
app = FastAPI(
    title="Sensor Aggregation Service",
    description="API for hierarchical sensor data aggregation (using Redis caching only)",
    security=[{"Bearer": []}],  # Add security scheme

    version="1.0.0"
)
redis_client = redis.from_url(settings.redis_url, decode_responses=False)
logger = logging.getLogger("uvicorn.error")






# --------------------------
# Data Models (Timezone-Enhanced)
# --------------------------

class TimeGap(BaseModel):
    """
    Represents a time range for processing.
    Expected input: ISO 8601 datetime strings.
    """
    start: datetime = Field(..., description="Start time of the gap (ISO 8601 format)")
    end: datetime = Field(..., description="End time of the gap (ISO 8601 format)")

    @validator('start', 'end', pre=True)
    def ensure_utc(cls, value: datetime) -> datetime:
        """Convert any datetime to UTC timezone-aware object"""
        if isinstance(value, str):
            value = value.replace('Z', '+00:00')
            dt = datetime.fromisoformat(value)
        elif isinstance(value, datetime):
            dt = value
        else:
            raise ValueError("Invalid datetime format")

        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    class Config:
        json_encoders = {datetime: lambda dt: dt.isoformat()}

class SensorReading(BaseModel):
    """
    Represents a single sensor reading with full metadata.
    Matches the required response structure.
    """
    id: int = Field(..., description="Unique identifier for the reading")
    agentSerial: str = Field(..., description="Sensor module identifier") # make it a list
    deviceType: str = Field(..., description="Type of sensor device")
    reading: float = Field(..., description="Actual measured value")
    unit: str = Field(..., description="Measurement unit")
    timeOfReading: datetime = Field(..., description="Timestamp of measurement")
    timeOfCreate: datetime = Field(default_factory=lambda: datetime.now(timezone.utc),
                                 description="Timestamp of record creation")

    class Config:
        json_encoders = {datetime: lambda dt: dt.isoformat()}

class ProcessingRequest(BaseModel):
    """
    The processing request structure received from the API gateway.
    Contains sensor type, optional agent serial, one or more time ranges,
    desired aggregation level, and the statistical metric to compute.
    """
    facility: str = Field(..., pattern="^(uoa|istic)$")

    sensor_type: str = Field(
        ..., 
        pattern="^(humidity|luminance|microphone|motion|presence|radio|temperature|thermalmap|thermography)$",
        description="Type of sensor device (e.g., humidity, luminance, etc.)"
    )
    agent_serial: List[str] = Field(..., description="Sensor module identifier", min_items=1)

    start: datetime = Field(..., description="Start time of the time range (ISO 8601 format)")
    end: datetime = Field(..., description="End time of the time range (ISO 8601 format)")

    aggregation_level: str = Field(
        "minute", 
        pattern="^(minute|hourly|daily|monthly|yearly)$", 
        description="Aggregation level: minute, hourly, daily, monthly, or yearly"
    )
    metric: str = Field(
        ..., 
        pattern="^(average|sum|median|min|max|skewness|event_count|activity_percent|event_duration_avg|event_duration_max)$", 
        description="Statistical metric (e.g., average, sum, median, skewness)"
    )

    class Config:
        schema_extra = {
            "example": {
                "sensor_type": "temperature", 
                "start": "2023-10-01T00:00:00Z",
                "end": "2023-10-01T23:59:59Z",
                "aggregation_level": "hourly",
                "metric": "average"
            }
        }

class CacheClearResponse(BaseModel):
    status: str
    keys_deleted: int
    message: str









@app.middleware("http")
async def http_error_handler(request: Request, call_next):
    try:
        return await call_next(request)
    except HTTPStatusError as e:
        return JSONResponse(
            status_code=502,
            content={
                "error": "upstream_api_error",
                "detail": f"Historical API responded with {e.response.status_code}"
            }
        )
    except redis.RedisError as e:
        return JSONResponse(
            status_code=503,
            content={"error": "cache_unavailable", "detail": str(e)}
        )

# --------------------------
# Fetching data from data api
# --------------------------

def get_api_client() -> AsyncClient:
    """Create configured HTTPX client with connection pooling"""
    return AsyncClient(
        base_url="https://teamapps.u-aizu.ac.jp/sense",
        timeout=Timeout(15.0),
        limits=Limits(max_connections=20, max_keepalive_connections=10),
        follow_redirects=True
    )


async def ffetch_paginated_records_gdimaaaa(
    client: AsyncClient,
    facility: str,
    sensor_type: str,
    agent_serial: str,
    start_date: str,
    end_date: str,
    token: str,
    page_size: int = 1000000
) -> List[Dict]:
    """Fetch all pages for a specific agent/sensor/date range"""
    records = []
    page = 1
    max_retries = 3
    
    while True:
        try:
            # Build URL with parameters in path
            url = (
                f"/api/{facility}/{sensor_type}/range/{agent_serial}/"
                f"{start_date}/{end_date}/{page_size}/{page}"
            )
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/json"
            }
            
            response = await client.get(url, headers=headers)
            
            # Handle authentication errors
            if response.status_code == 401:
    # Propagate upstream auth errors instead of 'no data'
              raise HTTPException(
                 status_code=502,
                 detail=f"Failed to authenticate with Sense API for agent {agent_serial}"
           )

            # Verify JSON response
            content_type = response.headers.get('content-type', '')
            if 'application/json' not in content_type:
                logger.error(f"Unexpected content: {response.text[:200]}")
                break

            page_data = response.json()
            if not page_data:
                break
                
            records.extend(page_data)
            page += 1
            
            
        except HTTPStatusError as e:
            logger.error(f"API error: {str(e)}")
            break
        except json.JSONDecodeError:
            logger.error("Invalid JSON response")
            break
            
    return records

SENSE_TIMEOUT = httpx.Timeout(
    connect=5.0,   # seconds to establish TCP connection
    read=300.0,     # seconds to wait for the server response
    write=5.0,
    pool=None,
)

# Constants
API_HARD_CAP = 10000 
MAX_CONCURRENT = 20
MIN_PAGE_SIZE = 1000

async def fetch_paginated_records(
    client: httpx.AsyncClient,
    facility: str,
    sensor_type: str,
    agent_serial: str,
    start_date: str,
    end_date: str,
    token: str,
    page_size: int = 10000
) -> List[Dict]:
    """
    Fetch all pages for a specific agent/sensor/date range from the Sense API,
    with timeout handling, status-code checks, and concurrent pagination.
    """
    # 1) Prepare basic settings
    records: List[Dict] = []
    timeout = httpx.Timeout(connect=5.0, read=300.0, write=5.0, pool=None)
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    try:
        # 2) Estimate total records
        count_url = f"/api/{facility}/{sensor_type}/range/count/{agent_serial}/{start_date}/{end_date}"
        count_resp = await client.get(count_url, headers=headers, timeout=timeout)
        count_resp.raise_for_status()
        raw_count = count_resp.json()
        if isinstance(raw_count, dict):
            total_records = raw_count.get("count", 0)
        else:
            total_records = int(raw_count)

        # 3) Adjust page_size smartly
        if total_records > 0:
            ideal_chunk = math.ceil(total_records / MAX_CONCURRENT) # total records=20000 /20=1000,  (20000/60=333.33)/60=333.33 
            page_size = min(page_size, max(MIN_PAGE_SIZE, ideal_chunk), API_HARD_CAP, total_records)

        # 4) Shortcut: no records or single-page
        if total_records == 0:
            return []
        num_pages = math.ceil(total_records / page_size)
        if num_pages <= 1:
            # One shot
            url = (
                f"/api/{facility}/{sensor_type}/range/"
                f"{agent_serial}/{start_date}/{end_date}/{page_size}/1"
            )
            logger.debug(f"Fetching single page: {url}")
            resp = await client.get(url, headers=headers, timeout=timeout)
            resp.raise_for_status()
            return resp.json()[:total_records]

        # 5) Concurrent fetch setup
        concurrency = min(num_pages, MAX_CONCURRENT)
        tasks = []
        for page in range(1, concurrency + 1):
            url = (
                f"/api/{facility}/{sensor_type}/range/"
                f"{agent_serial}/{start_date}/{end_date}/{page_size}/{page}"
            )
            tasks.append(client.get(url, headers=headers, timeout=timeout))

        # 6) Gather and process
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        for resp in responses:
            if isinstance(resp, Exception):
                continue
            try:
                resp.raise_for_status()
            except HTTPStatusError:
                continue
            if "application/json" not in resp.headers.get("content-type", ""):
                continue
            try:
                data = resp.json()
            except json.JSONDecodeError:
                continue
            records.extend(data)

        # 7) Trim any excess
        return records[:total_records]

    except ReadTimeout:
        raise HTTPException(status_code=504,
            detail=f"Timeout fetching Sense data for agent {agent_serial}")
    except HTTPStatusError as exc:
        raise HTTPException(status_code=502,
            detail=(f"Sense API returned {exc.response.status_code} "
                    f"for count check: {exc.response.text}"))
    except Exception as exc:
        raise HTTPException(status_code=502,
            detail=f"Error fetching paginated records for {agent_serial}: {exc!r}")
    


async def fetch_raw_data(request: ProcessingRequest, token: str) -> List[Dict]:
    """
    Fetch raw data from the historical API for all agents in the request.
    Converts the start and end times to the required YYYY-MM-DD format.
    """
    # Convert to UTC dates in API-required format
    start_utc = request.start.astimezone(timezone.utc)
    end_utc = request.end.astimezone(timezone.utc)
    
    start_date = start_utc.strftime("%Y-%m-%d")  # Format as YYYY-MM-DD
    end_date = end_utc.strftime("%Y-%m-%d")      # Format as YYYY-MM-DD
    
    logger.debug(f"Formatted dates - Start: {start_date}, End: {end_date}")
    
    all_records = []
    error_count = 0
    
    async with get_api_client() as client:
        # Create tasks for concurrent fetching per agent
        tasks = []
        for agent in request.agent_serial:
            task = fetch_paginated_records(
                client=client,
                facility=request.facility,
                sensor_type=request.sensor_type,
                agent_serial=agent,
                start_date=start_date,
                end_date=end_date,
                token=token
            )
            tasks.append(task)
        
        # Process results with error handling
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for idx, result in enumerate(results):
            agent = request.agent_serial[idx]
            
            if isinstance(result, Exception):
                logger.error(f"Critical error fetching data for {agent}: {str(result)}")
                error_count += 1
                continue
                
            if not result:
                logger.warning(f"No data found for {agent}")
                continue
                
            logger.info(f"Fetched {len(result)} records for {agent}")
            all_records.extend(result)
            
    if error_count == len(request.agent_serial):
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch data from all specified agents"
        )
            
    return all_records


# --------------------------
# Helper Functions (Timezone-Aware)
# --------------------------

security = HTTPBearer()

async def get_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract and return Bearer token from Authorization header"""
    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication scheme",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return credentials.credentials

def get_unit_for_sensor(sensor_type: str) -> str:
    """
    Map sensor types to measurement units.
    :param sensor_type: Type of sensor (e.g., 'temperature')
    :return: Appropriate unit string
    """
    units = {
        "temperature": "°C",
        "moisture": "%",
        "microphone": "dB",
        "light": "lux",
        "default": "units",
        "PIR":"boolean",
        "camera+YOLO":"person",
        "BLE":"device",
        "thermometer": "°C",



    }
    return units.get(sensor_type.lower(), units["default"])

def get_lower_aggregation_level(current_level: str) -> Optional[str]:
    """
    Returns the immediate finer-grained aggregation level
    Example: get_lower_aggregation_level("hourly") → "minute"
    
    :param current_level: Current aggregation level (e.g., "hourly")
    :return: More granular level or None if at finest resolution
    """
    hierarchy = ["minute", "hourly", "daily", "monthly", "yearly"]
    try:
        current_index = hierarchy.index(current_level)
        return hierarchy[current_index - 1] if current_index > 0 else None
    except ValueError:
        return None

def is_linear_metric(metric: str) -> bool:
    """
    Determine whether the requested metric is linear (and cacheable).
    Linear metrics include: average, sum, count, min, max.
    :param metric: The metric name.
    :return: True if linear, False otherwise.
    """
    linear_metrics = {"average", "sum", "count", "min", "max"}
    return metric in linear_metrics

def normalize_time(timestamp: datetime, aggregation: str) -> datetime:
    """
    Normalize a timestamp to the start of its aggregation bucket in UTC.
    :param timestamp: Original timestamp (timezone-aware).
    :param aggregation: Aggregation level (minute, hourly, daily, etc.)
    :return: Timestamp rounded to the beginning of the bucket in UTC.
    """
    utc_time = timestamp.astimezone(timezone.utc)
    if aggregation == "minute":
        return utc_time.replace(second=0, microsecond=0)
    elif aggregation == "hourly":
        return utc_time.replace(minute=0, second=0, microsecond=0)
    elif aggregation == "daily":
        return utc_time.replace(hour=0, minute=0, second=0, microsecond=0)
    elif aggregation == "monthly":
        return utc_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif aggregation == "yearly":
        return utc_time.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    return utc_time



def get_aggregation_interval(level: str) -> timedelta:

    """
    Return the duration of one aggregation bucket for a given level.
    :param level: Aggregation level.
    :return: Time delta corresponding to that level.
    """
    intervals = {
        "minute": timedelta(minutes=1),
        "hourly": timedelta(hours=1),
        "daily": timedelta(days=1),
        "monthly": relativedelta(months=1),
        "yearly": relativedelta(years=1)
    }
    return intervals[level]




def generate_time_buckets(start: datetime, end: datetime, level: str) -> List[Tuple[datetime, datetime]]:
    """
    Generate a list of time buckets between start and end timestamps.
    :param start: Start timestamp (timezone-aware).
    :param end: End timestamp (timezone-aware).
    :param level: Aggregation level.
    :return: List of tuples (bucket_start, bucket_end) in UTC.
    """
    buckets = []
    current = normalize_time(start, level)
    interval = get_aggregation_interval(level)
    while current <= end:
        full_bucket_end = current + interval - timedelta(seconds=1)
        # If the full bucket extends beyond the requested end, treat this bucket as incomplete.
        if full_bucket_end >= end:
            bucket_end = end
        else:
            bucket_end = full_bucket_end
        buckets.append((current, bucket_end))
        current += interval
    return buckets




    
    

def calculate_ttl(aggregation_level: str, bucket_start: datetime) -> int:
    """
    Determines TTL for cached aggregates with timezone awareness.
    
    - If the aggregation is **complete**, set a long TTL.
    - If the aggregation is **ongoing**, expire it when the lower bucket resets.

    :param aggregation_level: The level of aggregation (yearly, monthly, daily, etc.)
    :param bucket_start: The start timestamp of the bucket (timezone-aware)
    :return: TTL in seconds (minimum 60 seconds)    """
    now = datetime.now(timezone.utc)
    bucket_start = bucket_start.astimezone(timezone.utc)
    interval = get_aggregation_interval(aggregation_level)
    bucket_end = bucket_start + interval

    # Historical complete bucket: use configured TTL
    if bucket_end < now:
        return settings.cache_historical_ttl.get(aggregation_level, 60)

    # Ongoing/future bucket: expire when next lower-level bucket starts
    lower_level = get_lower_aggregation_level(aggregation_level)
    if not lower_level:
        return 60  # Minute level has no lower level

    # Calculate next lower-level bucket start time
    current_lower_bucket_start = normalize_time(now, lower_level)
    lower_interval = get_aggregation_interval(lower_level)
    next_lower_bucket_start = current_lower_bucket_start + lower_interval

    ttl_seconds = (next_lower_bucket_start - now).total_seconds()
    return max(int(ttl_seconds), 60)  # Minimum 60 seconds




def generate_cache_key(request: ProcessingRequest, bucket_start: datetime, bucket_end: datetime) -> bytes:

    """
    Generate a cache key for a given aggregation bucket.
    The key format: aggregate:{sensor_type}:{agent_serial}:{aggregation_level}:{normalized_start}:{bucket_end}
    :param request: The processing request.
    :param bucket_start: The starting time of the bucket (UTC).
    :return: A byte-encoded cache key.
    """
    agent= ",".join(request.agent_serial)  # Join list into a string
    key_str = (
        f"aggregate:{request.sensor_type}:{agent}:"
        f"{request.aggregation_level}:{request.metric}:"
        f"{bucket_start.isoformat()}:{bucket_end.isoformat()}"
    )
    return key_str.encode('utf-8')



def get_group_key(timestamp: datetime, aggregation: str) -> str:
    """
    Return a grouping key for results (e.g., group by day when aggregation is hourly).
    :param timestamp: A normalized UTC timestamp.
    :param aggregation: Aggregation level.
    :return: Group key as a string.
    """
    if aggregation == "hourly":
        return timestamp.strftime("%Y-%m-%d")
    elif aggregation == "daily":
        return timestamp.strftime("%Y-%m")
    elif aggregation == "monthly":
        return timestamp.strftime("%Y")
    return "all"



def calculate_motion_metrics(values: List[float]) -> Dict[str, Union[float, int, Dict]]:

    """Calculate all motion-specific metrics in one pass which include 
Supported motion metrics:
- event_count: Number of motion events
- activity_percent: % of time with activity
- event_duration_avg: Average event length
- event_duration_max: Longest event length"""

    if not values:
        return {
            "event_count": 0,
            "activity_percent": 0.0,
            "event_duration_stats": {
                "average": 0.0,
                "max": 0.0,
                "total": 0.0
            }
        }

    # Event detection parameters (configurable)
    threshold = 0.5
    min_consecutive = 2
    
    events = []
    current_event = []
    
    for val in values:
        if val >= threshold:
            current_event.append(val)
        else:
            if len(current_event) >= min_consecutive:
                events.append({
                    "duration": len(current_event),
                    "max_prob": max(current_event)
                })
            current_event = []
    
    # Handle final event
    if len(current_event) >= min_consecutive:
        events.append({
            "duration": len(current_event),
            "max_prob": max(current_event)
        })

    # Calculate metrics
    event_count = len(events)
    active_frames = sum(e["duration"] for e in events)
    activity_percent = (active_frames / len(values)) * 100 if values else 0
    
    duration_stats = {
        "average": sum(e["duration"] for e in events)/event_count if event_count > 0 else 0,
        "max": max(e["duration"] for e in events) if events else 0,
        "total": active_frames
    }

    return {
        "event_count": event_count,
        "activity_percent": activity_percent,
        "event_duration_stats": duration_stats
    }

# --------------------------
# Core Processing Functions
# --------------------------



"""
def clean_data(raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:

    logger.info("Cleaning raw data")
    cleaned = []
    for entry in raw_data:
        try:
            cleaned.append({
                "id": entry["id"],
                "agentSerial": entry["agentSerial"],
                "deviceType": entry["deviceType"],
                "reading": float(entry["reading"]),
                "unit": entry["unit"],
                "timeOfReading": datetime.fromisoformat(
                    entry["timeOfReading"].replace('Z', '+00:00')
                ).astimezone(timezone.utc),
                "timeOfCreate": datetime.fromisoformat(
                    entry["timeOfCreate"].replace('Z', '+00:00')
                ).astimezone(timezone.utc)
            })
        except (KeyError, ValueError) as e:
            logger.warning(f"Skipping invalid data entry: {e}")
    return cleaned
"""

#optimize the clean data function.
async def clean_data(raw_data: List[Dict[str, Any]],sensor_type:str) -> List[Dict[str, Any]]:
    cleaned = []
    for entry in raw_data:
        try:
            device_type = sensor_type.lower()
            raw_reading = entry.get("reading", None)
            normalized_reading = 0.0
            
            # Sensor-specific normalization
            if "microphone" in device_type:
                normalized_reading = entry.get("average", 0.0)
            elif  "motion" in device_type:
                normalized_reading = 1.0 if raw_reading in [1, "1", True] else 0.0
            elif "thermalmap" in device_type or "thermography" in device_type:  # Handles thermalmap/thermography
                if isinstance(raw_reading, list):
                    flattened = [val for sublist in raw_reading for val in sublist]
                    normalized_reading = sum(flattened)/len(flattened) if flattened else 0.0
            
            else:  # Default for temperature, humidity, etc.
                normalized_reading = float(raw_reading) if raw_reading is not None else 0.0

            cleaned.append({
                **{k: v for k, v in entry.items() if k != "reading"},
                "reading": normalized_reading,
                "timeOfReading": datetime.fromisoformat(
                    entry["timeOfReading"].replace('Z', '+00:00')
                ).astimezone(timezone.utc)
            })
        except Exception as e:
            logger.warning(f"Data cleaning error: {str(e)}")
    return cleaned


def calculate_linear(values: List[float], metric: str) -> Dict[str, Any]:
    """
    Calculate linear metrics from a list of values.
    Supported metrics: average, sum, count, min, max.
    :param values: List of numeric values.
    :param metric: Metric to compute.
    :return: Dictionary with keys "value", "sum", and "count".
    """
    if not values:
        return {"value": None, "sum": 0.0, "count": 0}
    if metric == "average":
        total = sum(values)
        count = len(values)
        return {"value": total / count, "sum": total, "count": count}
    elif metric == "sum":
        total = sum(values)
        return {"value": total, "sum": total, "count": len(values)}
    elif metric == "min":
        return {"value": min(values), "sum": min(values), "count": len(values)}
    elif metric == "max":
        return {"value": max(values), "sum": max(values), "count": len(values)}
    else:
        raise ValueError(f"Unsupported linear metric: {metric}")
    




def calculate_non_linear(values: List[float], sensor_type: str, metric: str) -> Union[float, int, Dict]:
    """
    Enhanced non-linear calculator with sensor-type awareness
    Returns appropriate metric value based on sensor type
    """
    if not values:
        return None

    # Motion sensor special handling
    if sensor_type == "motion":
        motion_metrics = calculate_motion_metrics(values)
        
        if metric == "event_count":
            return float(motion_metrics["event_count"])
        elif metric == "activity_percent":
            return motion_metrics["activity_percent"]
        elif metric == "event_duration_avg":
            return motion_metrics["event_duration_stats"]["average"]
        elif metric == "event_duration_max":
            return motion_metrics["event_duration_stats"]["max"]
        else:
            raise ValueError(f"Invalid motion metric: {metric}")
    
    # General statistical metrics
    if metric == "median":
        sorted_vals = sorted(values)
        mid = len(sorted_vals) // 2
        return (sorted_vals[mid] + sorted_vals[~mid]) / 2
    
    if metric == "skewness":
        n = len(values)
        mean = sum(values) / n
        std_dev = math.sqrt(sum((x - mean)**2 for x in values) / n)
        return sum((x - mean)**3 for x in values) / n / (std_dev**3 + 1e-9)

    raise HTTPException(
        status_code=400,
        detail=f"Unsupported non-linear metric: {metric} for {sensor_type}"
    )

def calculate_non_lineeear(values: List[float], metric: str) -> float:
    """
    Calculate non-linear metrics directly from raw data.
    Supported metrics: median, skewness.
    :param values: List of numeric values.
    :param metric: Metric to compute.
    :return: Computed metric value.
    """
    if not values:
        return None
    if metric == "median":
        sorted_vals = sorted(values)
        n = len(sorted_vals)
        mid = n // 2
        if n % 2 == 0:
            return (sorted_vals[mid - 1] + sorted_vals[mid]) / 2
        else:
            return sorted_vals[mid]
    elif metric == "skewness":
        n = len(values)
        mean = sum(values) / n
        std_dev = math.sqrt(sum((x - mean) ** 2 for x in values) / n)
        if std_dev == 0:
            return 0
        skew = sum((x - mean) ** 3 for x in values) / n / (std_dev ** 3)
        return skew
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported non-linear metric: {metric}")
    

    

def aggregate_data(cleaned_data: List[Dict[str, Any]],sensor_type: str, aggregation_level: str, metric: str) -> List[Dict[str, Any]]:
    """
    Aggregate cleaned data into buckets based on the aggregation level.
    For linear metrics, compute aggregates (average, sum, count, min, max) for each bucket.
    :param cleaned_data: List of cleaned data records.
    :param aggregation_level: Desired aggregation level ("minute", "hourly", etc.).
    :param metric: Aggregation metric.
    :return: List of aggregated bucket dictionaries.
    """
    logger.info(f"Aggregating data by {aggregation_level} using {metric}")
    # Group data by device properties and time bucket
    buckets: Dict[Tuple[str, str, datetime], List[float]] = {}
    for record in cleaned_data:
        bucket = normalize_time(record["timeOfReading"], aggregation_level)
        key = (
            record["agentSerial"],
            record["deviceType"],
            bucket
        )
        buckets.setdefault(key, []).append(record["reading"])
    
    aggregated_results = []
    for (agent_serial, device_type, bucket), values in buckets.items():
        # Use linear aggregation function if metric is linear.
        if is_linear_metric(metric):
            agg = calculate_linear(values, metric)
            result = {
                "agentSerial": agent_serial,
                "deviceType": device_type,
                "timeOfReading": bucket,
                "reading": agg["value"],
                "unit": get_unit_for_sensor(device_type.split('_')[0]),  # Extract base sensor type
                "metadata": {
                    "aggregation_level": aggregation_level,
                    "metric": metric,
                    "sample_count": len(values)
                }
            }
        else:
            # For non-linear metrics, compute directly.
            result_value = calculate_non_linear(values, sensor_type, metric)

            result = {
                "agentSerial": agent_serial,
                "deviceType": device_type,
                "timeOfReading": bucket,
                "reading": result_value,
                "unit": get_unit_for_sensor(device_type.split('_')[0]),
                "metadata": {
                    "aggregation_level": aggregation_level,
                    "metric": metric,
                    "sample_count": len(values)
                }
            }
        aggregated_results.append(result)
    
    aggregated_results.sort(key=lambda x: x["timeOfReading"])
    return aggregated_results

async def rollup_aggregate(request: ProcessingRequest, bucket_start: datetime, bucket_end: datetime) -> Optional[Dict[str, Any]]:
    """
    Attempt to compute aggregates for a bucket by rolling up lower-level cached aggregates.
    :param request: The processing request.
    :param bucket_start: Start time of the higher-level bucket (UTC).
    :param bucket_end: End time of the higher-level bucket (UTC).
    :return: Aggregated metric dictionary if successful, or None if incomplete.
    """
    lower_level = get_lower_aggregation_level(request.aggregation_level)
    if not lower_level:
        return None
    lower_buckets = generate_time_buckets(bucket_start, bucket_end, lower_level)
    cache_keys = [generate_cache_key(request.copy(update={"aggregation_level": lower_level}), lb_start, lb_end) for lb_start, lb_end in lower_buckets]

    pipeline = redis_client.pipeline()
    for key in cache_keys:
        pipeline.hgetall(key)
    cached_values = pipeline.execute()
    # Filter out empty results
    cached_values = [val for val in cached_values if val]

    if len(cached_values) != len(cache_keys):
        return None  # Incomplete lower-level aggregates

    try:
        # For average, perform weighted average roll-up
        if request.metric == "average":
            total_sum = sum(float(item[b"sum"]) for item in cached_values)
            total_count = sum(int(item[b"count"]) for item in cached_values)
            return {
                "value": total_sum / total_count,
                "sum": total_sum,
                "count": total_count
            }
        # Extend for other linear metrics if needed.
    except KeyError as e:
        logger.error(f"Missing expected field in cache: {e}")
        return None

def sstore_aggregate(cache_key: bytes, data: Dict[str, Any], bucket_start: datetime, aggregation_level: str):
    """
    Store the computed aggregate in Redis with a dynamic TTL.
    :param cache_key: Cache key for the aggregate.
    :param data: Dictionary containing the aggregate data.
    :param bucket_start: Start of the aggregation bucket (UTC).
    :param aggregation_level: Aggregation level (minute, hourly, etc.)
    """
    ttl = calculate_ttl(aggregation_level, bucket_start)
    redis_client.hset(cache_key, mapping={k: str(v) for k, v in data.items()})
    redis_client.expire(cache_key, ttl)


def store_aggregate(cache_key: bytes, data: Dict[str, Any], 
                   bucket_start: datetime, aggregation_level: str) -> None:
    """
    Stores aggregated data in Redis while ensuring only one entry exists per time bucket.
    
    Key Features:
    1. Deletes all prior cache entries for the same aggregation bucket
    2. Stores new aggregate with dynamic TTL
    3. Maintains data integrity for hierarchical roll-ups

    Parameters:
    - cache_key: Pre-generated key containing bucket start/end times
    - data: Dictionary containing aggregated values (value, sum, count)
    - bucket_start: Normalized start time of the aggregation bucket
    - aggregation_level: Current aggregation level (e.g., "hourly")

    Workflow:
    1. Extracts the base pattern from the cache key (everything before the end time)
    2. Deletes the existing key matching this base pattern
    3. Stores the new aggregate with calculated TTL

    Example:
    For cache_key = b'aggregate:temp:agent1:hourly:avg:2023-10-01T14:00:00:2023-10-01T14:05:00'
    - Pattern becomes: aggregate:temp:agent1:hourly:avg:2023-10-01T14:00:00:*
    - Deletes all keys matching this pattern before storing new entry


     "aggregate:TemperatureSensor:AGENT001:minute:average:2022-03-10T14:02:00+00:00:2022   -03   -10   T14    :02:59+00:00"
    """

    #add switch cases 

    try:
        # 1. Create pattern to match all versions of this bucket
        key_str = cache_key.decode('utf-8')
        base_pattern = ":".join(key_str.split(":")[:-3]) + ":*"
        
        # 2. Delete existing entries for this bucket using SCAN (safe for production)
        cursor = '0'
        deleted_count = 0
        while cursor != 0:
            cursor, keys = redis_client.scan(cursor=cursor, match=base_pattern)
            if keys:
                deleted_count += redis_client.delete(*keys)
        
        logger.debug(f"Deleted {deleted_count} prior entries for pattern: {base_pattern}")

        # 3. Store new aggregate with TTL
        ttl = calculate_ttl(aggregation_level, bucket_start)
        pipeline = redis_client.pipeline()
        pipeline.hset(cache_key, mapping={k: str(v) for k, v in data.items()})
        pipeline.expire(cache_key, ttl)
        pipeline.execute()
        
        logger.info(f"Stored new aggregate: {key_str} with TTL: {ttl}s")

    except redis.RedisError as e:
        logger.error(f"Failed to store aggregate {cache_key}: {str(e)}")
        raise
    except Exception as e:
        logger.critical(f"Unexpected error in store_aggregate: {str(e)}")
        raise


# --------------------------
# Response Model
# --------------------------

class AggregatedResult(BaseModel):
    time: datetime
    value: float

class ProcessingResponse(BaseModel):
    agent_serial: List[str]  # Changed from Optional[str]
    sensor_type: str
    aggregation_level: str
    metric: str
    aggregated_results: Dict[str, List[AggregatedResult]]

    class Config:
        json_encoders = {datetime: lambda dt: dt.isoformat()}

# --------------------------
# Main API Endpoint: Process Data (Updated)

# --------------------------


@app.post("/process", response_model=ProcessingResponse)
# @app.post("/process", response_model=ProcessingResponse, dependencies=[Depends(get_token)])
async def process_data(request: ProcessingRequest, token: str = Depends(get_token)):
    """
    Main endpoint for processing historical sensor data.

    Workflow:
      1. For each time gap in the request:
         a. Generate time buckets based on the requested aggregation level.
         b. For each bucket:
             i. If the metric is linear, check the cache for a pre-computed aggregate.
             ii. If cached data is complete, use it.
             iii. Otherwise, attempt to roll up lower-level cached data.
             iv. If roll-up is not available, fetch raw data, clean it, and aggregate it.
             v. For linear metrics, store the computed aggregate in the cache.
         c. Collect aggregated results per time gap.
      2. Return aggregated data along with metadata.
    """

    timers = {}
    start_total = time.perf_counter()
    

    if request.aggregation_level == "minute":
        t0 = time.perf_counter()
        # Bypass cache and aggregation for minute-level requests
        raw_data = await fetch_raw_data(request, token=token)
        timers['fetch_raw_s'] = time.perf_counter() - t0

        t1 = time.perf_counter()
        cleaned_data = await clean_data(raw_data, request.sensor_type)
        timers['clean_s'] = time.perf_counter() - t1

        
        # Directly format raw records into response structure
        t2 = time.perf_counter()

        aggregated_results = {}
        for record in cleaned_data:
            if request.start <= record["timeOfReading"] <= request.end:
                bucket_start = normalize_time(record["timeOfReading"], "minute")
                group_key = get_group_key(bucket_start, "minute")
                
                if group_key not in aggregated_results:
                    aggregated_results[group_key] = []
                
                aggregated_results[group_key].append({
                    "time": bucket_start,
                    "value": record["reading"]
                })
        timers['aggregate_s'] = time.perf_counter() - t2

        timers['total_s'] = time.perf_counter() - start_total
        logger.debug(f"PROCESS TOTAL TIME: {timers['total_s']:.3f}s; components={timers}")
        
        return {
            "facility": request.facility,
            "agent_serial": request.agent_serial,
            "sensor_type": request.sensor_type,
            "aggregation_level": request.aggregation_level,
            "metric": "raw_reading",  # Or keep original metric if preferred
            "aggregated_results": {
                group: sorted(items, key=lambda x: x["time"])
                for group, items in aggregated_results.items()
            },
            "meta": {
                "total_buckets": len(cleaned_data),
                "cache_hits": 0,
                "raw_hits": len(cleaned_data),
                "empty_buckets": 0
            }
        }
    #----Main aggregation logic for non-minute levels----
    aggregated_results_overall = {}
    #Phase 1: Cache lookup

    t0 = time.perf_counter()

    use_cache = is_linear_metric(request.metric) and request.aggregation_level != "minute"
    gap = TimeGap(start=request.start, end=request.end)
    buckets = generate_time_buckets(gap.start, gap.end, request.aggregation_level)

    #for debugging purposes
    total_buckets = len(buckets)
    cache_hits = 0
    raw_hits = 0
    empty_buckets = 0

    # Step 1 — Try cache/roll-up first, track missing buckets
    buckets_to_process = []
    cached_results = {}

    for bucket_start, bucket_end in buckets:
        group_key = get_group_key(bucket_start, request.aggregation_level)
        cache_key = generate_cache_key(request, bucket_start, bucket_end)

        result_value = None

        if use_cache:
            cached = redis_client.hgetall(cache_key)
            if cached and cached.get(b"value"):
                try:
                    result_value = float(cached[b"value"])
                    logger.debug(f"Cache hit for {cache_key}: {result_value}")
                except Exception as e:
                    logger.warning(f"Error parsing cache for {cache_key}: {e}")

            if result_value is None:
                rolled_up = await rollup_aggregate(request, bucket_start, bucket_end)
                if rolled_up:
                    result_value = rolled_up["value"]
                    logger.debug(f"Roll-up hit for {cache_key}: {result_value}")
                    store_aggregate(cache_key, rolled_up, bucket_start, request.aggregation_level)

        if result_value is not None:
            cache_hits += 1

            # Cache/roll-up hit
            if group_key not in aggregated_results_overall:
                aggregated_results_overall[group_key] = []
            aggregated_results_overall[group_key].append({
                "time": bucket_start,
                "value": result_value
            })
        else:
            # Cache miss — will process later
            buckets_to_process.append((bucket_start, bucket_end, group_key, cache_key))



    # Phase 2 — One-time fetch and clean if there are missing buckets
    t1 = time.perf_counter()
    if buckets_to_process:
        raw_data = await fetch_raw_data(request, token=token)
        if not raw_data:
                logger.info(f"No raw data found for the request, returning empty result")
                
                return {
                    "facility": request.facility,
                    "agent_serial": request.agent_serial,
                    "sensor_type": request.sensor_type,
                    "aggregation_level": request.aggregation_level,
                    "metric": request.metric,
                    "aggregated_results": {},
                    "meta": {
                        "total_buckets": total_buckets,
                        "cache_hits": cache_hits,
                        "raw_hits": raw_hits,
                         "empty_buckets": empty_buckets
                            }
                        }
    

        cleaned_data = await clean_data(raw_data, request.sensor_type)
        in_window = [
            d for d in cleaned_data 
            if request.start <= d["timeOfReading"] <= request.end
        ]
        logger.info(f"{len(in_window)} records lie between {request.start} and {request.end}")
        timers['fetch_clean_s'] = time.perf_counter() - t1
        logger.debug(f"FETCH+CLEAN TIME: {timers['fetch_clean_s']:.3f}s")

        # Step 3 — Process missing buckets from raw data in memory
        for bucket_start, bucket_end, group_key, cache_key in buckets_to_process:
            # Filter data for the current bucket
            bucket_data = [
                d for d in cleaned_data
                if bucket_start <= d["timeOfReading"] < bucket_end # should it be <=?
            ]
            if not bucket_data:
                empty_buckets += 1

                continue
            raw_hits += 1

            aggregated = aggregate_data(bucket_data, request.sensor_type, request.aggregation_level, request.metric)
            if not aggregated:
                continue

            result_value = aggregated[0]["reading"]

            t2 = time.perf_counter()
            if use_cache:
                agg_result = {
                    "value": result_value,
                    "sum": sum(d["reading"] for d in bucket_data),
                    "count": len(bucket_data)
                }
                store_aggregate(cache_key, agg_result, bucket_start, request.aggregation_level)
            timers['cache_write_s'] = time.perf_counter() - t2
            logger.debug(f"CACHE WRITE TIME: {timers['cache_write_s']:.3f}s")

            if group_key not in aggregated_results_overall:
                aggregated_results_overall[group_key] = []

            aggregated_results_overall[group_key].append({
                "time": bucket_start,
                "value": result_value
            })



    if not aggregated_results_overall:
        logger.info(
            f"No data for sensor={request.sensor_type} agents={request.agent_serial} "
            f"from {request.start.isoformat()} to {request.end.isoformat()}"
        )

        logger.info(
        f"Aggregation complete for sensor={request.sensor_type}, "
        f"agent={request.agent_serial}, metric={request.metric} "
        f"from {request.start.isoformat()} to {request.end.isoformat()}. "
        f"{cache_hits}/{total_buckets} buckets served from cache, "
        f"{raw_hits} from raw data, {empty_buckets} empty buckets."
                   )

    return {
        "facility": request.facility,
        "agent_serial": request.agent_serial,
        "sensor_type": request.sensor_type,
        "aggregation_level": request.aggregation_level,
        "metric": request.metric,
        "aggregated_results": {
            group_key: sorted(items, key=lambda x: x["time"])
            for group_key, items in aggregated_results_overall.items()
        },

        "meta": {
            "total_buckets": total_buckets,
            "cache_hits": cache_hits,
            "raw_hits": raw_hits,
            "empty_buckets": empty_buckets
        }
    }



# … keep your existing imports and process_data(...) …

from fastapi.responses import StreamingResponse
from datetime import datetime
import json

# … keep your existing imports and your original `process_data` …

@app.post("/process/batched_stream")
async def process_data_batched_stream(
    request: ProcessingRequest,
    token: str = Depends(get_token),
):
    """
    Streams the exact same fields as /process, but in daily-size chunks
    of `aggregated_results`.  All datetime objects are converted to ISO.
    """
    # 1) Call your original handler to get the full response dict
    full: dict = await process_data(request, token)

    # 2) Convert every datetime under `aggregated_results` into ISO-strings
    raw_results: dict = full["aggregated_results"]
    stringified_results = {
        group: [
            {
                "time": (item["time"].isoformat()
                         if isinstance(item["time"], datetime)
                         else item["time"]),
                "value": item["value"]
            }
            for item in items
        ]
        for group, items in raw_results.items()
    }

    # 3) Pull out meta and the other top-level fields
    meta = full["meta"]
    facility          = full["facility"]
    agent_serial      = full["agent_serial"]
    sensor_type       = full["sensor_type"]
    aggregation_level = full["aggregation_level"]
    metric            = full["metric"]

    # 4) Batch into “one day” (1440 minute-buckets) per JSON chunk
    async def batch_generator():
        batch_size = 24 * 60  # one day's worth of minute buckets
        entries = list(stringified_results.items())  # [(group, [ {time, value} ]), …]

        for i in range(0, len(entries), batch_size):
            chunk = dict(entries[i : i + batch_size])
            payload = {
                "facility":           facility,
                "agent_serial":       agent_serial,
                "sensor_type":        sensor_type,
                "aggregation_level":  aggregation_level,
                "metric":             metric,
                "aggregated_results": chunk,
                "meta":               meta
            }
            # NDJSON: one JSON object per line
            yield json.dumps(payload) + "\n"

    return StreamingResponse(
        batch_generator(),
        media_type="application/x-ndjson"
    )




# --------------------------
# Health Check Endpoint
# --------------------------

@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify service availability and Redis connection.
    :return: JSON with service status, Redis connectivity status, and current UTC timestamp.
    """
    try:
        redis_status = redis_client.ping()
    except Exception as e:
        logger.error(f"Redis health check failed: {str(e)}")
        redis_status = False
    return {
        "status": "OK",
        "redis_connected": redis_status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# --------------------------
# Entry Point for Clearing the cache
# --------------------------



@app.delete(
    "/cache/clear",
    response_model=CacheClearResponse,
    status_code=status.HTTP_202_ACCEPTED
)
async def clear_cache():
    """
    Securely clear all cached aggregation results.
    Requires valid API key.
    """
    try:
        # Use SCAN instead of KEYS for better performance
        cursor = "0"
        cache_keys = []
        while cursor != 0:
            cursor, keys = redis_client.scan(cursor=cursor, match="aggregate:*")
            cache_keys.extend(keys)
        
        if not cache_keys:
            return {
                "status": "success",
                "keys_deleted": 0,
                "message": "Cache already empty"
            }
        
        # Delete keys in batches for large datasets
        pipeline = redis_client.pipeline()
        for key in cache_keys:
            pipeline.delete(key)
        results = pipeline.execute()
        
        deleted_count = sum(results)
        logger.warning(f"Cache cleared by admin: {deleted_count} keys removed")
        
        return {
            "status": "success",
            "keys_deleted": deleted_count,
            "message": f"Successfully cleared {deleted_count} cache entries"
        }
        
    except redis.RedisError as e:
        logger.error(f"Cache clearance failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cache clearance failed due to storage connection issue"
        )




# --------------------------
# BLE data endpoint
# --------------------------

class RadioDevicesAtTimeRequest(BaseModel):
    facility: str = Field(..., pattern="^(uoa|istic)$")
    agent_serial: str = Field(..., description="Sensor module identifier")
    timestamp: datetime = Field(..., description="ISO 8601 timestamp (UTC)")

class RadioDevicesAtTimeResponse(BaseModel):
    time: datetime
    devices: List[Dict[str, Any]]

@app.post("/radio/devices_at_time", response_model=RadioDevicesAtTimeResponse)
async def radio_devices_at_time(
    request: RadioDevicesAtTimeRequest = Body(...),
    token: str = Depends(get_token)
):
    """
    Returns the array of radio devices for a given agent and timestamp (minute precision).
    """
    # 1. Convert timestamp to UTC and extract date for API
    ts_utc = request.timestamp.astimezone(timezone.utc)
    date_str = ts_utc.strftime("%Y-%m-%d")

    # 2. Build a ProcessingRequest for radio sensor, minute-level, for that agent and day
    proc_req = ProcessingRequest(
        facility=request.facility,
        sensor_type="radio",
        agent_serial=[request.agent_serial],
        start=ts_utc.replace(hour=0, minute=0, second=0, microsecond=0),
        end=ts_utc.replace(hour=23, minute=59, second=59, microsecond=999999),
        aggregation_level="minute",
        metric="average"  # metric is not used for raw fetch
    )

    # 3. Fetch all radio data for that day
    raw_data = await fetch_raw_data(proc_req, token=token)
    logger.debug(f"count: {len(raw_data)} raw data entries for {request.agent_serial} on {date_str}")


    # 4. Find the entry matching the requested timestamp (minute precision)
    target_minute = ts_utc.replace(second=0, microsecond=0)
    found_entry = None
    logger.debug(f"target_minute: {target_minute}")
    logger.debug(f"about to loop through {len(raw_data)} entries")
    for entry in raw_data:
        logger.debug(f"entry: {entry}")
        logger.debug(f"entry_time: {entry['timeOfReading']}")
        try:
            entry_time = datetime.fromisoformat(entry["timeOfReading"].replace('Z', '+00:00')).astimezone(timezone.utc)
            logger.debug(f"this is the entry_time: {entry_time}")

            if entry_time.replace(second=0, microsecond=0) == target_minute:
                logger.debug(f"this is the entry_time: {entry_time}")
                logger.debug(f"this is the target_minute: {target_minute}")
                found_entry = entry
                logger.debug(f"Found matching entry: {entry}")
                break
        except Exception:
            continue

    devices = found_entry.get("devices", []) if found_entry else []

    return {
        "time": ts_utc,
        "devices": devices
    }


# --------------------------
# Thermalmap data endpoint
# --------------------------

class ThermalmapAtTimeRequest(BaseModel):
    facility: str = Field(..., pattern="^(uoa|istic)$")
    agent_serial: str = Field(..., description="Sensor module identifier")
    timestamp: datetime = Field(..., description="ISO 8601 timestamp (UTC)")

class ThermalmapAtTimeResponse(BaseModel):
    time: datetime
    reading: List[List[float]]

@app.post("/thermalmap/reading_at_time", response_model=ThermalmapAtTimeResponse)
async def thermalmap_reading_at_time(
    request: ThermalmapAtTimeRequest = Body(...),
    token: str = Depends(get_token)
):
    """
    Returns the thermalmap matrix for a given agent and timestamp (minute precision).
    """
    ts_utc = request.timestamp.astimezone(timezone.utc)

    proc_req = ProcessingRequest(
        facility=request.facility,
        sensor_type="thermalmap",
        agent_serial=[request.agent_serial],
        start=ts_utc.replace(hour=0, minute=0, second=0, microsecond=0),
        end=ts_utc.replace(hour=23, minute=59, second=59, microsecond=999999),
        aggregation_level="minute",
        metric="average"  # metric is not used for raw fetch
    )

    raw_data = await fetch_raw_data(proc_req, token=token)

    target_minute = ts_utc.replace(second=0, microsecond=0)
    found_entry = None
    for entry in raw_data:
        try:
            entry_time = datetime.fromisoformat(entry["timeOfReading"].replace('Z', '+00:00')).astimezone(timezone.utc)
            if entry_time.replace(second=0, microsecond=0) == target_minute:
                found_entry = entry
                break
        except Exception:
            continue

    reading = found_entry.get("reading", []) if found_entry else []

    return {
        "time": ts_utc,
        "reading": reading
    }

