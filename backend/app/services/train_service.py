import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.db import models
from app.services.cache import cache_service
from app.providers.simulator import simulator_provider
from app.providers.railradar import railradar_provider
from app.core.config import settings
from app.core.metrics import REDIS_CACHE_HITS, REDIS_CACHE_MISSES

logger = logging.getLogger("railpulse.train_service")

class TrainService:

    def search_trains(self, db: Session, query: str) -> List[Dict[str, Any]]:
        """Search trains by train number or name."""
        cache_key = f"search:v1:{query.lower()}"
        cached = cache_service.get(cache_key)
        if cached:
            REDIS_CACHE_HITS.inc()
            return cached

        REDIS_CACHE_MISSES.inc()

        results = []
        trains = db.query(models.Train).filter(
            (models.Train.train_number.ilike(f"%{query}%")) |
            (models.Train.name.ilike(f"%{query}%"))
        ).all()

        for t in trains:
            results.append({
                "train_number": t.train_number,
                "name": t.name,
                "source_station_code": t.source_station_code,
                "destination_station_code": t.destination_station_code,
                "runs_on": t.runs_on
            })

        cache_service.set(cache_key, results, ttl=settings.CACHE_METADATA_TTL)
        return results

    def get_train_schedule(self, db: Session, train_number: str) -> Dict[str, Any]:
        """Get static timetable and stop sequence for a train."""
        cache_key = f"schedule:v1:{train_number}"
        cached = cache_service.get(cache_key)
        if cached:
            REDIS_CACHE_HITS.inc()
            return cached

        REDIS_CACHE_MISSES.inc()

        train = db.query(models.Train).filter(models.Train.train_number == train_number).first()
        if not train:
            raise HTTPException(status_code=404, detail="Train schedule not found")

        stops_db = db.query(models.TrainStop).filter(models.TrainStop.train_id == train.id).order_by(models.TrainStop.sequence).all()
        stops = []
        for s in stops_db:
            stops.append({
                "station_code": s.station_code,
                "station_name": s.station_name,
                "sequence": s.sequence,
                "scheduled_arrival": s.scheduled_arrival,
                "scheduled_departure": s.scheduled_departure,
                "distance_km": s.distance_km,
                "day_offset": getattr(s, "day_offset", 0)
            })

        result = {
            "train_number": train.train_number,
            "name": train.name,
            "source_station_code": train.source_station_code,
            "destination_station_code": train.destination_station_code,
            "runs_on": train.runs_on,
            "stops": stops
        }

        cache_service.set(cache_key, result, ttl=settings.CACHE_METADATA_TTL)
        return result

    def get_journey_status(
        self,
        db: Session,
        train_number: str,
        journey_date: str,
        simulate_failure: bool = False,
        force_provider_failure: bool = False
    ) -> Dict[str, Any]:
        """Fetch live train journey status with Redis cache-aside & provider fallback resiliency."""
        is_failure_forced = simulate_failure or force_provider_failure
        cache_key = f"status:v1:{train_number}:{journey_date}"
        
        # 1. Check Redis cache-aside layer
        cached_data = cache_service.get(cache_key)
        
        if cached_data and not is_failure_forced:
            REDIS_CACHE_HITS.inc()
            if "source_updated_at" in cached_data:
                try:
                    updated_dt = datetime.fromisoformat(cached_data["source_updated_at"].rstrip("Z"))
                    freshness = int((datetime.utcnow() - updated_dt).total_seconds())
                    cached_data["freshness_seconds"] = max(0, freshness)
                except Exception:
                    pass
            return cached_data

        REDIS_CACHE_MISSES.inc()

        # 2. Upstream provider failure simulation handler
        if is_failure_forced:
            if cached_data:
                cached_data["degraded"] = True
                cached_data["source"] = "CACHED"
                if "source_updated_at" in cached_data:
                    try:
                        updated_dt = datetime.fromisoformat(cached_data["source_updated_at"].rstrip("Z"))
                        cached_data["freshness_seconds"] = int((datetime.utcnow() - updated_dt).total_seconds())
                    except Exception:
                        cached_data["freshness_seconds"] = 36
                return cached_data
            else:
                logger.warning(f"Simulating provider failure for train {train_number} without Redis cache")
                raise HTTPException(status_code=503, detail="Upstream train provider unavailable / timed out")

        # 3. Fetch from RailRadar API if configured
        if railradar_provider.is_configured:
            try:
                logger.info(f"Fetching live status from RailRadar API for train {train_number}")
                status = railradar_provider.fetch_live_status(train_number, journey_date)
                cache_service.set(cache_key, status, ttl=settings.CACHE_DEFAULT_TTL)
                return status
            except ValueError as exc:
                raise HTTPException(status_code=404, detail=str(exc))
            except Exception as exc:
                logger.warning(f"RailRadar API failed for train {train_number} ({exc}), falling back to stale cache/simulator")
                if cached_data:
                    cached_data["degraded"] = True
                    cached_data["source"] = "CACHED"
                    return cached_data

        # 4. Fallback to SimulatorProvider
        try:
            status = simulator_provider.get_simulated_status(db, train_number, journey_date)
            cache_service.set(cache_key, status, ttl=settings.CACHE_DEFAULT_TTL)
            return status
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc))

train_service = TrainService()
