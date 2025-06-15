import asyncio
from app.services.fetcher import APIClient
from app.services.event_bus import EventBus
from app.config import settings
import logging
from datetime import datetime


logger = logging.getLogger(__name__)

async def start_scheduler():
    bus = EventBus()
    logger.info("Initializing scheduler with boxes: %s", bus.subscriptions)

    async def fetch_loop():
        logger.info("Starting data fetch loop")
        while True:
            try:
                subs = list(bus.subscriptions)  # (email, facility, box, sensor)
                logger.debug("Current subscriptions: %s", subs)

                if not subs:
                    logger.info("No active subscriptions, skipping fetch")
                    await asyncio.sleep(settings.fetch_interval)
                    continue

                clients = [APIClient(email=email) for email, _, _, _ in subs]

                # Parallelize token ensures
                await asyncio.gather(*(client.ensure_token() for client in clients))

                # Parallelize fetches
                fetch_tasks = [
                    asyncio.create_task(client.fetch_data(facility, box, sensor))
                    for client, (email, facility, box, sensor) in zip(clients, subs)
                ]
                results = await asyncio.gather(*fetch_tasks, return_exceptions=True)

                for (email, facility, box, sensor), result in zip(subs, results):
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

                await asyncio.sleep(settings.fetch_interval)

            except Exception as e:
                logger.error("Fetch loop error: %s", str(e))

    asyncio.create_task(fetch_loop())