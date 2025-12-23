from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.income_source import IncomeSource
from app.schemas.income import IncomeSourceCreate, IncomeSourceUpdate, IncomeSourceResponse

router = APIRouter()

@router.post("/", response_model=IncomeSourceResponse, status_code=status.HTTP_201_CREATED)
def create_income_source(
    income_data: IncomeSourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new income source"""
    
    db_income = IncomeSource(
        **income_data.dict(),
        user_id=current_user.user_id
    )
    
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    
    return db_income

@router.get("/", response_model=List[IncomeSourceResponse])
def get_income_sources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active income sources for current user"""
    
    income_sources = db.query(IncomeSource).filter(
        IncomeSource.user_id == current_user.user_id,
        IncomeSource.is_active == True
    ).all()
    
    return income_sources

@router.get("/{income_id}", response_model=IncomeSourceResponse)
def get_income_source(
    income_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific income source"""
    
    income_source = db.query(IncomeSource).filter(
        IncomeSource.income_id == income_id,
        IncomeSource.user_id == current_user.user_id
    ).first()
    
    if not income_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income source not found"
        )
    
    return income_source

@router.put("/{income_id}", response_model=IncomeSourceResponse)
def update_income_source(
    income_id: UUID,
    income_data: IncomeSourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an income source"""
    
    income_source = db.query(IncomeSource).filter(
        IncomeSource.income_id == income_id,
        IncomeSource.user_id == current_user.user_id
    ).first()
    
    if not income_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income source not found"
        )
    
    # Update fields
    for field, value in income_data.dict(exclude_unset=True).items():
        setattr(income_source, field, value)
    
    db.commit()
    db.refresh(income_source)
    
    return income_source

@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income_source(
    income_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete (soft delete) an income source"""
    
    income_source = db.query(IncomeSource).filter(
        IncomeSource.income_id == income_id,
        IncomeSource.user_id == current_user.user_id
    ).first()
    
    if not income_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income source not found"
        )
    
    # Soft delete
    income_source.is_active = False
    db.commit()
    
    return None