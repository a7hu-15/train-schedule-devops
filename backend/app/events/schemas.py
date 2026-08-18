from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Dict, Any, Literal, Optional
import uuid

class EventEnvelope(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    correlation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    parent_event_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: Literal["SIMULATOR", "RAILRADAR", "SYSTEM"]
    type: str
    severity: Literal["INFO", "WARNING", "CRITICAL"]
    payload: Dict[str, Any]

    @field_validator('timestamp', mode='before')
    def parse_timestamp(cls, v):
        if isinstance(v, str):
            try:
                # Basic ISO format parsing
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                return v
        return v
