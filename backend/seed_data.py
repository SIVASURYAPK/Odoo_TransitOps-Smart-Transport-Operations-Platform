from datetime import date, datetime, timedelta
from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.maintenance import MaintenanceLog
from app.core.security import get_password_hash

def seed():
    # Reset Database tables cleanly
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Seed Demo Users (Password: password123)
        dummy_hash = get_password_hash("password123")
        
        users = [
            User(email="manager@transitops.com", hashed_password=dummy_hash, role="Fleet Manager"),
            User(email="driver@transitops.com", hashed_password=dummy_hash, role="Driver"),
            User(email="safety@transitops.com", hashed_password=dummy_hash, role="Safety Officer"),
            User(email="analyst@transitops.com", hashed_password=dummy_hash, role="Financial Analyst"),
        ]
        db.add_all(users)

        # 2. Seed Initial Fleet
        vehicles = [
            Vehicle(license_plate="TN-01-AA-1234", model="Tata Ultra Truck", max_capacity_kg=5000.0, odometer_km=12500.0, status="Available"),
            Vehicle(license_plate="TN-01-BB-5678", model="Mahindra Bolero Pickup", max_capacity_kg=1500.0, odometer_km=42000.0, status="Available"),
            Vehicle(license_plate="TN-01-CC-9012", model="Ashok Leyland Dost", max_capacity_kg=2500.0, odometer_km=8000.0, status="In Shop"),
        ]
        db.add_all(vehicles)

        # 3. Seed Drivers (One Valid, One Expired for Validation tests)
        drivers = [
            Driver(
                name="Alex Pandian",
                license_number="DL-123456789",
                license_category="LMV",
                license_expiry=date.today() + timedelta(days=365),
                contact_number="9876543210",
                safety_score=92,
                status="Available",
            ),
            Driver(
                name="Kumar Swamy",
                license_number="DL-987654321",
                license_category="LMV",
                license_expiry=date.today() - timedelta(days=10),
                contact_number="9123456780",
                safety_score=78,
                status="Available",
            ),
            Driver(
                name="Maya Nair",
                license_number="DL-555666777",
                license_category="LMV",
                license_expiry=date.today() + timedelta(days=180),
                contact_number="9012345678",
                safety_score=88,
                status="Available",
            ),
        ]
        db.add_all(drivers)

        db.commit()

        # Refresh persisted objects so IDs are available for related records.
        for vehicle in vehicles:
            db.refresh(vehicle)
        for driver in drivers:
            db.refresh(driver)

        # 4. Seed Trips
        trips = [
            Trip(
                vehicle_id=vehicles[0].id,
                driver_id=drivers[0].id,
                cargo_weight_kg=3200.0,
                status="On Trip",
                start_time=datetime.utcnow() - timedelta(hours=3),
                start_odometer=vehicles[0].odometer_km,
            ),
            Trip(
                vehicle_id=vehicles[1].id,
                driver_id=drivers[2].id,
                cargo_weight_kg=1200.0,
                status="Completed",
                start_time=datetime.utcnow() - timedelta(days=2),
                end_time=datetime.utcnow() - timedelta(days=1),
                start_odometer=41850.0,
                end_odometer=42000.0,
            ),
        ]
        db.add_all(trips)

        # 5. Seed Maintenance Logs
        maintenance_logs = [
            MaintenanceLog(
                vehicle_id=vehicles[2].id,
                description="Engine diagnostics and troubleshooting",
                start_date=date.today() - timedelta(days=2),
                status="Open",
            ),
            MaintenanceLog(
                vehicle_id=vehicles[1].id,
                description="Brake pad replacement",
                start_date=date.today() - timedelta(days=10),
                end_date=date.today() - timedelta(days=5),
                cost=420.0,
                status="Closed",
            ),
        ]
        db.add_all(maintenance_logs)

        db.commit()
        print("Successfully seeded database tables with operational dummy records!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()