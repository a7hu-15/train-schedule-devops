import pytest
import uuid
from datetime import datetime
from app.events.schemas import EventEnvelope
from app.processors.delay_processor import process_delay
from app.state.projection import state_store

def test_delay_processor_state_projection():
    """
    Verifies that the delay processor correctly updates the TrainState
    and generates a conflict event based on the StationState.
    """
    # 1. Verify initial state
    state_store.trains.clear()
    train_state = state_store.get_train("12951")
    assert train_state.delay_minutes == 0
    assert train_state.current_status == "SCHEDULED"

    # 2. Process Delay Event
    event = EventEnvelope(
        event_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        source="SIMULATOR",
        type="TrainDelayed",
        severity="WARNING",
        payload={
            "train_number": "12951",
            "station_code": "NDLS",
            "delay_minutes": 25 # Threshold is 15
        }
    )
    
    new_events = process_delay(event)
    
    # 3. Verify State was mutated
    assert train_state.delay_minutes == 25
    assert train_state.current_status == "DELAYED"
    
    # 4. Verify Intelligence Event was emitted based on the mocked occupied platform 4
    assert len(new_events) == 1
    conflict = new_events[0]
    assert conflict.type == "PlatformConflict"
    assert "22436" in conflict.payload["conflicting_trains"] # 22436 is the mocked assigned train
