import pytest
import uuid
from datetime import datetime
from app.events.schemas import EventEnvelope
from app.system.storage import save_event, load_event

def test_storage_persistence():
    """
    Verifies that the SQLAlchemy event store can save and load an EventEnvelope.
    """
    event = EventEnvelope(
        event_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        source="SYSTEM",
        type="TestEvent",
        severity="INFO",
        payload={"key": "value"}
    )
    
    # 1. Save Event
    save_event(event, "RECEIVED")
    
    # 2. Load Event
    loaded = load_event(event.event_id)
    
    # 3. Verify
    assert loaded is not None
    assert loaded.event_id == event.event_id
    assert loaded.type == "TestEvent"
    assert loaded.payload["key"] == "value"
