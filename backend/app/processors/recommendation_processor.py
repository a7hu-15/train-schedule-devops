from typing import List
import uuid
from datetime import datetime

from app.events.schemas import EventEnvelope

def process_recommendation(event: EventEnvelope) -> List[EventEnvelope]:
    """
    Consumes RecommendationGenerated.
    Generates AlertGenerated.
    """
    payload = event.payload
    
    if "recommended_action" not in payload:
        raise ValueError("Invalid payload for RecommendationGenerated")
        
    action = payload["recommended_action"]
    
    alert_payload = {
        "title": "Action Required: Platform Conflict",
        "description": f"System recommends: {action}",
        "severity": "HIGH",
        "recommended_action": action
    }
    
    alert_event = EventEnvelope(
        event_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        source="SYSTEM",
        type="AlertGenerated",
        severity="WARNING",
        payload=alert_payload
    )
    
    return [alert_event]
