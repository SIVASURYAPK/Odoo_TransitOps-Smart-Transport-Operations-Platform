from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.driver import Driver
from app.schemas.driver import DriverCreate, DriverUpdate, DriverResponse
from app.core.rbac import get_current_user, RoleChecker

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])

allow_all_auth = Depends(get_current_user)
require_manager = Depends(RoleChecker(["Fleet Manager", "Admin"]))

@router.get("/", response_model=List[DriverResponse], dependencies=[allow_all_auth])
def get_all_drivers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Driver).offset(skip).limit(limit).all()

@router.get("/{driver_id}", response_model=DriverResponse, dependencies=[allow_all_auth])
def get_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

@router.post("/", response_model=DriverResponse, dependencies=[require_manager])
def create_driver(driver: DriverCreate, db: Session = Depends(get_db)):
    db_driver = db.query(Driver).filter(Driver.license_number == driver.license_number).first()
    if db_driver:
        raise HTTPException(status_code=400, detail="License number already registered")
    
    new_driver = Driver(**driver.model_dump())
    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)
    return new_driver

@router.put("/{driver_id}", response_model=DriverResponse, dependencies=[require_manager])
def update_driver(driver_id: int, driver_update: DriverUpdate, db: Session = Depends(get_db)):
    db_driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    update_data = driver_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_driver, key, value)
        
    db.commit()
    db.refresh(db_driver)
    return db_driver