from abc import ABC, abstractmethod
from typing import Dict, Any, List
from datetime import datetime

class TrainEvent:
    def __init__(self, train_number: str, station_code: str, scheduled_arrival: datetime, actual_arrival: datetime, state: str):
        self.train_number = train_number
        self.station_code = station_code
        self.scheduled_arrival = scheduled_arrival
        self.actual_arrival = actual_arrival
        self.delay_minutes = int((actual_arrival - scheduled_arrival).total_seconds() / 60)
        self.state = state

class OperationsProvider(ABC):
    @abstractmethod
    def fetch_station_arrivals(self, station_code: str, window_hours: int = 4) -> List[TrainEvent]:
        """Fetch all trains scheduled to arrive at the given station within the time window."""
        pass
    
    @abstractmethod
    def fetch_journey_status(self, train_number: str, journey_date: str) -> Dict[str, Any]:
        """Fetch raw journey status for a specific train."""
        pass
