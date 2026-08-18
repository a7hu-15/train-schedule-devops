import logging
from app.events.schemas import EventEnvelope
import json

def log_event(event: EventEnvelope, lifecycle_state: str):
    """
    Structured logger for tracing events through the pipeline.
    """
    log_data = {
        "event_id": event.event_id,
        "correlation_id": event.correlation_id,
        "parent_event_id": event.parent_event_id,
        "type": event.type,
        "severity": event.severity,
        "lifecycle_state": lifecycle_state
    }
    
    # In a real system, this might log to ELK/Datadog using json.dumps
    # For now, we use standard logging
    logging.info(f"EVENT_TRACE: {json.dumps(log_data)}")
