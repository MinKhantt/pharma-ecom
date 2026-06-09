import redis.asyncio as redis
from app.core.config import settings

_pool = redis.ConnectionPool(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=0,
    decode_responses=True,
    max_connections=20,
    socket_connect_timeout=5,
    socket_timeout=5,
)
redis_client = redis.Redis(connection_pool=_pool)

_pubsub_pool = redis.ConnectionPool(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=0,
    decode_responses=True,
    max_connections=10,
    socket_connect_timeout=5,
    socket_timeout=None,
)
pubsub_client = redis.Redis(connection_pool=_pubsub_pool)

async def blacklist_token(token: str, expire_seconds: int) -> None:
    await redis_client.setex(f"blacklist:{token}", expire_seconds, "1")


async def is_token_blacklisted(token: str) -> bool:
    result = await redis_client.get(f"blacklist:{token}")
    return result is not None
