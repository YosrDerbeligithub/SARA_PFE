import httpx
from app.config import settings
import logging
from datetime import datetime
from pytz import timezone, UTC
import json


logger = logging.getLogger(__name__)


class APIClient:
    """
    Manages authentication and raw data fetching from the Sense API.
    Used by core.scheduler and SSE.
    """
    def __init__(self, email: str):
        self.token: str = ""
        self.email = email
        self.client = httpx.AsyncClient(base_url=settings.data_api_url)

    # Global cache: {email: (token, expires_at)}
    _token_cache = {}

    async def ensure_token(self):
        """
        Use cached token if valid, else refresh from Redis and update cache.
        """
        now = datetime.utcnow().replace(tzinfo=UTC)
        cached = APIClient._token_cache.get(self.email)
        if cached:
            token, exp = cached
            if exp > now:
                self.token = token
                return
        # Not cached or expired, refresh
        await self.refresh_token()
        # refresh_token updates self.token and cache

    async def refresh_token(self):
        """
        Grab the latest pre-fetched token out of Redis, under
          key = f"user:{self.email}:token"
        """
        from app.core.redis_client import redis_client
        key = f"user:{self.email}:token"
        raw = await redis_client.get(key)
        if not raw:
            raise RuntimeError(f"No token in Redis under {key}")
        # Spring stored a JSON-string payload {"token":…,"expiresAt":…}
        entry = json.loads(raw)
        exp = datetime.fromisoformat(entry["expiresAt"].replace("Z", "+00:00"))
        if exp < datetime.utcnow().replace(tzinfo=UTC):
            raise RuntimeError("Redis token expired at " + entry["expiresAt"])
        self.token = entry["token"]
        APIClient._token_cache[self.email] = (self.token, exp)
        logger.debug("Pulled token from Redis; expires at %s", entry["expiresAt"])

    async def fetch_data(self, facility: str, sensor_box_id: str, sensor_type: str):
        """
        Fetch new sensor readings for the given box and type.
        Returns a single record or dict (latest reading).
        """



        logger.debug("Fetching data for %s/%s", facility, sensor_box_id, sensor_type)
        try:
            facility_timezone = settings.FACILITY_TIMEZONES.get(facility, timezone("UTC"))
            current_date = datetime.now(facility_timezone).strftime("%Y-%m-%d")

            headers = {"Authorization": f"Bearer {self.token}"}
            # Limit to 1 record (latest)
            url = (
            f"/api/{facility}/{sensor_type}/range/"
            f"{sensor_box_id}/{current_date}/{current_date}/1/1"
          )


            
            logger.debug("Current date for facility %s: %s", facility, current_date)

            resp = await self.client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            logger.debug("Received %d data points for %s/%s", len(data), facility, sensor_box_id, sensor_type)
            return data[0] if data else None
        except httpx.HTTPStatusError as e:
            logger.error("Data fetch failed with status %s: %s", e.response.status_code, e.response.text)
            return None