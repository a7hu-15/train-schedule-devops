from typing import Dict, List, Callable
from app.events.schemas import EventEnvelope
import logging

from app.processors.delay_processor import process_delay
from app.processors.conflict_processor import process_conflict
from app.processors.recommendation_processor import process_recommendation
from app.processors.alert_processor import process_alert

logger = logging.getLogger(__name__)

# This is populated by importing the processors
# Mapping of Event Type -> List of Processors
EVENT_REGISTRY: Dict[str, List[Callable[[EventEnvelope], List[EventEnvelope]]]] = {
    "TrainDelayed": [process_delay],
    "PlatformConflict": [process_conflict],
    "RecommendationGenerated": [process_recommendation],
    "AlertGenerated": [process_alert]
}

def register_processor(event_type: str):
    """Decorator to register a processor function for a specific event type."""
    def decorator(func: Callable[[EventEnvelope], List[EventEnvelope]]):
        if event_type not in EVENT_REGISTRY:
            EVENT_REGISTRY[event_type] = []
        EVENT_REGISTRY[event_type].append(func)
        logger.info(f"Registered processor {func.__name__} for event {event_type}")
        return func
    return decorator
