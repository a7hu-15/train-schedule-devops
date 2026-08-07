from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class TrainStopSchema(BaseModel):
    station_code: str
    station_name: str
    sequence: int
    scheduled_arrival: str
    scheduled_departure: str
    distance_km: int
    day_offset: int

    model_config = ConfigDict(from_attributes=True)

class TrainSummary(BaseModel):
    train_number: str
    name: str
    source_station_code: str
    destination_station_code: str
    runs_on: str

    model_config = ConfigDict(from_attributes=True)

class TrainDetail(TrainSummary):
    stops: List[TrainStopSchema] = []

    model_config = ConfigDict(from_attributes=True)
