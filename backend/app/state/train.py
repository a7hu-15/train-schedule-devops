from pydantic import BaseModel, Field
from datetime import datetime

class TrainState(BaseModel):
    train_number: str
    current_status: str = "SCHEDULED" # SCHEDULED, DELAYED, IN_TRANSIT, AT_STATION
    delay_minutes: int = 0
    last_updated: datetime = Field(default_factory=datetime.utcnow)
