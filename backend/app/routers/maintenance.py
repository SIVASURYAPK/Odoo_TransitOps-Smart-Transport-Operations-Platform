from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from typing import List

from app.database import get_db
from app.models.maintenance import MaintenanceLog
from app.models.vehicle import Vehicle
from app.schemas.maintenance import MaintenanceCreate, MaintenanceClose, MaintenanceResponse
from app.core.rbac import get_current_user, RoleChecker

router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])

allow_all_auth = Depends(get_current_user)
require_manager = Depends(RoleChecker(["Fleet Manager", "Admin"]))

@router.get("/", response_model=List[MaintenanceResponse], dependencies=[allow_all_auth])
def get_all_maintenance_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(MaintenanceLog).offset(skip).limit(limit).all()

@router.post("/", response_model=MaintenanceResponse, dependencies=[require_manager])
def open_maintenance_ticket(ticket: MaintenanceCreate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == ticket.vehicle_id).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    if vehicle.status == "On Trip":
        raise HTTPException(status_code=400, detail="Cannot service a vehicle that is currently On Trip")
        
    if vehicle.status == "In Shop":
        raise HTTPException(status_code=400, detail="Vehicle is already in the shop")

    # Create the log
    new_log = MaintenanceLog(
        vehicle_id=ticket.vehicle_id,
        description=ticket.description,
        start_date=date.today(),
        status="Open"
    )
    
    # Lock the vehicle
    vehicle.status = "In Shop"

    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.post("/{log_id}/close", response_model=MaintenanceResponse, dependencies=[require_manager])
def close_maintenance_ticket(log_id: int, ticket_close: MaintenanceClose, db: Session = Depends(get_db)):
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()
    
    if not log or log.status == "Closed":
        raise HTTPException(status_code=400, detail="Log not found or already closed")

    vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first()

    # Finalize the log
    log.status = "Closed"
    log.end_date = date.today()
    log.cost = ticket_close.cost

    # Free the vehicle back up for dispatch
    if vehicle:
        vehicle.status = "Available"

    db.commit()
    db.refresh(log)
    return log