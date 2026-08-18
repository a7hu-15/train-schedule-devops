from typing import List
import uuid
from datetime import datetime

from app.events.schemas import EventEnvelope

def process_conflict(event: EventEnvelope) -> List[EventEnvelope]:
    """
    Consumes PlatformConflict.
    Generates RecommendationGenerated.
    """
    payload = event.payload
    
    if "station_code" not in payload or "overlap_minutes" not in payload:
        raise ValueError("Invalid payload for PlatformConflict")
        
    overlap = int(payload["overlap_minutes"])
    
    # Generate recommendation based on severity
    if overlap > 30:
        action = "HOLD_AT_OUTER_SIGNAL"
        confidence = 0.85
    else:
        action = "REASSIGN_PLATFORM"
        confidence = 0.95
        
    rec_payload = {
        "recommended_action": action,
        "recommended_platform": "6", # Mocked for V1
        "confidence_score": confidence
    }
    
    rec_event = EventEnvelope(
        event_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        source="SYSTEM",
        type="RecommendationGenerated",
        severity="INFO",
        payload=rec_payload
    )
    
    return [rec_event]
