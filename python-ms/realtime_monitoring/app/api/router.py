# realtime_monitoring/app/api/sse_stream.py
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

logger = logging.getLogger(__name__)

stream_router = APIRouter()
state = SessionState()
bus = EventBus()

# Dependency to parse and validate StreamRequest
async def get_stream_params(
    facility: str, sensor_box_id: str, sensor_type: str
) -> StreamRequest:
    return StreamRequest(
        facility=facility,
        sensor_box_id=sensor_box_id,
        sensor_type=sensor_type
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
        # 1) Subscribe
        bus.subscribe(stream_params.facility, stream_params.sensor_box_id, stream_params.sensor_type)
        logger.info("SSE SUBSCRIBE %s at %s", session_key, datetime.utcnow().isoformat())

        # 2) Immediate one-off fetch so client doesn’t wait
        client = APIClient()
        await client.refresh_token()
        initial = await client.fetch_data(
            stream_params.facility,
            stream_params.sensor_box_id,
            stream_params.sensor_type
        )
        if initial:
            bus.publish(stream_params.facility, stream_params.sensor_box_id, stream_params.sensor_type, initial)

        freq = control.frequency or settings.default_sse_frequency
        logger.info("SSE frequency set to %d seconds for %s", freq, session_key)

        try:
            while True:
                # 3) Exit if client closed the connection
                if await request.is_disconnected():
                    logger.info("Client disconnected for %s — exiting generator", session_key)
                    break

                # 4) Pause logic
                if state.is_paused(session_key):
                    await asyncio.sleep(1)
                    continue

                # 5) Publish only real readings
                data = bus.get_latest(stream_params.facility, stream_params.sensor_box_id, stream_params.sensor_type)
                if data and data.get("reading") is not None:
                    # aggregation
                    if control.aggregation_metric and control.buffer_time:
                        agg.add(data)
                        payload = agg.compute()
                    else:
                        payload = data

                    yield {
                        "event": "update",
                        "data": json.dumps(payload, default=str)
                    }

                await asyncio.sleep(freq)

        finally:
            # 6) Always unsubscribe once
            bus.unsubscribe(stream_params.facility, stream_params.sensor_box_id, stream_params.sensor_type)
            logger.info("SSE UNSUBSCRIBE %s at %s", session_key, datetime.utcnow().isoformat())

    return EventSourceResponse(
        event_generator(),
        headers={"Access-Control-Allow-Origin": "http://localhost:4200"}
    )
