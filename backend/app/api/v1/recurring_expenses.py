# backend/app/api/v1/recurring_expenses.py
"""
Recurring Expenses API Endpoints
CRUD operations, payment tracking, and analytics for recurring expenses
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import date

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.recurring_expense_service import RecurringExpenseService
from app.schemas.recurring_expense import (
    RecurringExpenseCreate, RecurringExpenseUpdate,
    RecurringExpenseResponse, RecurringExpenseSummary,
    RecordPaymentRequest, PaymentHistoryResponse,
    UpcomingBillResponse, RecurringExpenseStats,
    MonthlyRecurringBreakdown, VariableExpenseAnalysis,
    ExpenseFrequency, RecurringExpenseType
)
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/recurring-expenses", tags=["Recurring Expenses"])


# ============================================
# CRUD ENDPOINTS
# ============================================

@router.post(
    "/",
    response_model=RecurringExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a recurring expense"
)
async def create_recurring_expense(
    expense_data: RecurringExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new recurring expense (bill, subscription, etc.)
    
    - **expense_name**: Name of the expense (e.g., "Netflix", "Car Insurance")
    - **base_amount**: Expected/typical amount
    - **is_variable**: True for expenses that vary (like utilities)
    - **frequency**: How often it recurs (monthly, weekly, etc.)
    - **next_due_date**: When the next payment is due
    - **expense_type**: Type of recurring expense (bill, subscription, insurance, etc.)
    - **is_essential**: Whether this is a necessary expense
    """
    service = RecurringExpenseService(db)
    
    try:
        expense = service.create_recurring_expense(current_user.user_id, expense_data)
        return _build_expense_response(expense)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/",
    response_model=List[RecurringExpenseSummary],
    summary="Get all recurring expenses"
)
async def get_recurring_expenses(
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    expense_type: Optional[RecurringExpenseType] = Query(None, description="Filter by type"),
    is_essential: Optional[bool] = Query(None, description="Filter essential only"),
    order_by: str = Query("next_due_date", description="Order by: next_due_date, amount, name, created"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all recurring expenses for the current user."""
    service = RecurringExpenseService(db)
    
    expenses = service.get_user_recurring_expenses(
        user_id=current_user.user_id,
        is_active=is_active,
        expense_type=expense_type.value if expense_type else None,
        is_essential=is_essential,
        order_by=order_by
    )
    
    return [_build_expense_summary(e) for e in expenses]


@router.get(
    "/stats",
    response_model=RecurringExpenseStats,
    summary="Get recurring expense statistics"
)
async def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics for recurring expenses including:
    - Total monthly/annual recurring costs
    - Essential vs discretionary breakdown
    - Auto-pay percentage
    - Upcoming and overdue counts
    """
    service = RecurringExpenseService(db)
    return service.get_stats(current_user.user_id)


@router.get(
    "/upcoming",
    response_model=List[UpcomingBillResponse],
    summary="Get upcoming bills"
)
async def get_upcoming_bills(
    days_ahead: int = Query(30, ge=1, le=365, description="Days to look ahead"),
    include_overdue: bool = Query(True, description="Include overdue bills"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all bills due within the specified number of days."""
    service = RecurringExpenseService(db)
    
    expenses = service.get_upcoming_bills(
        current_user.user_id,
        days_ahead=days_ahead,
        include_overdue=include_overdue
    )
    
    return [
        UpcomingBillResponse(
            recurring_id=e.recurring_id,
            expense_name=e.expense_name,
            expected_amount=e.expected_amount,
            due_date=e.next_due_date,
            days_until_due=e.days_until_due or 0,
            is_overdue=e.is_overdue,
            is_due_soon=e.is_due_soon,
            provider_name=e.provider_name,
            expense_type=e.expense_type,
            is_essential=e.is_essential,
            auto_pay=e.auto_pay
        )
        for e in expenses
    ]


@router.get(
    "/overdue",
    response_model=List[UpcomingBillResponse],
    summary="Get overdue bills"
)
async def get_overdue_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all overdue bills."""
    service = RecurringExpenseService(db)
    expenses = service.get_overdue_bills(current_user.user_id)
    
    return [
        UpcomingBillResponse(
            recurring_id=e.recurring_id,
            expense_name=e.expense_name,
            expected_amount=e.expected_amount,
            due_date=e.next_due_date,
            days_until_due=e.days_until_due or 0,
            is_overdue=True,
            is_due_soon=False,
            provider_name=e.provider_name,
            expense_type=e.expense_type,
            is_essential=e.is_essential,
            auto_pay=e.auto_pay
        )
        for e in expenses
    ]


@router.get(
    "/monthly-breakdown/{year}/{month}",
    response_model=MonthlyRecurringBreakdown,
    summary="Get monthly breakdown"
)
async def get_monthly_breakdown(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get breakdown of recurring expenses for a specific month."""
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    
    service = RecurringExpenseService(db)
    return service.get_monthly_breakdown(current_user.user_id, year, month)


@router.get(
    "/{recurring_id}",
    response_model=RecurringExpenseResponse,
    summary="Get a specific recurring expense"
)
async def get_recurring_expense(
    recurring_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific recurring expense."""
    service = RecurringExpenseService(db)
    
    try:
        expense = service.get_recurring_expense(recurring_id, current_user.user_id)
        return _build_expense_response(expense)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put(
    "/{recurring_id}",
    response_model=RecurringExpenseResponse,
    summary="Update a recurring expense"
)
async def update_recurring_expense(
    recurring_id: UUID,
    expense_data: RecurringExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing recurring expense."""
    service = RecurringExpenseService(db)
    
    try:
        expense = service.update_recurring_expense(recurring_id, current_user.user_id, expense_data)
        return _build_expense_response(expense)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete(
    "/{recurring_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a recurring expense"
)
async def delete_recurring_expense(
    recurring_id: UUID,
    permanent: bool = Query(False, description="Permanently delete instead of deactivating"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete or deactivate a recurring expense."""
    service = RecurringExpenseService(db)
    
    try:
        service.delete_recurring_expense(recurring_id, current_user.user_id, hard_delete=permanent)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============================================
# PAYMENT TRACKING
# ============================================

@router.post(
    "/{recurring_id}/payments",
    response_model=PaymentHistoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a payment"
)
async def record_payment(
    recurring_id: UUID,
    payment_data: RecordPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Record a payment for a recurring expense.
    
    This will:
    - Create a payment history entry
    - Calculate variance from expected amount
    - Update the average for variable expenses
    - Optionally advance the next due date
    """
    service = RecurringExpenseService(db)
    
    try:
        history, _ = service.record_payment(recurring_id, current_user.user_id, payment_data)
        return history
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/{recurring_id}/payments",
    response_model=List[PaymentHistoryResponse],
    summary="Get payment history"
)
async def get_payment_history(
    recurring_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payment history for a recurring expense."""
    service = RecurringExpenseService(db)
    
    try:
        history = service.get_payment_history(recurring_id, current_user.user_id, limit)
        return history
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============================================
# VARIABLE EXPENSE ANALYSIS
# ============================================

@router.get(
    "/{recurring_id}/analysis",
    response_model=VariableExpenseAnalysis,
    summary="Analyze a variable expense"
)
async def analyze_variable_expense(
    recurring_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed analysis for a variable recurring expense (like utilities).
    
    Includes:
    - Average, min, max amounts
    - Standard deviation
    - Trend analysis (increasing/decreasing/stable)
    - Seasonal patterns
    """
    service = RecurringExpenseService(db)
    
    try:
        return service.analyze_variable_expense(recurring_id, current_user.user_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================
# PAUSE/RESUME
# ============================================

@router.post(
    "/{recurring_id}/pause",
    response_model=RecurringExpenseResponse,
    summary="Pause a recurring expense"
)
async def pause_expense(
    recurring_id: UUID,
    pause_until: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Temporarily pause a recurring expense."""
    service = RecurringExpenseService(db)
    
    try:
        expense = service.pause_expense(recurring_id, current_user.user_id, pause_until)
        return _build_expense_response(expense)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/{recurring_id}/resume",
    response_model=RecurringExpenseResponse,
    summary="Resume a paused expense"
)
async def resume_expense(
    recurring_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Resume a paused recurring expense."""
    service = RecurringExpenseService(db)
    
    try:
        expense = service.resume_expense(recurring_id, current_user.user_id)
        return _build_expense_response(expense)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============================================
# HELPER FUNCTIONS
# ============================================

def _build_expense_response(expense) -> RecurringExpenseResponse:
    """Build full expense response with computed properties"""
    return RecurringExpenseResponse(
        recurring_id=expense.recurring_id,
        user_id=expense.user_id,
        category_id=expense.category_id,
        expense_name=expense.expense_name,
        description=expense.description,
        base_amount=expense.base_amount,
        is_variable=expense.is_variable,
        min_amount=expense.min_amount,
        max_amount=expense.max_amount,
        avg_amount=expense.avg_amount,
        frequency=expense.frequency,
        frequency_interval=expense.frequency_interval,
        start_date=expense.start_date,
        end_date=expense.end_date,
        next_due_date=expense.next_due_date,
        preferred_day=expense.preferred_day,
        auto_pay=expense.auto_pay,
        payment_method=expense.payment_method,
        provider_name=expense.provider_name,
        provider_website=expense.provider_website,
        account_number=expense.account_number,
        reminder_enabled=expense.reminder_enabled,
        reminder_days_before=expense.reminder_days_before,
        expense_type=expense.expense_type,
        is_essential=expense.is_essential,
        notes=expense.notes,
        tags=expense.tags,
        is_active=expense.is_active,
        paused_until=expense.paused_until,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
        # Computed
        is_due_soon=expense.is_due_soon,
        is_overdue=expense.is_overdue,
        days_until_due=expense.days_until_due,
        expected_amount=expense.expected_amount,
        monthly_equivalent=expense.monthly_equivalent,
        annual_cost=expense.annual_cost,
        variance_percentage=expense.variance_percentage,
        # History
        recent_payments=expense.history[:5] if expense.history else []
    )


def _build_expense_summary(expense) -> RecurringExpenseSummary:
    """Build lightweight expense summary"""
    return RecurringExpenseSummary(
        recurring_id=expense.recurring_id,
        expense_name=expense.expense_name,
        expense_type=expense.expense_type,
        provider_name=expense.provider_name,
        expected_amount=expense.expected_amount,
        next_due_date=expense.next_due_date,
        days_until_due=expense.days_until_due,
        is_due_soon=expense.is_due_soon,
        is_overdue=expense.is_overdue,
        is_essential=expense.is_essential,
        auto_pay=expense.auto_pay,
        monthly_equivalent=expense.monthly_equivalent,
        is_active=expense.is_active
    )