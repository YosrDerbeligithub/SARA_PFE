import asyncio
from app.services.fetcher import APIClient
from app.services.event_bus import EventBus
from app.config import settings
import logging
from datetime import datetime


logger = logging.getLogger(__name__)

async def start_scheduler():
    """
    Launch background tasks:
     - Token refresh every settings.token_refresh_interval
     - Data fetch every settings.fetch_interval
    Called by: main.on_startup
    """
    client = APIClient()
    bus = EventBus()
    logger.info("Initializing scheduler with boxes: %s", bus.subscriptions)

    async def token_loop():
        logger.info("Starting token refresh loop")
        while True:
            try:
                logger.debug("Attempting token refresh")
                await client.refresh_token()
                logger.info("Token refresh successful: %s", str(client.token))
            except Exception as e:
                logger.error(f"Token refresh failed: %s", str(e))
            await asyncio.sleep(settings.token_refresh_interval)

    async def fetch_loop():
        logger.info("Starting data fetch loop")
        while True:
            try:
                subs = list(bus.subscriptions)
                logger.debug("Current subscriptions: %s", subs)

                if not subs:
                    logger.info("No active subscriptions, skipping fetch")
                    await asyncio.sleep(settings.fetch_interval)
                    continue

                # 1) Créer une tâche pour chaque fetch_data
                fetch_tasks = [
                    asyncio.create_task(client.fetch_data(facility, box, sensor))
                    for facility, box, sensor in subs
                ]

                # 2) Attendre que toutes les tâches se terminent
                results = await asyncio.gather(*fetch_tasks, return_exceptions=True)

                # 3) Parcourir les résultats et publier
                for (facility, box, sensor), result in zip(subs, results):
                    if isinstance(result, Exception):
                        logger.error("Failed to fetch %s/%s: %s", box, sensor, result)
                        continue
                    data = result
                    if data:
                        bus.publish(facility, box, sensor, data)
                        logger.info(
                            "PUBLISHED %s/%s/%s at %s",
                            facility, box, sensor,
                            datetime.utcnow().strftime("%H:%M:%S")
                        )                    
                    else:
                        logger.warning("No data received for %s/%s", box, sensor)

                # 4) Pause avant le prochain cycle
                await asyncio.sleep(settings.fetch_interval)

            except Exception as e:
                logger.error("Fetch loop error: %s", str(e))

    # Schedule tasks
    asyncio.create_task(token_loop())
    asyncio.create_task(fetch_loop())
