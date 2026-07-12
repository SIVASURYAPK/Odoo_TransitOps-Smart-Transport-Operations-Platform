from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    license_plate = Column(String, unique=True, index=True, nullable=False)
    model = Column(String, nullable=False)
    max_capacity_kg = Column(Float, nullable=False)
    odometer_km = Column(Float, default=0.0)
    status = Column(String, default="Available")  # Available, On Trip, In Shop, Retired