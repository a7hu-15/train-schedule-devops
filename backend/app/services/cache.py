import json
import logging
from typing import Optional, Any
import redis
from app.core.config import settings

logger = logging.getLogger("railpulse.cache")

class CacheService:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self._memory_cache = {}
        try:
            self.redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2)
            self.redis_client.ping()
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            logger.warning(f"Redis not available ({e}). Falling back to in-memory cache.")
            self.redis_client = None

    def get(self, key: str) -> Optional[Any]:
        if self.redis_client:
            try:
                data = self.redis_client.get(key)
                return json.loads(data) if data else None
            except Exception as e:
                logger.error(f"Redis GET error for key '{key}': {e}")
                return self._memory_cache.get(key)
        return self._memory_cache.get(key)

    def set(self, key: str, value: Any, ttl: Optional[int] = None, ttl_seconds: int = 60) -> bool:
        expire_seconds = ttl if ttl is not None else ttl_seconds
        serialized = json.dumps(value)
        if self.redis_client:
            try:
                self.redis_client.setex(key, expire_seconds, serialized)
                return True
            except Exception as e:
                logger.error(f"Redis SET error for key '{key}': {e}")
        self._memory_cache[key] = value
        return True

    def delete(self, key: str) -> bool:
        if self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception as e:
                logger.error(f"Redis DELETE error for key '{key}': {e}")
        self._memory_cache.pop(key, None)
        return True

cache_service = CacheService()
