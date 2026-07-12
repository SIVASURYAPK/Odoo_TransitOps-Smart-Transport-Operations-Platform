from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.user import User
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.core.rbac import get_current_user, RoleChecker

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

# RBAC Dependencies
allow_all_auth = Depends(get_current_user)
require_manager = Depends(RoleChecker(["Fleet Manager", "Admin"]))

@router.get("/", response_model=List[VehicleResponse], dependencies=[allow_all_auth])
def get_all_vehicles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Vehicle).offset(skip).limit(limit).all()

@router.get("/{vehicle_id}", response_model=VehicleResponse, dependencies=[allow_all_auth])
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.post("/", response_model=VehicleResponse, dependencies=[require_manager])
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.license_plate == vehicle.license_plate).first()
    if db_vehicle:
        raise HTTPException(status_code=400, detail="License plate already registered")
    
    new_vehicle = Vehicle(**vehicle.model_dump())
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

@router.put("/{vehicle_id}", response_model=VehicleResponse, dependencies=[require_manager])
def update_vehicle(vehicle_id: int, vehicle_update: VehicleUpdate, db: Session = Depends(get_db)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    update_data = vehicle_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_vehicle, key, value)
        
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle