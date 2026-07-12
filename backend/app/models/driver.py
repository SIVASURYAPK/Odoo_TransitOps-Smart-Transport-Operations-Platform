from sqlalchemy import Column, Integer, String, Date
from app.database import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    license_category = Column(String, nullable=True)
    license_expiry = Column(Date, nullable=False)  # Checked during dispatching
    contact_number = Column(String, nullable=True)
    safety_score = Column(Integer, nullable=True, default=100)
    status = Column(String, default="Available")   # Available, On Trip, Suspended