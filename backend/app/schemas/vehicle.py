from pydantic import BaseModel
from typing import Optional

class VehicleBase(BaseModel):
    license_plate: str
    model: str
    max_capacity_kg: float
    status: Optional[str] = "Available"

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    model: Optional[str] = None
    max_capacity_kg: Optional[float] = None
    odometer_km: Optional[float] = None
    status: Optional[str] = None

class VehicleResponse(VehicleBase):
    id: int
    odometer_km: float

    class Config:
        from_attributes = True