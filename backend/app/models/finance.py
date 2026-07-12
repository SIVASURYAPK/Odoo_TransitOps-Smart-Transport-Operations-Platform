from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from app.database import Base

class FinanceLog(Base):
    __tablename__ = "finance_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    log_type = Column(String, nullable=False)  # Fuel, Repair, Toll, Insurance, Other
    amount = Column(Float, nullable=False)
    liters_fuel = Column(Float, nullable=True)  # Only populated if log_type == "Fuel"
    date = Column(Date, nullable=False)