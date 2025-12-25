# backend/app/api/v1/expenses.py
"""
Expenses API Endpoints
Track expenses with emotional context - the heart of Fortuna
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import date

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.expense_service import ExpenseService
from app.schemas.expense import (
    ExpenseCreate, ExpenseUpdate,
    ExpenseResponse, ExpenseSummary,
    ExpenseCategoryCreate, ExpenseCategoryUpdate, ExpenseCategoryResponse,
    ExpenseEmotionCreate, ExpenseEmotionReflection, ExpenseEmotionResponse,
    DailyCheckinCreate, DailyCheckinComplete, DailyCheckinResponse,
    SpendingStreakResponse,
    QuickExpenseLog, BulkExpenseLog,
    ExpenseStats, EmotionalSpendingStats, MonthlySpendingBreakdown,
    CategoryType
)
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/expenses", tags=["Expenses"])


# ============================================
# CATEGORIES
# ============================================

@router.post(
    "/categories",
    response_model=ExpenseCategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create expense category"
)
async def create_category(
    category_data: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a custom expense category."""
    service = ExpenseService(db)
    return service.create_category(current_user.user_id, category_data)


@router.get(
    "/categories",
    response_model=List[ExpenseCategoryResponse],
    summary="Get expense categories"
)
async def get_categories(
    include_system: bool = Query(True, description="Include system default categories"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all available expense categories."""
    service = ExpenseService(db)
    return service.get_categories(current_user.user_id, include_system)


@router.post(
    "/categories/setup-defaults",
    response_model=List[ExpenseCategoryResponse],
    summary="Create default categories"
)
async def setup_default_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create default expense categories for your account."""
    service = ExpenseService(db)
    return service.create_default_categories(current_user.user_id)


# ============================================
# EXPENSE CRUD
# ============================================

@router.post(
    "/",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create expense"
)
async def create_expense(
    expense_data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new expense with optional emotional context.
    
    Include the `emotion` field to capture:
    - How you were feeling (happy, stressed, bored, etc.)
    - Whether it was urgent/necessary
    - Why you made the purchase
    
    This is the key to understanding your spending patterns!
    """
    service = ExpenseService(db)
    
    try:
        expense = service.create_expense(current_user.user_id, expense_data)
        return _build_expense_response(expense)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/",
    response_model=List[ExpenseSummary],
    summary="Get expenses"
)
async def get_expenses(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    category_id: Optional[UUID] = Query(None),
    has_emotion: Optional[bool] = Query(None, description="Filter by emotional data presence"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get expenses with optional filters."""
    service = ExpenseService(db)
    
    expenses = service.get_expenses(
        current_user.user_id,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        has_emotion=has_emotion,
        limit=limit
    )
    
    return [_build_expense_summary(e) for e in expenses]


@router.get(
    "/stats",
    response_model=ExpenseStats,
    summary="Get expense statistics"
)
async def get_expense_stats(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get expense statistics for the current or specified month."""
    service = ExpenseService(db)
    return service.get_expense_stats(current_user.user_id, month, year)


@router.get(
    "/emotional-stats",
    response_model=EmotionalSpendingStats,
    summary="Get emotional spending analysis"
)
async def get_emotional_stats(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get emotional spending analysis.
    
    Reveals:
    - How much you spend based on emotions
    - Your spending triggers
    - Best/worst times for spending
    - Purchases you regret vs those that brought joy
    """
    service = ExpenseService(db)
    return service.get_emotional_stats(current_user.user_id, month, year)


@router.get(
    "/{expense_id}",
    response_model=ExpenseResponse,
    summary="Get expense"
)
async def get_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about an expense."""
    service = ExpenseService(db)
    
    try:
        expense = service.get_expense(expense_id, current_user.user_id)
        return _build_expense_response(expense)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put(
    "/{expense_id}",
    response_model=ExpenseResponse,
    summary="Update expense"
)
async def update_expense(
    expense_id: UUID,
    expense_data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing expense."""
    service = ExpenseService(db)
    
    try:
        expense = service.update_expense(expense_id, current_user.user_id, expense_data)
        return _build_expense_response(expense)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete expense"
)
async def delete_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an expense."""
    service = ExpenseService(db)
    
    try:
        service.delete_expense(expense_id, current_user.user_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============================================
# EMOTIONAL TRACKING
# ============================================

@router.post(
    "/{expense_id}/emotion",
    response_model=ExpenseEmotionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add emotional context"
)
async def add_emotion(
    expense_id: UUID,
    emotion_data: ExpenseEmotionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add emotional context to an expense.
    
    Capture:
    - **primary_emotion**: How you felt (stressed, happy, bored, etc.)
    - **was_necessary**: Was it truly necessary?
    - **purchase_reason**: Why did you buy this?
    - **stress_level**: How stressed were you (1-10)?
    - **trigger_event**: What triggered this purchase?
    """
    service = ExpenseService(db)
    
    try:
        return service.add_emotion_to_expense(expense_id, current_user.user_id, emotion_data)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/{expense_id}/reflect",
    response_model=ExpenseEmotionResponse,
    summary="Reflect on expense"
)
async def reflect_on_expense(
    expense_id: UUID,
    reflection_data: ExpenseEmotionReflection,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reflect on a past expense.
    
    Looking back:
    - **regret_level**: How much do you regret it? (1-10)
    - **brought_joy**: Did it bring lasting happiness?
    - **would_buy_again**: Knowing what you know now...
    """
    service = ExpenseService(db)
    
    try:
        return service.reflect_on_expense(expense_id, current_user.user_id, reflection_data)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/unreflected",
    response_model=List[ExpenseSummary],
    summary="Get unreflected expenses"
)
async def get_unreflected(
    days_back: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get expenses that have emotional data but no reflection yet."""
    service = ExpenseService(db)
    expenses = service.get_unreflected_expenses(current_user.user_id, days_back)
    return [_build_expense_summary(e) for e in expenses]


# ============================================
# DAILY CHECK-IN
# ============================================

@router.get(
    "/checkin/today",
    response_model=DailyCheckinResponse,
    summary="Get today's check-in"
)
async def get_today_checkin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get or create today's daily check-in."""
    service = ExpenseService(db)
    return service.get_daily_checkin(current_user.user_id)


@router.get(
    "/checkin/{checkin_date}",
    response_model=DailyCheckinResponse,
    summary="Get check-in for date"
)
async def get_checkin(
    checkin_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get daily check-in for a specific date."""
    service = ExpenseService(db)
    return service.get_daily_checkin(current_user.user_id, checkin_date)


@router.post(
    "/checkin/complete",
    response_model=DailyCheckinResponse,
    summary="Complete daily check-in"
)
async def complete_checkin(
    checkin_data: DailyCheckinComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Complete the daily check-in.
    
    End your day by confirming you've logged all expenses
    and captured your emotional state.
    """
    service = ExpenseService(db)
    return service.complete_daily_checkin(current_user.user_id, checkin_data)


# ============================================
# STREAKS
# ============================================

@router.get(
    "/streaks",
    response_model=List[SpendingStreakResponse],
    summary="Get spending streaks"
)
async def get_streaks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get your spending discipline streaks.
    
    Track your progress on:
    - Daily expense logging
    - No impulse purchases
    - Staying under budget
    - And more!
    """
    service = ExpenseService(db)
    return service.get_streaks(current_user.user_id)


# ============================================
# QUICK LOGGING
# ============================================

@router.post(
    "/quick",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Quick log expense"
)
async def quick_log(
    log_data: QuickExpenseLog,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Quickly log an expense with minimal fields.
    
    Perfect for logging on-the-go right after a purchase.
    Just provide the name, amount, and optionally how you felt.
    """
    service = ExpenseService(db)
    expense = service.quick_log(current_user.user_id, log_data)
    return _build_expense_response(expense)


@router.post(
    "/bulk",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Bulk log expenses"
)
async def bulk_log(
    bulk_data: BulkExpenseLog,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Log multiple expenses at once.
    
    Perfect for end-of-day logging when you catch up on all purchases.
    """
    service = ExpenseService(db)
    expenses, checkin = service.bulk_log(current_user.user_id, bulk_data)
    
    return {
        "expenses_logged": len(expenses),
        "total_amount": sum(float(e.amount) for e in expenses),
        "checkin_completed": checkin.completed_at is not None,
        "current_streak": checkin.current_streak
    }


# ============================================
# HELPERS
# ============================================

def _build_expense_response(expense) -> ExpenseResponse:
    """Build full expense response"""
    category_name = None
    if expense.category:
        category_name = expense.category.category_name
    
    emotion_response = None
    if expense.emotion:
        emotion_response = ExpenseEmotionResponse(
            emotion_id=expense.emotion.emotion_id,
            expense_id=expense.emotion.expense_id,
            was_urgent=expense.emotion.was_urgent,
            was_necessary=expense.emotion.was_necessary,
            is_asset=expense.emotion.is_asset,
            primary_emotion=expense.emotion.primary_emotion,
            emotion_intensity=expense.emotion.emotion_intensity,
            secondary_emotions=expense.emotion.secondary_emotions,
            purchase_reason=expense.emotion.purchase_reason,
            time_of_day=expense.emotion.time_of_day,
            day_type=expense.emotion.day_type,
            stress_level=expense.emotion.stress_level,
            trigger_event=expense.emotion.trigger_event,
            regret_level=expense.emotion.regret_level,
            brought_joy=expense.emotion.brought_joy,
            would_buy_again=expense.emotion.would_buy_again,
            reflection_notes=expense.emotion.reflection_notes,
            created_at=expense.emotion.created_at,
            reflected_at=expense.emotion.reflected_at
        )
    
    return ExpenseResponse(
        expense_id=expense.expense_id,
        user_id=expense.user_id,
        category_id=expense.category_id,
        expense_name=expense.expense_name,
        description=expense.description,
        amount=expense.amount,
        expense_date=expense.expense_date,
        expense_time=expense.expense_time,
        merchant_name=expense.merchant_name,
        location=expense.location,
        payment_method=expense.payment_method,
        is_recurring=expense.is_recurring,
        recurring_expense_id=expense.recurring_expense_id,
        dependent_id=expense.dependent_id,
        tags=expense.tags,
        receipt_url=expense.receipt_url,
        is_planned=expense.is_planned,
        logged_immediately=expense.logged_immediately,
        notes=expense.notes,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
        category_name=category_name,
        emotion=emotion_response
    )


def _build_expense_summary(expense) -> ExpenseSummary:
    """Build lightweight expense summary"""
    return ExpenseSummary(
        expense_id=expense.expense_id,
        expense_name=expense.expense_name,
        amount=expense.amount,
        expense_date=expense.expense_date,
        category_name=expense.category.category_name if expense.category else None,
        merchant_name=expense.merchant_name,
        has_emotion=expense.emotion is not None,
        primary_emotion=expense.emotion.primary_emotion if expense.emotion else None
    )