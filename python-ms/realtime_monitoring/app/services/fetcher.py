import httpx
from app.config import settings
import logging
from datetime import datetime
from pytz import timezone  


logger = logging.getLogger(__name__)


class APIClient:
    """
    Manages authentication and raw data fetching from the Sense API.
    Used by core.scheduler.
    """
    def __init__(self):
        self.token: str = ""
        # Keep one AsyncClient alive through the life of the app
        self.client = httpx.AsyncClient(base_url=settings.data_api_url)

    async def refresh_token(self):
        logger.info("Refreshing API token...")

        """
        Obtain a new Bearer token from the API.
        Called periodically by scheduler.

        """
        try:
            data = {
                'username': settings.api_username,
                'password': settings.api_password,
                'grant_type': 'password'
            }
            resp = await self.client.post("/auth/token", data=data)
            resp.raise_for_status()
            self.token = resp.text.strip()
            logger.info("Token refreshed successfully(from fetcher class): %s", str(self.token))

        except httpx.HTTPStatusError as e:
            logger.error("Token refresh failed with status %s: %s", e.response.status_code, e.response.text)


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