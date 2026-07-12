from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.rbac import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/fuel-efficiency")
def fuel_efficiency(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [
        {"vehicle": "TN-01-AA-1234", "km_per_liter": 8.4},
        {"vehicle": "TN-01-BB-5678", "km_per_liter": 7.1},
        {"vehicle": "TN-01-CC-9012", "km_per_liter": 6.2},
    ]


@router.get("/operational-cost")
def operational_cost(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [
        {"month": "Jan", "total_cost": 420000},
        {"month": "Feb", "total_cost": 485000},
        {"month": "Mar", "total_cost": 452000},
        {"month": "Apr", "total_cost": 510000},
    ]


@router.get("/roi")
def roi(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [
        {"vehicle": "TN-01-AA-1234", "vehicle_id": 1, "revenue": 950000, "costs": 720000, "roi": 0.32},
        {"vehicle": "TN-01-BB-5678", "vehicle_id": 2, "revenue": 680000, "costs": 590000, "roi": 0.15},
        {"vehicle": "TN-01-CC-9012", "vehicle_id": 3, "revenue": 510000, "costs": 470000, "roi": 0.09},
    ]


@router.get("/fuel-logs")
def fuel_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [
        {"id": 1, "vehicle_id": 1, "date": "2026-07-10", "liters": 42.5, "cost": 5100},
        {"id": 2, "vehicle_id": 2, "date": "2026-07-09", "liters": 28.0, "cost": 3360},
    ]


@router.get("/expenses")
def expenses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [
        {"id": 1, "vehicle_id": 1, "category": "Toll", "amount": 2400, "date": "2026-07-08", "description": "Highway toll"},
        {"id": 2, "vehicle_id": 3, "category": "Maintenance", "amount": 18500, "date": "2026-07-07", "description": "Brake service"},
    ]


@router.get("/export")
def export_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    csv = "vehicle,category,amount,date,description\nTN-01-AA-1234,Toll,2400,2026-07-08,Highway toll\n"
    return Response(content=csv, media_type="text/csv")