# backend/app/schemas/expense.py
"""
Expense Schemas
Pydantic models for expenses, categories, and emotional tracking
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date, datetime, time
from decimal import Decimal
from enum import Enum


# ============================================
# ENUMS
# ============================================

class CategoryType(str, Enum):
    FIXED = "fixed"
    VARIABLE = "variable"
    DISCRETIONARY = "discretionary"


class PrimaryEmotion(str, Enum):
    HAPPY = "happy"
    EXCITED = "excited"
    STRESSED = "stressed"
    ANXIOUS = "anxious"
    BORED = "bored"
    HUNGRY = "hungry"
    TIRED = "tired"
    SAD = "sad"
    FRUSTRATED = "frustrated"
    CELEBRATORY = "celebratory"
    IMPULSIVE = "impulsive"
    PLANNED = "planned"
    GUILTY = "guilty"
    NEUTRAL = "neutral"


class TimeOfDay(str, Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"
    NIGHT = "night"
    LATE_NIGHT = "late_night"


class DayType(str, Enum):
    WEEKDAY = "weekday"
    WEEKEND = "weekend"
    HOLIDAY = "holiday"
    EXAM_WEEK = "exam_week"
    PAYDAY = "payday"


class PaymentMethod(str, Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    VENMO = "venmo"
    PAYPAL = "paypal"
    APPLE_PAY = "apple_pay"
    OTHER = "other"


# ============================================
# CATEGORY SCHEMAS
# ============================================

class ExpenseCategoryCreate(BaseModel):
    """Create expense category"""
    category_name: str = Field(..., min_length=1, max_length=100)
    parent_category_id: Optional[UUID] = None
    category_type: CategoryType
    is_essential: bool = True
    monthly_budget: Optional[Decimal] = Field(None, ge=0)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=7)


class ExpenseCategoryUpdate(BaseModel):
    """Update expense category"""
    category_name: Optional[str] = Field(None, min_length=1, max_length=100)
    parent_category_id: Optional[UUID] = None
    category_type: Optional[CategoryType] = None
    is_essential: Optional[bool] = None
    monthly_budget: Optional[Decimal] = Field(None, ge=0)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=7)
    is_active: Optional[bool] = None


class ExpenseCategoryResponse(BaseModel):
    """Response for expense category"""
    category_id: UUID
    user_id: Optional[UUID] = None
    category_name: str
    parent_category_id: Optional[UUID] = None
    category_type: str
    is_essential: bool
    monthly_budget: Optional[Decimal] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_system_default: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# EMOTION SCHEMAS
# ============================================

class ExpenseEmotionCreate(BaseModel):
    """Capture emotional context for an expense"""
    # Contextual
    was_urgent: bool = False
    was_necessary: bool = False
    is_asset: bool = False
    
    # Emotion
    primary_emotion: PrimaryEmotion
    emotion_intensity: Optional[int] = Field(None, ge=1, le=10)
    secondary_emotions: Optional[List[str]] = None
    
    # The WHY
    purchase_reason: str = Field(..., min_length=1)
    
    # Context
    time_of_day: Optional[TimeOfDay] = None
    day_type: Optional[DayType] = None
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    trigger_event: Optional[str] = Field(None, max_length=255)


class ExpenseEmotionReflection(BaseModel):
    """Reflect on a past expense"""
    regret_level: Optional[int] = Field(None, ge=1, le=10)
    brought_joy: Optional[bool] = None
    would_buy_again: Optional[bool] = None
    reflection_notes: Optional[str] = None


class ExpenseEmotionResponse(BaseModel):
    """Response for expense emotion"""
    emotion_id: UUID
    expense_id: UUID
    
    was_urgent: bool
    was_necessary: bool
    is_asset: bool
    
    primary_emotion: str
    emotion_intensity: Optional[int] = None
    secondary_emotions: Optional[List[str]] = None
    
    purchase_reason: str
    
    time_of_day: Optional[str] = None
    day_type: Optional[str] = None
    stress_level: Optional[int] = None
    trigger_event: Optional[str] = None
    
    regret_level: Optional[int] = None
    brought_joy: Optional[bool] = None
    would_buy_again: Optional[bool] = None
    reflection_notes: Optional[str] = None
    
    created_at: datetime
    reflected_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================
# EXPENSE SCHEMAS
# ============================================

class ExpenseCreate(BaseModel):
    """Create a new expense"""
    expense_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    amount: Decimal = Field(..., ge=0)
    
    category_id: Optional[UUID] = None
    
    expense_date: date
    expense_time: Optional[time] = None
    
    merchant_name: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    
    payment_method: Optional[PaymentMethod] = None
    
    # Links
    recurring_expense_id: Optional[UUID] = None
    dependent_id: Optional[UUID] = None
    
    tags: Optional[List[str]] = None
    receipt_url: Optional[str] = Field(None, max_length=500)
    
    is_planned: bool = False
    logged_immediately: bool = False
    
    notes: Optional[str] = None
    
    # Optional emotion (can be added separately)
    emotion: Optional[ExpenseEmotionCreate] = None


class ExpenseUpdate(BaseModel):
    """Update an expense"""
    expense_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    
    category_id: Optional[UUID] = None
    
    expense_date: Optional[date] = None
    expense_time: Optional[time] = None
    
    merchant_name: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    
    payment_method: Optional[PaymentMethod] = None
    
    recurring_expense_id: Optional[UUID] = None
    dependent_id: Optional[UUID] = None
    
    tags: Optional[List[str]] = None
    receipt_url: Optional[str] = Field(None, max_length=500)
    
    is_planned: Optional[bool] = None
    
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    """Full expense response"""
    expense_id: UUID
    user_id: UUID
    category_id: Optional[UUID] = None
    
    expense_name: str
    description: Optional[str] = None
    amount: Decimal
    
    expense_date: date
    expense_time: Optional[time] = None
    
    merchant_name: Optional[str] = None
    location: Optional[str] = None
    
    payment_method: Optional[str] = None
    
    is_recurring: bool
    recurring_expense_id: Optional[UUID] = None
    dependent_id: Optional[UUID] = None
    
    tags: Optional[List[str]] = None
    receipt_url: Optional[str] = None
    
    is_planned: bool
    logged_immediately: bool
    
    notes: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    # Category info
    category_name: Optional[str] = None
    
    # Emotion if captured
    emotion: Optional[ExpenseEmotionResponse] = None

    class Config:
        from_attributes = True


class ExpenseSummary(BaseModel):
    """Lightweight expense for lists"""
    expense_id: UUID
    expense_name: str
    amount: Decimal
    expense_date: date
    category_name: Optional[str] = None
    merchant_name: Optional[str] = None
    has_emotion: bool = False
    primary_emotion: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================
# DAILY CHECK-IN SCHEMAS
# ============================================

class DailyCheckinCreate(BaseModel):
    """Start or update daily check-in"""
    overall_mood: Optional[str] = Field(None, max_length=50)
    mood_notes: Optional[str] = None


class DailyCheckinComplete(BaseModel):
    """Complete daily check-in"""
    expenses_logged: bool = True
    emotions_captured: bool = True
    overall_mood: Optional[str] = None
    mood_notes: Optional[str] = None


class DailyCheckinResponse(BaseModel):
    """Daily check-in response"""
    checkin_id: UUID
    user_id: UUID
    checkin_date: date
    
    expenses_logged: bool
    emotions_captured: bool
    completed_at: Optional[datetime] = None
    
    total_spent_today: Decimal
    expense_count: int
    
    overall_mood: Optional[str] = None
    mood_notes: Optional[str] = None
    
    is_streak_day: bool
    current_streak: int
    
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# SPENDING STREAK SCHEMAS
# ============================================

class SpendingStreakResponse(BaseModel):
    """Spending streak response"""
    streak_id: UUID
    streak_type: str
    streak_name: Optional[str] = None
    
    current_streak: int
    longest_streak: int
    streak_start_date: Optional[date] = None
    last_activity_date: Optional[date] = None
    
    target_streak: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True


# ============================================
# STATISTICS SCHEMAS
# ============================================

class ExpenseStats(BaseModel):
    """Expense statistics"""
    total_spent_today: Decimal
    total_spent_this_week: Decimal
    total_spent_this_month: Decimal
    
    daily_average: Decimal
    
    by_category: Dict[str, Decimal]
    by_payment_method: Dict[str, Decimal]
    
    essential_spending: Decimal
    discretionary_spending: Decimal
    
    expense_count_today: int
    expense_count_month: int


class EmotionalSpendingStats(BaseModel):
    """Emotional spending analysis"""
    total_emotional_spending: Decimal
    emotional_spending_percentage: float
    
    by_emotion: Dict[str, Decimal]
    by_time_of_day: Dict[str, Decimal]
    by_day_type: Dict[str, Decimal]
    
    average_stress_level: float
    average_regret_level: float
    
    top_triggers: List[str]
    highest_spending_emotion: str
    
    purchases_with_regret: int
    purchases_that_brought_joy: int


class MonthlySpendingBreakdown(BaseModel):
    """Monthly spending breakdown"""
    year: int
    month: int
    
    total_spending: Decimal
    by_category: Dict[str, Decimal]
    by_week: Dict[str, Decimal]
    
    essential_total: Decimal
    discretionary_total: Decimal
    
    vs_budget: Optional[Decimal] = None
    vs_last_month: Optional[Decimal] = None


# ============================================
# MONTHLY ANALYSIS SCHEMAS
# ============================================

class MonthlyAnalysisResponse(BaseModel):
    """Monthly emotional analysis"""
    analysis_id: UUID
    year: int
    month: int
    
    total_spending: Decimal
    emotional_spending_amount: Decimal
    emotional_spending_percentage: Decimal
    
    most_common_emotion: Optional[str] = None
    most_expensive_emotion: Optional[str] = None
    
    highest_spending_time: Optional[str] = None
    highest_spending_day: Optional[str] = None
    
    top_triggers: Optional[List[str]] = None
    emotional_categories: Optional[List[str]] = None
    
    ai_observations: Optional[str] = None
    behavioral_recommendations: Optional[List[str]] = None
    meal_suggestions: Optional[List[str]] = None
    
    vs_last_month_spending: Optional[Decimal] = None
    vs_last_month_emotional: Optional[Decimal] = None
    
    user_reflection: Optional[str] = None
    action_items: Optional[List[str]] = None
    reflection_completed: bool
    reflection_completed_at: Optional[datetime] = None
    
    created_at: datetime

    class Config:
        from_attributes = True


class SubmitReflection(BaseModel):
    """Submit monthly reflection"""
    user_reflection: str
    action_items: Optional[List[str]] = None


# ============================================
# QUICK LOG SCHEMAS
# ============================================

class QuickExpenseLog(BaseModel):
    """Quick expense logging with minimal fields"""
    expense_name: str
    amount: Decimal
    category_id: Optional[UUID] = None
    
    # Quick emotion capture
    primary_emotion: Optional[PrimaryEmotion] = None
    was_necessary: Optional[bool] = None
    quick_reason: Optional[str] = None


class BulkExpenseLog(BaseModel):
    """Log multiple expenses at once (end of day)"""
    expenses: List[ExpenseCreate]
    checkin_date: date
    overall_mood: Optional[str] = None