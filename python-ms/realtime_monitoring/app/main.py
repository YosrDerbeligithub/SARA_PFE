# realtime_monitoring/app/main.py
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI
import logging

from app.api.router import stream_router as router
from app.core.scheduler import start_scheduler

app = FastAPI(
    title="Real-Time Sensor Monitoring Service",
    description="Server-Sent Events for live sensor data with user controls",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Angular dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Include API routes
app.include_router(router, prefix="/monitoring", tags=["monitoring"])

# On startup, launch background tasks
@app.on_event("startup")
async def on_startup():
    """
    Called when FastAPI starts. Kick off scheduler tasks:
    - Token refresh
    - Data fetching
    """
    logger.info("Starting application startup sequence")
    try:
        await start_scheduler()
    except Exception as e:
        logger.error(f"Failed to start scheduler: {str(e)}")
        raise
