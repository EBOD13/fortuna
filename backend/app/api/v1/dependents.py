from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.dependent import Dependent, DependentExpense, DependentSharedCost
from app.schemas.dependent import (
    DependentCreate, DependentUpdate, DependentResponse, DependentWithDetails,
    DependentExpenseCreate, DependentExpenseResponse,
    DependentSharedCostCreate, DependentSharedCostResponse
)

router = APIRouter()

# ============================================
# DEPENDENT CRUD
# ============================================

@router.post("/", response_model=DependentResponse, status_code=status.HTTP_201_CREATED)
def create_dependent(
    dependent_data: DependentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new dependent"""
    
    db_dependent = Dependent(
        **dependent_data.dict(),
        user_id=current_user.user_id
    )
    
    db.add(db_dependent)
    db.commit()
    db.refresh(db_dependent)
    
    return db_dependent

@router.get("/", response_model=List[DependentResponse])
def get_dependents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all dependents"""
    
    dependents = db.query(Dependent).filter(
        Dependent.user_id == current_user.user_id
    ).all()
    
    return dependents

@router.get("/{dependent_id}", response_model=DependentWithDetails)
def get_dependent(
    dependent_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific dependent with expenses and shared costs"""
    
    dependent = db.query(Dependent).filter(
        Dependent.dependent_id == dependent_id,
        Dependent.user_id == current_user.user_id
    ).first()
    
    if not dependent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dependent not found"
        )
    
    # Get recent expenses
    expenses = db.query(DependentExpense).filter(
        DependentExpense.dependent_id == dependent_id
    ).order_by(DependentExpense.expense_date.desc()).limit(20).all()
    
    # Get shared costs
    shared_costs = db.query(DependentSharedCost).filter(
        DependentSharedCost.dependent_id == dependent_id
    ).order_by(DependentSharedCost.payment_date.desc()).all()
    
    # Calculate total spent
    total_spent = db.query(func.sum(DependentExpense.amount)).filter(
        DependentExpense.dependent_id == dependent_id
    ).scalar() or 0
    
    # Build response
    response = DependentWithDetails.from_orm(dependent)
    response.recent_expenses = [DependentExpenseResponse.from_orm(e) for e in expenses]
    response.shared_costs = [DependentSharedCostResponse.from_orm(sc) for sc in shared_costs]
    response.total_spent = total_spent
    
    return response

@router.put("/{dependent_id}", response_model=DependentResponse)
def update_dependent(
    dependent_id: UUID,
    dependent_data: DependentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a dependent"""
    
    dependent = db.query(Dependent).filter(
        Dependent.dependent_id == dependent_id,
        Dependent.user_id == current_user.user_id
    ).first()
    
    if not dependent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dependent not found"
        )
    
    # Update fields
    for field, value in dependent_data.dict(exclude_unset=True).items():
        setattr(dependent, field, value)
    
    db.commit()
    db.refresh(dependent)
    
    return dependent

@router.delete("/{dependent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dependent(
    dependent_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a dependent"""
    
    dependent = db.query(Dependent).filter(
        Dependent.dependent_id == dependent_id,
        Dependent.user_id == current_user.user_id
    ).first()
    
    if not dependent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dependent not found"
        )
    
    db.delete(dependent)
    db.commit()
    
    return None

# ============================================
# DEPENDENT EXPENSES
# ============================================

@router.post("/{dependent_id}/expenses", response_model=DependentExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_dependent_expense(
    dependent_id: UUID,
    expense_data: DependentExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add an expense for a dependent"""
    
    # Verify dependent exists and belongs to user
    dependent = db.query(Dependent).filter(
        Dependent.dependent_id == dependent_id,
        Dependent.user_id == current_user.user_id
    ).first()
    
    if not dependent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dependent not found"
        )
    
    db_expense = DependentExpense(
        **expense_data.dict(),
        dependent_id=dependent_id
    )
    
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    return db_expense

# ============================================
# SHARED COSTS
# ============================================

@router.post("/{dependent_id}/shared-costs", response_model=DependentSharedCostResponse, status_code=status.HTTP_201_CREATED)
def create_shared_cost(
    dependent_id: UUID,
    shared_cost_data: DependentSharedCostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a shared cost for a dependent"""
    
    # Verify dependent exists and belongs to user
    dependent = db.query(Dependent).filter(
        Dependent.dependent_id == dependent_id,
        Dependent.user_id == current_user.user_id
    ).first()
    
    if not dependent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dependent not found"
        )
    
    db_shared_cost = DependentSharedCost(
        **shared_cost_data.dict(),
        dependent_id=dependent_id
    )
    
    db.add(db_shared_cost)
    db.commit()
    db.refresh(db_shared_cost)
    
    return db_shared_cost