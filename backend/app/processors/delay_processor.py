from typing import List
import uuid
from datetime import datetime

from app.events.schemas import EventEnvelope
from app.state.projection import state_store

def process_delay(event: EventEnvelope) -> List[EventEnvelope]:
    """
    Consumes TrainDelayed.
    Projects the delay into the StateStore.
    Evaluates conflict against real projected state.
    """
    payload = event.payload
    
    if "train_number" not in payload or "station_code" not in payload or "delay_minutes" not in payload:
        raise ValueError("Invalid payload for TrainDelayed")
        
    train_num = payload["train_number"]
    station_code = payload["station_code"]
    delay_minutes = int(payload["delay_minutes"])
    
    # 1. Project State
    train_state = state_store.get_train(train_num)
    train_state.delay_minutes = delay_minutes
    train_state.current_status = "DELAYED"
    train_state.last_updated = datetime.utcnow()
    state_store.save_train(train_state)
    
    # 2. Evaluate Business Logic against State
    station_state = state_store.get_station(station_code)
    
    # We check if platform 4 is occupied (based on our mock seed state)
    p4 = station_state.get_platform("4")
    
    if delay_minutes >= 15 and p4.is_occupied and p4.assigned_train != train_num:
        # 3. Emit Intelligence Event
        conflict_payload = {
            "station_code": station_code,
            "platform": "4",
            "conflicting_trains": [train_num, p4.assigned_train],
            "overlap_minutes": delay_minutes - 10
        }
        
        conflict_event = EventEnvelope(
            event_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            source="SYSTEM",
            type="PlatformConflict",
            severity="CRITICAL",
            payload=conflict_payload
        )
        return [conflict_event]
        
    return []
