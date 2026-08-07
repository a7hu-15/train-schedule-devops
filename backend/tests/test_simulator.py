import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_journey_status_simulation():
    today = datetime.utcnow().strftime("%Y-%m-%d")
    response = client.get(f"/api/v1/journeys/12951/{today}/status")
    assert response.status_code == 200
    data = response.json()
    assert data["train_number"] == "12951"
    assert data["source"] in ["SIMULATED", "CACHED"]
    assert "next_station" in data
    assert "code" in data["next_station"]
    assert data["degraded"] is False

def test_journey_status_degradation_fallback():
    today = datetime.utcnow().strftime("%Y-%m-%d")
    # Step 1: Request populates cache
    client.get(f"/api/v1/journeys/12951/{today}/status")
    
    # Step 2: Simulated upstream failure returns cached state marked degraded
    response = client.get(f"/api/v1/journeys/12951/{today}/status?simulate_failure=true")
    assert response.status_code == 200
    data = response.json()
    assert data["degraded"] is True
    assert data["source"] == "CACHED"

def test_journey_status_invalid_train():
    today = datetime.utcnow().strftime("%Y-%m-%d")
    response = client.get(f"/api/v1/journeys/INVALID_999/{today}/status")
    assert response.status_code == 404

def test_journey_status_outage_without_cache():
    # Force failure for uncached date/train -> returns 503
    response = client.get("/api/v1/journeys/12002/2099-01-01/status?simulate_failure=true")
    assert response.status_code == 503
    assert "unavailable" in response.json()["detail"].lower()
