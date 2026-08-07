from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.journey import JourneyStatusResponse
from app.services.train_service import train_service

router = APIRouter(prefix="/journeys", tags=["journeys"])

@router.get("/{train_number}/{journey_date}/status", response_model=JourneyStatusResponse)
def get_journey_status(
    train_number: str,
    journey_date: str,
    request: Request,
    simulate_failure: bool = Query(False, description="Simulate upstream provider outage"),
    db: Session = Depends(get_db)
):
    """Get live or simulated status, next station, ETA, delay, and freshness."""
    try:
        status = train_service.get_journey_status(
            db, 
            train_number=train_number, 
            journey_date=journey_date, 
            force_provider_failure=simulate_failure
        )
        status["request_id"] = getattr(request.state, "request_id", None)
        return status
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
