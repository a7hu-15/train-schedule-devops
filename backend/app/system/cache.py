import logging
import json
import redis
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Mocked Redis connection for local testing without docker
# In production, uses REDIS_URL from env
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    # Test connection
    redis_client.ping()
    REDIS_AVAILABLE = True
except redis.ConnectionError:
    logger.info("[INFO] Redis unavailable.")
    logger.info("[INFO] Falling back to LocalMemoryCache.")
    REDIS_AVAILABLE = False
    _fallback_cache = {}

def update_operational_state(key: str, data: Dict[str, Any]):
    """Syncs the projected CQRS state into Redis."""
    try:
        json_data = json.dumps(data, default=str)
        if REDIS_AVAILABLE:
            redis_client.set(key, json_data)
        else:
            _fallback_cache[key] = json_data
    except Exception as e:
        logger.error(f"Failed to update operational state in cache for {key}: {e}")

def get_operational_state(key: str) -> Optional[Dict[str, Any]]:
    """Retrieves the projected CQRS state from Redis."""
    try:
        if REDIS_AVAILABLE:
            raw_data = redis_client.get(key)
        else:
            raw_data = _fallback_cache.get(key)
            
        if raw_data:
            return json.loads(raw_data)
        return None
    except Exception as e:
        logger.error(f"Failed to get operational state from cache for {key}: {e}")
        return None
