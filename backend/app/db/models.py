from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base

class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    zone = Column(String(10), nullable=True)

class Train(Base):
    __tablename__ = "trains"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    source_station_code = Column(String(10), nullable=False)
    destination_station_code = Column(String(10), nullable=False)
    runs_on = Column(String(50), default="DAILY")

    stops = relationship("TrainStop", back_populates="train", order_by="TrainStop.sequence", cascade="all, delete-orphan")

class TrainStop(Base):
    __tablename__ = "train_stops"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id", ondelete="CASCADE"), nullable=False)
    station_code = Column(String(10), nullable=False)
    station_name = Column(String(100), nullable=False)
    sequence = Column(Integer, nullable=False)
    scheduled_arrival = Column(String(10), nullable=False)
    scheduled_departure = Column(String(10), nullable=False)
    distance_km = Column(Integer, nullable=False)
    day_offset = Column(Integer, default=0)

    train = relationship("Train", back_populates="stops")

class JourneyStatus(Base):
    __tablename__ = "journey_statuses"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String(10), nullable=False, index=True)
    journey_date = Column(String(10), nullable=False, index=True)
    state = Column(String(20), default="RUNNING")
    source = Column(String(20), default="SIMULATED")
    source_updated_at = Column(DateTime, default=datetime.utcnow)
    current_station_code = Column(String(10), nullable=False)
    next_station_code = Column(String(10), nullable=False)
    progress = Column(Float, default=0.0)
    delay_minutes = Column(Integer, default=0)
    degraded = Column(Boolean, default=False)

    __table_args__ = (
        Index("idx_train_date", "train_number", "journey_date", unique=True),
    )
