from pydantic import BaseModel
from typing import Optional

class PlatformState(BaseModel):
    platform_number: str
    is_occupied: bool = False
    assigned_train: Optional[str] = None
