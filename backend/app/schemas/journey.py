from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class NextStationInfo(BaseModel):
    code: str
    name: str
    scheduled_arrival: str
    estimated_arrival: str
    delay_minutes: int
    distance_km: int

class JourneyStatusResponse(BaseModel):
    train_number: str
    journey_date: str
    state: str  # "RUNNING", "COMPLETED", "SCHEDULED"
    source: str  # "SIMULATED", "CACHED"
    source_updated_at: str
    freshness_seconds: int
    degraded: bool
    current_station_code: str
    next_station: NextStationInfo
    progress: float
    delay_minutes: int
    stops: List[Dict[str, Any]] = []
    request_id: Optional[str] = None
