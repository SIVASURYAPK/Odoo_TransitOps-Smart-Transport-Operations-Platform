from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List

from app.database import get_db
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.schemas.trip import TripCreate, TripResponse
from app.core.rbac import get_current_user, RoleChecker

router = APIRouter(prefix="/api/trips", tags=["Trips"])

allow_all_auth = Depends(get_current_user)
require_dispatcher = Depends(RoleChecker(["Fleet Manager", "Admin", "Safety Officer"]))

@router.get("/", response_model=List[TripResponse], dependencies=[allow_all_auth])
def get_all_trips(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Trip).offset(skip).limit(limit).all()

@router.post("/dispatch", response_model=TripResponse, dependencies=[require_dispatcher])
def dispatch_trip(trip: TripCreate, db: Session = Depends(get_db)):
    # 1. Fetch Assets
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    if not vehicle or not driver:
        raise HTTPException(status_code=404, detail="Vehicle or Driver not found")

    # 2. Status Validations (Are they available?)
    if vehicle.status != "Available":
        raise HTTPException(status_code=400, detail=f"Vehicle is currently {vehicle.status}")
    if driver.status != "Available":
        raise HTTPException(status_code=400, detail=f"Driver is currently {driver.status}")

    # 3. Safety Validations
    if trip.cargo_weight_kg > vehicle.max_capacity_kg:
        raise HTTPException(status_code=400, detail="Cargo exceeds vehicle maximum capacity")
    if driver.license_expiry < date.today():
        raise HTTPException(status_code=400, detail="Driver's license is expired. Cannot dispatch.")

    # 4. Create the Trip
    new_trip = Trip(
        vehicle_id=trip.vehicle_id,
        driver_id=trip.driver_id,
        cargo_weight_kg=trip.cargo_weight_kg,
        status="On Trip",
        start_time=datetime.utcnow(),
        start_odometer=vehicle.odometer_km
    )
    
    # 5. Atomic Status Updates
    vehicle.status = "On Trip"
    driver.status = "On Trip"

    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip

@router.post("/{trip_id}/complete", response_model=TripResponse, dependencies=[require_dispatcher])
def complete_trip(trip_id: int, end_odometer: float, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip or trip.status != "On Trip":
        raise HTTPException(status_code=400, detail="Trip not found or not currently active")

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    if end_odometer <= trip.start_odometer:
        raise HTTPException(status_code=400, detail="End odometer must be greater than start odometer")

    # Finalize Trip
    trip.status = "Completed"
    trip.end_time = datetime.utcnow()
    trip.end_odometer = end_odometer

    # Update Assets
    vehicle.odometer_km = end_odometer
    vehicle.status = "Available"
    driver.status = "Available"

    db.commit()
    db.refresh(trip)
    return trip