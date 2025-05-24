from collections import deque
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class Aggregator:
    """
    Buffers raw data points and computes a chosen statistic.
    Used in SSE stream to generate aggregated payloads.
    """
    def __init__(self, metric: str = None, buffer_time: int = None):
        self.metric = metric
        self.buffer_time = timedelta(seconds=buffer_time or 0)
        self.buffer = deque()
        logger.info("Aggregator initialized with compute method")

    def add(self, data: dict):
        """
        Add new data to buffer and evict stale entries.
        Each item is timestamped by arrival time.
        """
        logger.info("Adding data to buffer")
        now = datetime.utcnow()
        self.buffer.append((now, data))
        cutoff = now - self.buffer_time
        while self.buffer and self.buffer[0][0] < cutoff:
            self.buffer.popleft()

    def compute(self) -> dict:
        """
        Compute the metric over buffered values, preserving metadata from the latest data point.
        Supports: 'average', 'sum', 'max', 'min', 'count', 'latest'
        """
        values = [d['reading'] for _, d in self.buffer if 'reading' in d]
        if not values:
            return {}

        # Get metadata from most recent data point (preserves id, unit, timestamps, etc)
        latest_data = self.buffer[-1][1].copy()  # Copy to avoid modifying original
        
        # Compute metric and update reading
        if self.metric == 'average':
            latest_data['reading'] = sum(values) / len(values)
        elif self.metric == 'sum':
            latest_data['reading'] = sum(values)
        elif self.metric == 'max':
            latest_data['reading'] = max(values)
        elif self.metric == 'min':
            latest_data['reading'] = min(values)
        elif self.metric == 'count':
            latest_data['reading'] = len(values)
        elif self.metric == 'latest':
            latest_data['reading'] = values[-1]
        else:
            return {}
        
        return latest_data