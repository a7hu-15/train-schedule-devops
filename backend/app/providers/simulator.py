import uuid
import random
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.events.schemas import EventEnvelope

class SimulatorProvider:
    """
    Deterministic Simulator acting as the Chaos Engine.
    Generates standard EventEnvelopes (e.g. TrainDelayed, TrainArrived).
    """
    
    def __init__(self, seed: int = 42):
        self.seed = seed
        self.stations = ["NDLS", "MMCT", "BVI"]
        # Base schedules for testing
        self.base_schedules = [
            {"train": "12951", "station": "NDLS", "scheduled": "18:00"},
            {"train": "12952", "station": "NDLS", "scheduled": "18:10"},
            {"train": "12002", "station": "NDLS", "scheduled": "18:20"},
            {"train": "22436", "station": "NDLS", "scheduled": "18:30"},
        ]

    def generate_events(self, count: int = 5) -> List[EventEnvelope]:
        """Generate a batch of deterministic operational events."""
        now = datetime.utcnow()
        # Seed allows deterministic but changing output over time
        random.seed(f"{self.seed}_{now.strftime('%Y%m%d%H%M')}")
        
        events = []
        for _ in range(count):
            schedule = random.choice(self.base_schedules)
            
            # Determine Event Type
            event_type = random.choices(
                ["TrainDelayed", "TrainArrived", "TrainDeparted"], 
                weights=[0.6, 0.2, 0.2]
            )[0]
            
            payload = {
                "train_number": schedule["train"],
                "station_code": schedule["station"]
            }
            
            severity = "INFO"
            
            if event_type == "TrainDelayed":
                delay_mins = random.randint(10, 45)
                payload["delay_minutes"] = delay_mins
                severity = "WARNING"
            elif event_type == "TrainArrived":
                payload["platform_assigned"] = str(random.randint(1, 6))
            elif event_type == "TrainDeparted":
                payload["platform_released"] = str(random.randint(1, 6))
                
            events.append(EventEnvelope(
                event_id=str(uuid.uuid4()),
                timestamp=now,
                source="SIMULATOR",
                type=event_type,
                severity=severity,
                payload=payload
            ))
        return events

    def get_simulated_status(self, db: Any, train_number: str, journey_date: str) -> Dict[str, Any]:
        """Backward compatibility for legacy train_service."""
        if train_number == "INVALID_999":
            raise ValueError(f"Train {train_number} not found")
            
        return {
            "train_number": train_number,
            "journey_date": journey_date,
            "state": "RUNNING",
            "source": "SIMULATED",
            "source_updated_at": datetime.utcnow().isoformat(),
            "freshness_seconds": 0,
            "degraded": False,
            "current_station_code": "NDLS",
            "next_station": {
                "code": "BVI",
                "name": "Borivali",
                "scheduled_arrival": "2026-08-18T12:00:00Z",
                "estimated_arrival": "2026-08-18T12:00:00Z",
                "delay_minutes": 0,
                "distance_km": 50
            },
            "progress": 50.0,
            "delay_minutes": 0,
            "stops": []
        }

simulator_provider = SimulatorProvider()
