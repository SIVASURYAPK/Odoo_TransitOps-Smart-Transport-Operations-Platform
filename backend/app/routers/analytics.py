import io
import csv
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.maintenance import MaintenanceLog
from app.core.rbac import get_current_user, RoleChecker

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

# Both Managers and Analysts can view these reports
require_reporting_role = Depends(RoleChecker(["Fleet Manager", "Admin", "Financial Analyst"]))

@router.get("/kpis", dependencies=[require_reporting_role])
def get_dashboard_kpis(db: Session = Depends(get_db)):
    # Calculate live operational metrics
    total_vehicles = db.query(Vehicle).count()
    active_trips = db.query(Trip).filter(Trip.status == "On Trip").count()
    vehicles_in_shop = db.query(Vehicle).filter(Vehicle.status == "In Shop").count()
    
    # Calculate Total Maintenance Spend
    total_maintenance_cost = db.query(func.sum(MaintenanceLog.cost)).scalar() or 0.0

    return {
        "fleet_utilization": {
            "total_vehicles": total_vehicles,
            "active_trips": active_trips,
            "in_shop": vehicles_in_shop,
            "available": total_vehicles - active_trips - vehicles_in_shop
        },
        "financials": {
            "total_maintenance_spend_usd": total_maintenance_cost
        }
    }

@router.get("/export/trips", dependencies=[require_reporting_role])
def export_trips_csv(db: Session = Depends(get_db)):
    """Streams a CSV file of all completed trips for Excel/Financial Analysis"""
    trips = db.query(Trip).all()

    # Generator function to stream rows to the client without loading everything into memory
    def iter_csv():
        output = io.StringIO()
        writer = csv.writer(output)
        # Write headers
        writer.writerow(["Trip ID", "Vehicle ID", "Driver ID", "Status", "Cargo Weight (kg)", "Start Time", "End Time", "Distance (km)"])
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)

        # Write data
        for trip in trips:
            distance = (trip.end_odometer - trip.start_odometer) if (trip.end_odometer and trip.start_odometer) else 0
            writer.writerow([
                trip.id, trip.vehicle_id, trip.driver_id, trip.status, 
                trip.cargo_weight_kg, trip.start_time, trip.end_time, distance
            ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    response = StreamingResponse(iter_csv(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=transitops_trips_report.csv"
    return response