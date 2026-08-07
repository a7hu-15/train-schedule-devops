import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db import models
from app.services.train_service import train_service
from app.schemas.operations import StationOperationsResponse, PlatformOccupancy, ConflictAlert, ResolutionOption

logger = logging.getLogger("railpulse.scheduling")

class SchedulingService:
    def __init__(self):
        self.num_platforms = 5

    def _parse_time(self, date_str: str, time_str: str, delay_minutes: int = 0) -> datetime:
        try:
            h, m = map(int, time_str.split(":"))
            dt = datetime.strptime(f"{date_str} {h:02d}:{m:02d}", "%Y-%m-%d %H:%M")
            return dt + timedelta(minutes=delay_minutes)
        except Exception:
            return datetime.utcnow()

    def get_station_operations(self, db: Session, station_code: str, journey_date: str) -> StationOperationsResponse:
        # Find station details
        station = db.query(models.Station).filter(models.Station.code == station_code).first()
        station_name = station.name if station else f"Station {station_code}"

        # Fetch all stops at this station across all seeded trains
        stops = db.query(models.TrainStop).filter(models.TrainStop.station_code == station_code).all()

        # Build list of train occupancy intervals at this station
        intervals = []
        for stop in stops:
            train = db.query(models.Train).filter(models.Train.id == stop.train_id).first()
            if not train:
                continue

            # Fetch live delay status for this train
            delay_minutes = 0
            try:
                status = train_service.get_journey_status(db, train.train_number, journey_date)
                delay_minutes = status.get("delay_minutes", 0)
            except Exception:
                pass

            arr_dt = self._parse_time(journey_date, stop.scheduled_arrival, delay_minutes)
            dep_dt = self._parse_time(journey_date, stop.scheduled_departure, delay_minutes)
            if dep_dt <= arr_dt:
                dep_dt = arr_dt + timedelta(minutes=15)  # Minimum 15 min dwell

            # Deterministic default platform based on train number hash
            platform_num = (sum(ord(c) for c in train.train_number) % self.num_platforms) + 1

            intervals.append({
                "train_number": train.train_number,
                "train_name": train.name,
                "platform_number": platform_num,
                "arrival_dt": arr_dt,
                "departure_dt": dep_dt,
                "arrival_str": arr_dt.strftime("%H:%M"),
                "departure_str": dep_dt.strftime("%H:%M"),
                "delay_minutes": delay_minutes
            })

        # Group intervals by platform and detect conflicts
        platforms_map: Dict[int, List[Dict[str, Any]]] = {p: [] for p in range(1, self.num_platforms + 1)}
        for item in intervals:
            platforms_map[item["platform_number"]].append(item)

        conflicts: List[ConflictAlert] = []
        platform_statuses: List[PlatformOccupancy] = []

        for p_num in range(1, self.num_platforms + 1):
            p_intervals = platforms_map[p_num]
            p_intervals.sort(key=lambda x: x["arrival_dt"])

            has_conflict = False
            # Interval overlap check
            for i in range(len(p_intervals)):
                for j in range(i + 1, len(p_intervals)):
                    t1 = p_intervals[i]
                    t2 = p_intervals[j]

                    if t1["arrival_dt"] < t2["departure_dt"] and t2["arrival_dt"] < t1["departure_dt"]:
                        has_conflict = True
                        overlap = int((min(t1["departure_dt"], t2["departure_dt"]) - max(t1["arrival_dt"], t2["arrival_dt"])).total_seconds() / 60)
                        
                        # Find alternative free platform for t2
                        alt_platform = None
                        for check_p in range(1, self.num_platforms + 1):
                            if check_p == p_num:
                                continue
                            # Check if check_p is free during t2's time window
                            is_free = True
                            for other in platforms_map[check_p]:
                                if t2["arrival_dt"] < other["departure_dt"] and other["arrival_dt"] < t2["departure_dt"]:
                                    is_free = False
                                    break
                            if is_free:
                                alt_platform = check_p
                                break

                        suggestions = []
                        if alt_platform:
                            suggestions.append(ResolutionOption(
                                type="REASSIGN_PLATFORM",
                                target_platform=alt_platform,
                                description=f"Reassign Train {t2['train_number']} ({t2['train_name']}) to Platform {alt_platform}"
                            ))
                        
                        adjusted_dep = (t1["departure_dt"] + timedelta(minutes=5)).strftime("%H:%M")
                        suggestions.append(ResolutionOption(
                            type="ADJUST_TIMING",
                            adjusted_time=adjusted_dep,
                            description=f"Adjust Train {t2['train_number']} arrival slot to {adjusted_dep}"
                        ))

                        conflicts.append(ConflictAlert(
                            station_code=station_code,
                            platform_number=p_num,
                            train_a_number=t1["train_number"],
                            train_a_name=t1["train_name"],
                            train_b_number=t2["train_number"],
                            train_b_name=t2["train_name"],
                            overlap_minutes=max(overlap, 5),
                            suggestions=suggestions
                        ))

            # Build platform occupancy status
            if has_conflict:
                p_status = "CONFLICT"
                t_num = p_intervals[0]["train_number"] if p_intervals else None
                t_name = p_intervals[0]["train_name"] if p_intervals else None
                arr_t = p_intervals[0]["arrival_str"] if p_intervals else None
                dep_t = p_intervals[0]["departure_str"] if p_intervals else None
            elif p_intervals:
                p_status = "OCCUPIED"
                t_num = p_intervals[0]["train_number"]
                t_name = p_intervals[0]["train_name"]
                arr_t = p_intervals[0]["arrival_str"]
                dep_t = p_intervals[0]["departure_str"]
            else:
                p_status = "AVAILABLE"
                t_num, t_name, arr_t, dep_t = None, None, None, None

            platform_statuses.append(PlatformOccupancy(
                platform_number=p_num,
                status=p_status,
                train_number=t_num,
                train_name=t_name,
                arrival_time=arr_t,
                departure_time=dep_t
            ))

        return StationOperationsResponse(
            station_code=station_code,
            station_name=station_name,
            journey_date=journey_date,
            platforms=platform_statuses,
            conflicts=conflicts
        )

scheduling_service = SchedulingService()
