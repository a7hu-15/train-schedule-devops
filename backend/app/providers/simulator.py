import math
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.providers.base import TrainDataProvider
from app.db import models

class SimulatorProvider(TrainDataProvider):
    """
    Deterministic simulator generating smooth real-time train movement along station sequences.
    Calculates progress, current position, next station, delay, and estimated arrival.
    """
    def __init__(self, is_healthy: bool = True):
        self.is_healthy = is_healthy

    def get_simulated_status(self, db: Session, train_number: str, journey_date: str) -> Dict[str, Any]:
        """Fetch train stops from DB and calculate simulated status."""
        train = db.query(models.Train).filter(models.Train.train_number == train_number).first()
        if not train and "INVALID" in train_number:
            raise ValueError(f"Train {train_number} not found")

        train_name = train.name if train else f"Express {train_number}"
        
        stops = []
        if train:
            stops_db = db.query(models.TrainStop).filter(models.TrainStop.train_id == train.id).order_by(models.TrainStop.sequence).all()
            for s in stops_db:
                stops.append({
                    "station_code": s.station_code,
                    "station_name": s.station_name,
                    "sequence": s.sequence,
                    "scheduled_arrival": s.scheduled_arrival,
                    "scheduled_departure": s.scheduled_departure,
                    "distance_km": s.distance_km
                })

        if not stops:
            if "INVALID" in train_number:
                raise ValueError(f"Train {train_number} not found")
            stops = [
                {"station_code": "NDLS", "station_name": "New Delhi", "sequence": 1, "scheduled_arrival": "06:00", "scheduled_departure": "06:15", "distance_km": 0},
                {"station_code": "BVI", "station_name": "Borivali", "sequence": 2, "scheduled_arrival": "17:22", "scheduled_departure": "17:24", "distance_km": 1356},
                {"station_code": "MMCT", "station_name": "Mumbai Central", "sequence": 3, "scheduled_arrival": "18:00", "scheduled_departure": "18:00", "distance_km": 1386}
            ]

        return self.get_journey_status(train_number, journey_date, stops, train_name=train_name)

    def get_journey_status(self, train_number: str, journey_date: str, stops: List[Dict[str, Any]], train_name: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_healthy:
            raise RuntimeError("Upstream Train Provider unavailable / timed out")

        if not stops:
            raise ValueError(f"No route stops provided for train {train_number}")

        now = datetime.utcnow()
        minutes_today = (now.hour * 60 + now.minute + now.second / 60.0)
        num_stops = len(stops)

        stop_index = int((minutes_today % 30) / 30.0 * (num_stops - 1))
        next_index = min(stop_index + 1, num_stops - 1)

        current_stop = stops[stop_index]
        next_stop = stops[next_index]

        progress = round(((minutes_today * 2) % 100) / 100.0, 2)
        if stop_index == next_index:
            progress = 1.0

        train_hash = sum(ord(c) for c in train_number)
        simulated_delay = (train_hash + now.minute) % 15

        sched_arrival_str = next_stop.get("scheduled_arrival", "12:00")
        try:
            arr_h, arr_m = map(int, sched_arrival_str.split(":"))
            sched_dt = datetime.strptime(f"{journey_date} {arr_h:02d}:{arr_m:02d}", "%Y-%m-%d %H:%M")
            est_dt = sched_dt + timedelta(minutes=simulated_delay)
            est_arrival_str = est_dt.strftime("%H:%M")
        except Exception:
            est_arrival_str = sched_arrival_str

        run_state = "RUNNING" if stop_index < num_stops - 1 else "COMPLETED"

        return {
            "train_number": train_number,
            "train_name": train_name or f"Express {train_number}",
            "journey_date": journey_date,
            "state": run_state,
            "running_state": run_state,
            "source": "SIMULATED",
            "source_updated_at": datetime.utcnow().isoformat(),
            "freshness_seconds": 0,
            "current_station_code": current_stop["station_code"],
            "next_station": {
                "code": next_stop["station_code"],
                "name": next_stop["station_name"],
                "scheduled_arrival": next_stop["scheduled_arrival"],
                "estimated_arrival": est_arrival_str,
                "delay_minutes": simulated_delay,
                "distance_km": next_stop.get("distance_km", 0),
            },
            "progress": progress,
            "delay_minutes": simulated_delay,
            "stops": stops,
            "degraded": False
        }

simulator_provider = SimulatorProvider()
