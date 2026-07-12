from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.driver import Driver
from app.core.rbac import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

# Anyone logged in can see the dashboard stats
require_auth = Depends(get_current_user)

@router.get("/summary", dependencies=[require_auth])
def get_dashboard_summary(db: Session = Depends(get_db)):
    # 1. Top-level KPI Cards
    total_vehicles = db.query(Vehicle).count()
    active_vehicles = db.query(Vehicle).filter(Vehicle.status == "On Trip").count()
    in_shop_vehicles = db.query(Vehicle).filter(Vehicle.status == "In Shop").count()
    
    available_drivers = db.query(Driver).filter(Driver.status == "Available").count()
    
    active_trips = db.query(Trip).filter(Trip.status == "On Trip").count()
    pending_trips = db.query(Trip).filter(Trip.status == "Draft").count()
    drivers_on_duty = db.query(Driver).filter(Driver.status == "On Trip").count()
    available_vehicles = db.query(Vehicle).filter(Vehicle.status == "Available").count()

    return {
        "active_vehicles": active_vehicles,
        "available_vehicles": available_vehicles,
        "vehicles_in_maintenance": in_shop_vehicles,
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "drivers_on_duty": drivers_on_duty,
        "fleet_utilization_pct": round((active_vehicles / total_vehicles) * 100, 2) if total_vehicles else 0.0,
    }