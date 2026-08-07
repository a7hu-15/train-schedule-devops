import pytest
from unittest.mock import patch, MagicMock
import httpx
from app.providers.railradar import RailRadarProvider, railradar_provider
from app.services.train_service import train_service
from app.services.cache import cache_service

def test_railradar_provider_not_configured():
    provider = RailRadarProvider(api_key=None)
    assert provider.is_configured is False
    with pytest.raises(ValueError, match="API key not configured"):
        provider.fetch_live_status("74021", "2026-08-06")

@patch("httpx.Client.get")
def test_railradar_fetch_live_status_success(mock_get):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "train_number": "74021",
        "train_name": "Delhi DEMU",
        "running_state": "RUNNING",
        "delay": 12,
        "current_station_code": "NDLS",
        "next_station": {
            "code": "DEC",
            "name": "Delhi Cantt",
            "scheduled_arrival": "10:30",
            "estimated_arrival": "10:42",
            "distance_km": 14.0
        },
        "stops": [
          {"station_code": "NDLS", "station_name": "New Delhi", "sch_arr": "10:00", "sch_dep": "10:05", "distance_km": 0},
          {"station_code": "DEC", "station_name": "Delhi Cantt", "sch_arr": "10:30", "sch_dep": "10:32", "distance_km": 14}
        ]
    }
    mock_get.return_value = mock_response

    provider = RailRadarProvider(api_key="test_api_key_123")
    assert provider.is_configured is True
    
    result = provider.fetch_live_status("74021", "2026-08-06")
    assert result["train_number"] == "74021"
    assert result["train_name"] == "Delhi DEMU"
    assert result["delay_minutes"] == 12
    assert result["source"] == "RAILRADAR_LIVE"
    assert len(result["stops"]) == 2

@patch("httpx.Client.get")
def test_railradar_fetch_live_status_404(mock_get):
    mock_response = MagicMock()
    mock_response.status_code = 404
    mock_get.return_value = mock_response

    provider = RailRadarProvider(api_key="test_api_key_123")
    with pytest.raises(ValueError, match="not found"):
        provider.fetch_live_status("99999", "2026-08-06")

@patch("httpx.Client.get")
def test_railradar_fetch_live_status_429_rate_limit(mock_get):
    mock_response = MagicMock()
    mock_response.status_code = 429
    mock_get.return_value = mock_response

    provider = RailRadarProvider(api_key="test_api_key_123")
    with pytest.raises(RuntimeError, match="rate limit exceeded"):
        provider.fetch_live_status("74021", "2026-08-06")

@patch("httpx.Client.get")
def test_railradar_fetch_live_status_timeout(mock_get):
    mock_get.side_effect = httpx.TimeoutException("Request timed out")

    provider = RailRadarProvider(api_key="test_api_key_123")
    with pytest.raises(TimeoutError, match="timed out"):
        provider.fetch_live_status("74021", "2026-08-06")

@patch("app.providers.railradar.railradar_provider.fetch_live_status")
def test_train_service_rate_limit_degraded_cache_fallback(mock_fetch, setup_test_db):
    railradar_provider.api_key = "test_valid_key_123"
    mock_fetch.side_effect = RuntimeError("RailRadar API rate limit exceeded")

    # Populate stale cache in Redis
    stale_payload = {
        "train_number": "74021",
        "train_name": "Delhi DEMU",
        "journey_date": "2026-08-06",
        "state": "RUNNING",
        "running_state": "RUNNING",
        "current_station_code": "NDLS",
        "delay_minutes": 5,
        "next_station": {"code": "DEC", "name": "Delhi Cantt", "scheduled_arrival": "10:30", "estimated_arrival": "10:35", "distance_km": 14},
        "stops": [],
        "source": "RAILRADAR_LIVE",
        "degraded": False,
        "freshness_seconds": 12,
        "source_updated_at": "2026-08-06T10:00:00"
    }
    cache_service.set("status:v1:74021:2026-08-06", stale_payload, ttl=60)

    # Call train_service.get_journey_status with forced provider failure simulation
    res = train_service.get_journey_status(setup_test_db, "74021", "2026-08-06", force_provider_failure=True)
    
    assert res["train_number"] == "74021"
    assert res["degraded"] is True
    assert res["source"] == "CACHED"

    # Clean up mock key
    railradar_provider.api_key = None
