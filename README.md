# TransitOps — Smart Transport Operations Platform

A centralized platform for logistics companies to manage the full lifecycle of transport operations — vehicle registration, driver management, trip dispatching, maintenance, and fuel/expense tracking — replacing spreadsheets and manual logbooks with real-time operational visibility.

Built in 8 hours for [Hackathon Name].

## Problem

Many logistics companies still run fleet operations on spreadsheets and manual logbooks, leading to scheduling conflicts, underutilized vehicles, missed maintenance, expired driver licenses, and inaccurate expense tracking. TransitOps digitizes this entire workflow while enforcing business rules automatically.

## Target Users

| Role | Responsibilities |
|---|---|
| Fleet Manager | Oversees fleet assets, maintenance, vehicle lifecycle |
| Driver | Creates trips, monitors active deliveries |
| Safety Officer | Tracks license validity, safety scores, driver compliance |
| Financial Analyst | Reviews expenses, fuel consumption, profitability |

## Features

- Secure authentication with Role-Based Access Control (RBAC)
- Vehicle registry with unique registration numbers and status tracking
- Driver management with license expiry and safety score tracking
- Trip lifecycle management (Draft → Dispatched → Completed → Cancelled) with automatic vehicle/driver status transitions
- Maintenance workflow that automatically pulls vehicles out of the dispatch pool
- Fuel and expense logging with automatic operational cost computation
- Dashboard with live KPIs (Active/Available Vehicles, Fleet Utilization %, Drivers On Duty, etc.)
- Reports: Fuel Efficiency, Fleet Utilization, Operational Cost, Vehicle ROI, with CSV export

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Recharts, Axios
- **Backend:** FastAPI (Python), SQLAlchemy ORM, Pydantic
- **Database:** SQLite (swappable to PostgreSQL via one connection string change)
- **Auth:** JWT

## Architecture

```
React (Vite) ── REST/JSON + JWT ──▶ FastAPI ── SQLAlchemy ──▶ SQLite
```

All state transitions (dispatch, complete, cancel, maintenance open/close) are handled as atomic database transactions in the backend service layer, so vehicle/driver status is always consistent with trip/maintenance state.

## Business Rules Enforced

- Vehicle registration numbers are unique
- Retired or In Shop vehicles are excluded from dispatch selection
- Drivers with expired licenses or Suspended status cannot be assigned to trips
- A vehicle or driver already On Trip cannot be double-booked
- Cargo weight cannot exceed a vehicle's maximum load capacity
- Dispatching a trip sets both vehicle and driver to On Trip
- Completing a trip restores both to Available
- Cancelling a dispatched trip restores both to Available
- Creating a maintenance record sets the vehicle to In Shop
- Closing maintenance restores the vehicle to Available (unless Retired)

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py        # optional: populate demo data
uvicorn app.main:app --reload
```

API docs available at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at `http://localhost:5173`

## Environment Variables

Create a `.env` file in `backend/`:

```
DATABASE_URL=sqlite:///./transitops.db
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Demo Walkthrough

1. Register vehicle `Van-05` (max capacity 500 kg) — status: Available
2. Register driver `Alex` with a valid license
3. Create a trip with cargo weight 450 kg → system validates 450 ≤ 500 and allows dispatch
4. Dispatch the trip → vehicle and driver automatically become On Trip
5. Complete the trip with final odometer and fuel consumed → both revert to Available
6. Create a maintenance record (e.g., Oil Change) → vehicle automatically becomes In Shop and disappears from dispatch selection
7. Reports update operational cost and fuel efficiency based on the latest trip and fuel log

## Database Entities

Users, Roles, Vehicles, Drivers, Trips, Maintenance Logs, Fuel Logs, Expenses

## Team

- [Your Name] — [Role]
- ...

## License

MIT
