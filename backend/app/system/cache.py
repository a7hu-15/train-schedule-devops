import logging
import json
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Simplified to LocalMemoryCache since Redis is not being used
_fallback_cache = {}

def update_operational_state(key: str, data: Dict[str, Any]):
    """Syncs the projected CQRS state into local memory cache."""
    try:
        json_data = json.dumps(data, default=str)
        _fallback_cache[key] = json_data
    except Exception as e:
        logger.error(f"Failed to update operational state in cache for {key}: {e}")

def get_operational_state(key: str) -> Optional[Dict[str, Any]]:
    """Retrieves the projected CQRS state from local memory cache."""
    try:
        raw_data = _fallback_cache.get(key)
        if raw_data:
            return json.loads(raw_data)
        return None
    except Exception as e:
        logger.error(f"Failed to get operational state from cache for {key}: {e}")
        return None
