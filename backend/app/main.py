from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

# Import all modularized routers
from app.routers import auth, vehicles, drivers, trips, maintenance, analytics, fuel_expenses, dashboard, reports

# Ensure tables exist
Base.metadata.create_all(bind=engine)


def ensure_driver_columns():
    with engine.connect() as connection:
        try:
            result = connection.execute(text("PRAGMA table_info('drivers')"))
            columns = {row[1] for row in result}
            if 'license_category' not in columns:
                connection.execute(text("ALTER TABLE drivers ADD COLUMN license_category VARCHAR"))
            if 'contact_number' not in columns:
                connection.execute(text("ALTER TABLE drivers ADD COLUMN contact_number VARCHAR"))
            if 'safety_score' not in columns:
                connection.execute(text("ALTER TABLE drivers ADD COLUMN safety_score INTEGER DEFAULT 100"))
        except OperationalError:
            pass


ensure_driver_columns()


def ensure_demo_users():
    db = SessionLocal()
    try:
        demo_users = [
            ("manager@transitops.com", "Fleet Manager"),
            ("driver@transitops.com", "Driver"),
            ("safety@transitops.com", "Safety Officer"),
            ("analyst@transitops.com", "Financial Analyst"),
        ]
        for email, role in demo_users:
            user = db.query(User).filter(User.email == email).first()
            if user is None:
                db.add(User(email=email, hashed_password=get_password_hash("password123"), role=role))
            else:
                user.hashed_password = get_password_hash("password123")
                user.role = role
        db.commit()
    finally:
        db.close()


ensure_demo_users()

app = FastAPI(
    title="TransitOps API",
    description="Smart Transport Operations Platform - Core Backend",
    version="1.0.0"
)

# CORS setup for the React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to localhost:5173 in production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all feature routers
app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(trips.router)
app.include_router(maintenance.router)
app.include_router(analytics.router)
app.include_router(fuel_expenses.router)
app.include_router(dashboard.router)
app.include_router(reports.router)

@app.get("/")
def health_check():
    return {"status": "healthy", "system": "TransitOps"}