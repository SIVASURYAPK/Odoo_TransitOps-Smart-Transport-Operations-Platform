from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.finance import FinanceLog
from app.schemas.finance import FinanceCreate, FinanceResponse
from app.core.rbac import get_current_user, RoleChecker

# Create the router
router = APIRouter(prefix="/api/finance", tags=["Finance & Fuel"])

# Restrict to financial and management roles
require_finance = Depends(RoleChecker(["Fleet Manager", "Admin", "Financial Analyst"]))

@router.post("/", response_model=FinanceResponse, dependencies=[require_finance])
def log_expense(expense: FinanceCreate, db: Session = Depends(get_db)):
    new_log = FinanceLog(**expense.model_dump())
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.get("/", response_model=List[FinanceResponse], dependencies=[require_finance])
def get_all_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(FinanceLog).offset(skip).limit(limit).all()