import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_station_operations():
    today = datetime.utcnow().strftime("%Y-%m-%d")
    response = client.get(f"/api/v1/operations/stations/NDLS?journey_date={today}")
    assert response.status_code == 200
    data = response.json()
    assert data["station_code"] == "NDLS"
    assert len(data["platforms"]) == 5
    assert isinstance(data["conflicts"], list)

def test_all_conflicts_endpoint():
    today = datetime.utcnow().strftime("%Y-%m-%d")
    response = client.get(f"/api/v1/operations/conflicts?journey_date={today}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
