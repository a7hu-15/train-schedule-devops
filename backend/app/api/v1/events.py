from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
from app.events.schemas import EventEnvelope
from app.events.dispatcher import dispatcher
from app.system.storage import get_event_chain
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/ingest", status_code=202)
async def ingest_events(events: List[EventEnvelope], background_tasks: BackgroundTasks):
    """
    High-throughput ingestion API. 
    Validates the Event Envelope and hands off to the background pipeline.
    """
    if not events:
        raise HTTPException(status_code=400, detail="Empty event payload")
    
    for event in events:
        background_tasks.add_task(dispatcher.dispatch, event)
        
    return {"status": "accepted", "count": len(events)}

@router.get("/")
async def get_latest_events():
    """Returns recent events for the Operations Console."""
    from app.system.storage import get_recent_events
    events = get_recent_events(limit=50)
    return {"events": events}

@router.get("/{correlation_id}")
async def get_event_trace(correlation_id: str):
    """
    Returns the complete pipeline trace for a given correlation ID.
    Perfect for debugging and explaining event-driven architecture.
    """
    chain = get_event_chain(correlation_id)
    if not chain:
        raise HTTPException(status_code=404, detail="No events found for correlation ID")
    return {"correlation_id": correlation_id, "trace": chain}
