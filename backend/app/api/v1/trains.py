from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.train import TrainSummary, TrainDetail
from app.services.train_service import train_service

router = APIRouter(prefix="/trains", tags=["trains"])

@router.get("", response_model=List[TrainSummary])
def search_trains(
    query: str = Query(..., min_length=1, description="Search by train number or name"),
    db: Session = Depends(get_db)
):
    """Search trains by number or name."""
    return train_service.search_trains(db, query)

@router.get("/{train_number}", response_model=TrainSummary)
def get_train(
    train_number: str,
    db: Session = Depends(get_db)
):
    """Get basic train metadata."""
    train = train_service.get_train_schedule(db, train_number)
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    return train

@router.get("/{train_number}/schedule", response_model=TrainDetail)
def get_train_schedule(
    train_number: str,
    db: Session = Depends(get_db)
):
    """Get train timetable and stop sequence."""
    schedule = train_service.get_train_schedule(db, train_number)
    if not schedule:
        raise HTTPException(status_code=404, detail="Train schedule not found")
    return schedule
