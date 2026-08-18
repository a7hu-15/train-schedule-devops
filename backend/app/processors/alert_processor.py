from typing import List
import logging

from app.events.schemas import EventEnvelope

logger = logging.getLogger(__name__)

def process_alert(event: EventEnvelope) -> List[EventEnvelope]:
    """
    Consumes AlertGenerated.
    Final processor. Returns no more events.
    """
    payload = event.payload
    
    if "title" not in payload:
        raise ValueError("Invalid payload for AlertGenerated")
        
    logger.info(f"ALERT DISPATCHED: {payload['title']} - {payload.get('description', '')}")
    
    # End of the chain
    return []
