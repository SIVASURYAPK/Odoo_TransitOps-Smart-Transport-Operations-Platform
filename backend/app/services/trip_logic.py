from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.trip import Trip, TripStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.driver import Driver, DriverStatus
from app.schemas.trip import TripCreate

def create_draft_trip(db: Session, trip_data: TripCreate) -> Trip:
    # Validate vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip_data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    if vehicle.status == VehicleStatus.Retired or vehicle.status == VehicleStatus.InShop:
        raise HTTPException(status_code=400, detail="Cannot assign a Retired or InShop vehicle")

    if trip_data.cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(status_code=400, detail=f"Cargo weight ({trip_data.cargo_weight}kg) exceeds vehicle capacity ({vehicle.max_load_capacity}kg)")

    # Validate driver
    driver = db.query(Driver).filter(Driver.id == trip_data.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    if driver.status == DriverStatus.Suspended:
        raise HTTPException(status_code=400, detail="Cannot assign a Suspended driver")
    
    # Check license expiration
    if driver.license_expiry_date < datetime.utcnow().date():
        raise HTTPException(status_code=400, detail="Driver license is expired")

    new_trip = Trip(**trip_data.model_dump(), status=TripStatus.Draft)
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip

def dispatch_trip(db: Session, trip_id: int) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip.status != TripStatus.Draft:
        raise HTTPException(status_code=400, detail="Only Draft trips can be dispatched")

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    if vehicle.status != VehicleStatus.Available:
        raise HTTPException(status_code=400, detail="Vehicle is not Available for dispatch")
    
    if driver.status != DriverStatus.Available:
        raise HTTPException(status_code=400, detail="Driver is not Available for dispatch")

    # Atomic transition
    trip.status = TripStatus.Dispatched
    trip.dispatched_at = datetime.utcnow()
    vehicle.status = VehicleStatus.OnTrip
    driver.status = DriverStatus.OnTrip

    db.commit()
    db.refresh(trip)
    return trip

def complete_trip(db: Session, trip_id: int, actual_distance: float, fuel_consumed: float) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip.status != TripStatus.Dispatched:
        raise HTTPException(status_code=400, detail="Only Dispatched trips can be completed")

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    # Update actuals
    trip.actual_distance = actual_distance
    trip.fuel_consumed = fuel_consumed
    vehicle.odometer += actual_distance

    # Atomic transition
    trip.status = TripStatus.Completed
    trip.completed_at = datetime.utcnow()
    vehicle.status = VehicleStatus.Available
    driver.status = DriverStatus.Available

    db.commit()
    db.refresh(trip)
    return trip

def cancel_trip(db: Session, trip_id: int) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip.status not in [TripStatus.Draft, TripStatus.Dispatched]:
        raise HTTPException(status_code=400, detail="Only Draft or Dispatched trips can be cancelled")

    # If it was dispatched, we need to release the vehicle and driver
    if trip.status == TripStatus.Dispatched:
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
        vehicle.status = VehicleStatus.Available
        driver.status = DriverStatus.Available

    # Atomic transition
    trip.status = TripStatus.Cancelled
    db.commit()
    db.refresh(trip)
    return trip
