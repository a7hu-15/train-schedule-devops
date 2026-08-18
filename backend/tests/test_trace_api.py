import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.events.schemas import EventEnvelope
from app.system.storage import save_event

client = TestClient(app)

def test_get_event_trace():
    correlation_id = str(uuid.uuid4())
    event_id = str(uuid.uuid4())
    
    # 1. Seed the event in the DB
    event = EventEnvelope(
        event_id=event_id,
        correlation_id=correlation_id,
        timestamp="2026-08-18T12:00:00Z",
        source="SYSTEM",
        type="TrainDelayed",
        severity="WARNING",
        payload={}
    )
    save_event(event, "COMPLETED", 5.0)
    
    # 2. Call the Trace API
    response = client.get(f"/api/v1/events/{correlation_id}")
    
    # 3. Verify
    assert response.status_code == 200
    data = response.json()
    assert data["correlation_id"] == correlation_id
    assert len(data["trace"]) == 1
    assert data["trace"][0]["event_id"] == event_id
    assert data["trace"][0]["type"] == "TrainDelayed"
    assert data["trace"][0]["processing_duration_ms"] == "5.0"
