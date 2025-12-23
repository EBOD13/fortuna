from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
from uuid import UUID

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.recurring_expense import RecurringExpense, RecurringExpenseHistory
from app.schemas.recurring_expense import (
    RecurringExpenseCreate, RecurringExpenseUpdate, RecurringExpenseResponse,
    RecurringExpenseWithHistory, RecurringExpenseHistoryCreate, RecurringExpenseHistoryResponse
)

router = APIRouter()

# ============================================
# RECURRING EXPENSE CRUD
# ============================================

@router.post("/", response_model=RecurringExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_recurring_expense(
    expense_data: RecurringExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new recurring expense"""
    
    db_expense = RecurringExpense(
        **expense_data.dict(),
        user_id=current_user.user_id
    )
    
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    return db_expense

@router.get("/", response_model=List[RecurringExpenseResponse])
def get_recurring_expenses(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all recurring expenses"""
    
    query = db.query(RecurringExpense).filter(RecurringExpense.user_id == current_user.user_id)
    
    if active_only:
        query = query.filter(RecurringExpense.is_active == True)
    
    expenses = query.order_by(RecurringExpense.next_due_date).all()
    
    return expenses

@router.get("/upcoming", response_model=List[RecurringExpenseResponse])
def get_upcoming_bills(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get bills due in the next N days"""
    
    today = date.today()
    future_date = today + timedelta(days=days)
    
    expenses = db.query(RecurringExpense).filter(
        RecurringExpense.user_id == current_user.user_id,
        RecurringExpense.is_active == True,
        RecurringExpense.next_due_date >= today,
        RecurringExpense.next_due_date <= future_date
    ).order_by(RecurringExpense.next_due_date).all()
    
    return expenses

@router.get("/{recurring_id}", response_model=RecurringExpenseWithHistory)
def get_recurring_expense(
    recurring_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific recurring expense with payment history"""
    
    expense = db.query(RecurringExpense).filter(
        RecurringExpense.recurring_id == recurring_id,
        RecurringExpense.user_id == current_user.user_id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring expense not found"
        )
    
    # Get recent payment history
    history = db.query(RecurringExpenseHistory).filter(
        RecurringExpenseHistory.recurring_id == recurring_id
    ).order_by(RecurringExpenseHistory.payment_date.desc()).limit(12).all()
    
    # Build response
    response = RecurringExpenseWithHistory.from_orm(expense)
    response.recent_payments = [RecurringExpenseHistoryResponse.from_orm(h) for h in history]
    
    return response

@router.put("/{recurring_id}", response_model=RecurringExpenseResponse)
def update_recurring_expense(
    recurring_id: UUID,
    expense_data: RecurringExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a recurring expense"""
    
    expense = db.query(RecurringExpense).filter(
        RecurringExpense.recurring_id == recurring_id,
        RecurringExpense.user_id == current_user.user_id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring expense not found"
        )
    
    # Update fields
    for field, value in expense_data.dict(exclude_unset=True).items():
        setattr(expense, field, value)
    
    db.commit()
    db.refresh(expense)
    
    return expense

@router.delete("/{recurring_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring_expense(
    recurring_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a recurring expense"""
    
    expense = db.query(RecurringExpense).filter(
        RecurringExpense.recurring_id == recurring_id,
        RecurringExpense.user_id == current_user.user_id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring expense not found"
        )
    
    db.delete(expense)
    db.commit()
    
    return None

# ============================================
# PAYMENT HISTORY
# ============================================

@router.post("/{recurring_id}/pay", response_model=RecurringExpenseHistoryResponse, status_code=status.HTTP_201_CREATED)
def record_payment(
    recurring_id: UUID,
    payment_data: RecurringExpenseHistoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a payment for a recurring expense"""
    
    expense = db.query(RecurringExpense).filter(
        RecurringExpense.recurring_id == recurring_id,
        RecurringExpense.user_id == current_user.user_id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring expense not found"
        )
    
    # Calculate variance if variable expense
    expected_amount = expense.base_amount
    variance = payment_data.amount_paid - expected_amount
    
    # Create payment record
    db_payment = RecurringExpenseHistory(
        recurring_id=recurring_id,
        amount_paid=payment_data.amount_paid,
        expected_amount=expected_amount,
        variance=variance,
        payment_date=payment_data.payment_date,
        notes=payment_data.notes
    )
    
    db.add(db_payment)
    
    # Update avg_amount if variable
    if expense.is_variable:
        # Get all payments
        all_payments = db.query(RecurringExpenseHistory).filter(
            RecurringExpenseHistory.recurring_id == recurring_id
        ).all()
        
        total = sum(p.amount_paid for p in all_payments) + payment_data.amount_paid
        count = len(all_payments) + 1
        expense.avg_amount = total / count
        
        # Update min/max
        if expense.min_amount is None or payment_data.amount_paid < expense.min_amount:
            expense.min_amount = payment_data.amount_paid
        if expense.max_amount is None or payment_data.amount_paid > expense.max_amount:
            expense.max_amount = payment_data.amount_paid
    
    # Update next due date
    if expense.frequency == "monthly":
        expense.next_due_date = expense.next_due_date + timedelta(days=30)
    elif expense.frequency == "yearly":
        expense.next_due_date = expense.next_due_date + timedelta(days=365)
    elif expense.frequency == "quarterly":
        expense.next_due_date = expense.next_due_date + timedelta(days=90)
    elif expense.frequency == "biweekly":
        expense.next_due_date = expense.next_due_date + timedelta(days=14)
    elif expense.frequency == "weekly":
        expense.next_due_date = expense.next_due_date + timedelta(days=7)
    
    db.commit()
    db.refresh(db_payment)
    
    return db_payment