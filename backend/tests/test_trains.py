import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_liveness_probe():
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "UP"

def test_readiness_probe():
    response = client.get("/health/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "READY"

def test_metrics_endpoint():
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.text

def test_search_trains_valid():
    response = client.get("/api/v1/trains?query=12951")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["train_number"] == "12951"
    assert "Rajdhani" in data[0]["name"]

def test_search_trains_nonexistent():
    response = client.get("/api/v1/trains?query=UNKNOWN_TRAIN_999")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0

def test_search_trains_empty_query():
    response = client.get("/api/v1/trains?query=")
    assert response.status_code == 422  # Validation error for min_length=1

def test_get_train_schedule_valid():
    response = client.get("/api/v1/trains/12951/schedule")
    assert response.status_code == 200
    data = response.json()
    assert data["train_number"] == "12951"
    assert len(data["stops"]) == 7
    assert data["stops"][0]["station_code"] == "MMCT"
    assert data["stops"][-1]["station_code"] == "NDLS"

def test_get_train_not_found():
    response = client.get("/api/v1/trains/99999/schedule")
    assert response.status_code == 404
    assert response.json()["detail"] == "Train schedule not found"
