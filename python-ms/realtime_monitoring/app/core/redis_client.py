import redis.asyncio as aioredis
from app.config import settings

# Single, process-wide connection pool
redis_client: aioredis.Redis = aioredis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)