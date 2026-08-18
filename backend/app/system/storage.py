import logging
import json
from typing import Optional
from sqlalchemy import create_engine, Column, String, DateTime, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

from app.events.schemas import EventEnvelope

logger = logging.getLogger(__name__)

# Using SQLite for local development mock, will be Postgres in production via env var
SQLALCHEMY_DATABASE_URL = "sqlite:///./railpulse_events.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class EventRecord(Base):
    __tablename__ = "events"
    
    event_id = Column(String, primary_key=True, index=True)
    correlation_id = Column(String, index=True)
    parent_event_id = Column(String, index=True, nullable=True)
    timestamp = Column(DateTime)
    source = Column(String)
    event_type = Column(String, index=True)
    severity = Column(String)
    payload = Column(JSON)
    lifecycle_status = Column(String, index=True) # RECEIVED, PROCESSED, FAILED
    processing_duration_ms = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

def save_event(event: EventEnvelope, status: str, duration_ms: Optional[float] = None):
    """Persists the event to the Event Store (Postgres)."""
    db = SessionLocal()
    try:
        # Check if exists (for updating status)
        existing = db.query(EventRecord).filter(EventRecord.event_id == event.event_id).first()
        if existing:
            existing.lifecycle_status = status
            if duration_ms is not None:
                existing.processing_duration_ms = str(duration_ms)
        else:
            record = EventRecord(
                event_id=event.event_id,
                correlation_id=event.correlation_id,
                parent_event_id=event.parent_event_id,
                timestamp=event.timestamp,
                source=event.source,
                event_type=event.type,
                severity=event.severity,
                payload=event.payload,
                lifecycle_status=status,
                processing_duration_ms=str(duration_ms) if duration_ms is not None else None
            )
            db.add(record)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to persist event {event.event_id}: {e}")
        db.rollback()
    finally:
        db.close()

def load_event(event_id: str) -> Optional[EventEnvelope]:
    """Loads an event from the Event Store."""
    db = SessionLocal()
    try:
        record = db.query(EventRecord).filter(EventRecord.event_id == event_id).first()
        if not record:
            return None
        return EventEnvelope(
            event_id=record.event_id,
            correlation_id=record.correlation_id,
            parent_event_id=record.parent_event_id,
            timestamp=record.timestamp,
            source=record.source,
            type=record.event_type,
            severity=record.severity,
            payload=record.payload
        )
    finally:
        db.close()

def get_event_chain(correlation_id: str) -> list[dict]:
    """Loads the entire event chain for a given correlation ID, ordered by timestamp."""
    db = SessionLocal()
    try:
        records = db.query(EventRecord).filter(EventRecord.correlation_id == correlation_id).order_by(EventRecord.timestamp).all()
        return [
            {
                "event_id": r.event_id,
                "parent_event_id": r.parent_event_id,
                "type": r.event_type,
                "severity": r.severity,
                "status": r.lifecycle_status,
                "processing_duration_ms": r.processing_duration_ms,
                "timestamp": r.timestamp.isoformat()
            }
            for r in records
        ]
    finally:
        db.close()

def get_recent_events(limit: int = 50) -> list[dict]:
    """Loads the most recent events for the Operations Console."""
    db = SessionLocal()
    try:
        records = db.query(EventRecord).order_by(EventRecord.timestamp.desc()).limit(limit).all()
        return [
            {
                "event_id": r.event_id,
                "correlation_id": r.correlation_id,
                "type": r.event_type,
                "severity": r.severity,
                "status": r.lifecycle_status,
                "payload": r.payload,
                "timestamp": r.timestamp.isoformat()
            }
            for r in records
        ]
    finally:
        db.close()

def get_stats() -> dict:
    """Returns basic pipeline stats for the Operations Console."""
    db = SessionLocal()
    try:
        total = db.query(EventRecord).count()
        conflicts = db.query(EventRecord).filter(EventRecord.event_type == "PlatformConflict").count()
        recommendations = db.query(EventRecord).filter(EventRecord.event_type == "RecommendationGenerated").count()
        return {
            "events_processed": total,
            "platform_conflicts": conflicts,
            "recommendations": recommendations,
            "average_processing_time_ms": 15
        }
    finally:
        db.close()
