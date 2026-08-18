from pydantic import BaseModel, Field
from typing import Dict
from app.state.platform import PlatformState

class StationState(BaseModel):
    station_code: str
    platforms: Dict[str, PlatformState] = Field(default_factory=dict)
    
    def get_platform(self, platform_number: str) -> PlatformState:
        if platform_number not in self.platforms:
            self.platforms[platform_number] = PlatformState(platform_number=platform_number)
        return self.platforms[platform_number]
