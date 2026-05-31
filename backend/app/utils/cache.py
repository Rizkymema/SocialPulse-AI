from __future__ import annotations

import logging
from typing import Optional

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

# Lazy-initialised async Redis client
_redis: Optional[aioredis.Redis] = None


def _get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


async def get_cache(key: str) -> Optional[str]:
    """Return the cached value for *key*, or None if absent / error."""
    try:
        return await _get_redis().get(key)
    except Exception as exc:
        logger.warning("Redis GET failed for key %r: %s", key, exc)
        return None


async def set_cache(key: str, value: str, ttl: int = settings.CACHE_TTL) -> None:
    """Store *value* under *key* with an optional TTL (seconds)."""
    try:
        await _get_redis().set(key, value, ex=ttl)
    except Exception as exc:
        logger.warning("Redis SET failed for key %r: %s", key, exc)


async def delete_cache(key: str) -> None:
    """Delete a key from cache."""
    try:
        await _get_redis().delete(key)
    except Exception as exc:
        logger.warning("Redis DEL failed for key %r: %s", key, exc)


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None
