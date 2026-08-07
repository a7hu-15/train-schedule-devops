from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class ResolutionOption(BaseModel):
    type: str  # "REASSIGN_PLATFORM" or "ADJUST_TIMING"
    target_platform: Optional[int] = None
    adjusted_time: Optional[str] = None
    description: str

class ConflictAlert(BaseModel):
    station_code: str
    platform_number: int
    train_a_number: str
    train_a_name: str
    train_b_number: str
    train_b_name: str
    overlap_minutes: int
    suggestions: List[ResolutionOption]

class PlatformOccupancy(BaseModel):
    platform_number: int
    status: str  # "AVAILABLE", "OCCUPIED", "CONFLICT"
    train_number: Optional[str] = None
    train_name: Optional[str] = None
    arrival_time: Optional[str] = None
    departure_time: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class StationOperationsResponse(BaseModel):
    station_code: str
    station_name: str
    journey_date: str
    platforms: List[PlatformOccupancy]
    conflicts: List[ConflictAlert]
