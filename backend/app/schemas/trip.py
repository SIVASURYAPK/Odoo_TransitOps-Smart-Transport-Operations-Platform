from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TripBase(BaseModel):
    vehicle_id: int
    driver_id: int
    cargo_weight_kg: float

class TripCreate(TripBase):
    pass

class TripResponse(TripBase):
    id: int
    status: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    start_odometer: Optional[float] = None
    end_odometer: Optional[float] = None

    class Config:
        from_attributes = True