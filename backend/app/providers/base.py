from abc import ABC, abstractmethod
from typing import Dict, Any, List

class TrainDataProvider(ABC):
    @abstractmethod
    def get_journey_status(self, train_number: str, journey_date: str, stops: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Fetch status for given train and date."""
        pass
