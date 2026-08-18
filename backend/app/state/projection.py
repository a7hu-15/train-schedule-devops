from typing import Dict
from app.state.station import StationState
from app.state.train import TrainState
from app.state.platform import PlatformState
from app.system.cache import update_operational_state

class StateProjectionStore:
    """
    In-memory read model for the CQRS projection, synchronized to Redis (Phase 5).
    """
    def __init__(self):
        self.stations: Dict[str, StationState] = {}
        self.trains: Dict[str, TrainState] = {}
        
        # Seed some initial state for testing
        ndls = StationState(station_code="NDLS")
        p4 = ndls.get_platform("4")
        p4.is_occupied = True
        p4.assigned_train = "22436"
        self.save_station(ndls)

    def get_station(self, station_code: str) -> StationState:
        if station_code not in self.stations:
            self.stations[station_code] = StationState(station_code=station_code)
        return self.stations[station_code]
        
    def save_station(self, station: StationState):
        self.stations[station.station_code] = station
        update_operational_state(f"station:{station.station_code}", station.model_dump())

    def get_train(self, train_number: str) -> TrainState:
        if train_number not in self.trains:
            self.trains[train_number] = TrainState(train_number=train_number)
        return self.trains[train_number]
        
    def save_train(self, train: TrainState):
        self.trains[train.train_number] = train
        update_operational_state(f"train:{train.train_number}", train.model_dump())

# Global singleton for Phase 4
state_store = StateProjectionStore()
