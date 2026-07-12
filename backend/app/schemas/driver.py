from datetime import date
from typing import Optional
from pydantic import BaseModel, Field

class DriverBase(BaseModel):
    name: str
    license_number: str
    license_category: Optional[str] = None
    license_expiry: date = Field(alias="license_expiry_date")
    contact_number: Optional[str] = None
    safety_score: Optional[int] = None
    status: Optional[str] = "Available"

    model_config = {
        "populate_by_name": True,
    }

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry: Optional[date] = Field(default=None, alias="license_expiry_date")
    contact_number: Optional[str] = None
    safety_score: Optional[int] = None
    status: Optional[str] = None

    model_config = {
        "populate_by_name": True,
    }

class DriverResponse(DriverBase):
    id: int

    model_config = {
        "from_attributes": True,
    }