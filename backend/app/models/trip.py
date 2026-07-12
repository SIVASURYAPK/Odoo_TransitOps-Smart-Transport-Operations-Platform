from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    cargo_weight_kg = Column(Float, nullable=False)
    status = Column(String, default="Scheduled")  # Scheduled, On Trip, Completed, Cancelled
    
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    start_odometer = Column(Float, nullable=True)
    end_odometer = Column(Float, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())