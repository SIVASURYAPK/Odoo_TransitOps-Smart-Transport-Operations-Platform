from pydantic import BaseModel
from typing import Optional
from datetime import date

class MaintenanceBase(BaseModel):
    vehicle_id: int
    description: str

class MaintenanceCreate(MaintenanceBase):
    pass

class MaintenanceClose(BaseModel):
    cost: float

class MaintenanceResponse(MaintenanceBase):
    id: int
    start_date: date
    end_date: Optional[date] = None
    cost: float
    status: str

    class Config:
        from_attributes = True