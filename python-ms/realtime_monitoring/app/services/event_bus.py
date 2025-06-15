import asyncio
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class EventBus:
    """
    In-memory pub/sub. Stores the latest reading per sensor.
    Used by scheduler to publish and by SSE to consume.
    """
    _instance = None  # Static variable to hold the single instance

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(EventBus, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    def __init__(self):
        # Initialize only once
        if not hasattr(self, "latest"):
            self.latest: dict[tuple[str, str, str], dict] = {}
        if not hasattr(self, "subscriptions"):
            # Now track (email, facility, box, sensor)
            self.subscriptions: set[tuple[str, str, str, str]] = set()
        if not hasattr(self, "events"):
            # One asyncio.Event per sensor key
            self.events: dict[tuple[str, str, str], asyncio.Event] = defaultdict(asyncio.Event)

    def subscribe(self, email: str, facility: str, box_id: str, sensor_type: str):
        """
        Add a subscription for a specific sensor box and type.

        """
        logger.info("New subscription: %s/%s", box_id, sensor_type)
        self.subscriptions.add((email, facility, box_id, sensor_type))

    def unsubscribe(self, email: str, facility: str, box_id: str, sensor_type: str):
        """
        Remove a subscription for a specific sensor box and type.
        """
        logger.info("Unsubscribing: %s/%s", box_id, sensor_type)
        self.subscriptions.discard((email, facility, box_id, sensor_type))

    def publish(self, facility: str, box_id: str, sensor_type: str, data: dict):  
        """
        Store latest data for sensor. Overwrites previous.
        Called by scheduler after each fetch.
    
        """
        logger.debug("Publishing data for %s/%s", box_id, sensor_type)
        key = (facility, box_id, sensor_type)
        self.latest[key] = data
        logger.info("Published data for %s/%s: %s", facility, box_id, sensor_type, data)
        # Notify all listeners
        if key not in self.events:
            self.events[key] = asyncio.Event()
        self.events[key].set()

    def get_latest(self, facility: str, box_id: str, sensor_type: str) -> dict:
        """
        Return the most recent data point (raw) for this sensor.
        Called by SSE event_generator.
        """
        return self.latest.get((facility, box_id, sensor_type), {})

    async def wait_for_update(self, facility: str, box_id: str, sensor_type: str):
        """
        Wait until there is a new update for the given sensor.
        """
        key = (facility, box_id, sensor_type)
        if key not in self.events:
            self.events[key] = asyncio.Event()
        event = self.events[key]
        await event.wait()
        event.clear()