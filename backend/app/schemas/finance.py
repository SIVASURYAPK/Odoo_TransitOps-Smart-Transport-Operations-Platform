from pydantic import BaseModel
from typing import Optional
from datetime import date

class FuelLogBase(BaseModel):
    vehicle_id: Optional[int] = None
    trip_id: Optional[int] = None
    log_type: str  # e.g., "Fuel", "Repair", "Toll"
    amount: float
    liters_fuel: Optional[float] = None
    date: date

class FuelLogCreate(FuelLogBase):
    pass

class FuelLogResponse(FuelLogBase):
    id: int

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    vehicle_id: Optional[int] = None
    trip_id: Optional[int] = None
    log_type: str
    amount: float
    date: date

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: int

    class Config:
        from_attributes = True


FinanceBase = FuelLogBase
FinanceCreate = FuelLogCreate
FinanceResponse = FuelLogResponse