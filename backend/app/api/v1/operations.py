from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.operations import StationOperationsResponse, ConflictAlert
from app.services.scheduling import scheduling_service

router = APIRouter(prefix="/operations", tags=["operations"])

@router.get("/stations/{station_code}", response_model=StationOperationsResponse)
def get_station_operations(
    station_code: str,
    journey_date: str = Query(None, description="Journey date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """Get platform occupancy board, train schedule intervals, and conflict alerts for a station."""
    if not journey_date:
        journey_date = datetime.utcnow().strftime("%Y-%m-%d")

    return scheduling_service.get_station_operations(db, station_code=station_code.upper(), journey_date=journey_date)

@router.get("/conflicts", response_model=List[ConflictAlert])
def get_all_conflicts(
    journey_date: str = Query(None, description="Journey date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """Get all active platform conflicts across key stations."""
    if not journey_date:
        journey_date = datetime.utcnow().strftime("%Y-%m-%d")

    all_conflicts: List[ConflictAlert] = []
    key_stations = ["NDLS", "MMCT", "RKMP", "BSB", "AGC", "CNB"]
    
    for st_code in key_stations:
        ops = scheduling_service.get_station_operations(db, station_code=st_code, journey_date=journey_date)
        all_conflicts.extend(ops.conflicts)

    return all_conflicts

@router.get("/stats")
def get_system_stats():
    """Get high level pipeline statistics for the Operations Console."""
    from app.system.storage import get_stats
    return get_stats()
