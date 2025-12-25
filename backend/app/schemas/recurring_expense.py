# backend/app/schemas/recurring_expense.py
"""
Recurring Expense Schemas
Pydantic models for API request/response validation
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from enum import Enum


# ============================================
# ENUMS
# ============================================

class ExpenseFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMI_ANNUAL = "semi-annual"
    ANNUAL = "annual"


class RecurringExpenseType(str, Enum):
    BILL = "bill"
    SUBSCRIPTION = "subscription"
    INSURANCE = "insurance"
    LOAN = "loan"
    RENT = "rent"
    UTILITY = "utility"
    OTHER = "other"


class PaymentMethod(str, Enum):
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    CASH = "cash"
    CHECK = "check"
    AUTO_DEBIT = "auto_debit"
    OTHER = "other"


# ============================================
# CREATE/UPDATE SCHEMAS
# ============================================

class RecurringExpenseCreate(BaseModel):
    """Schema for creating a new recurring expense"""
    expense_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    
    # Amount
    base_amount: Decimal = Field(..., ge=0, decimal_places=2)
    is_variable: bool = False
    min_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    max_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    
    # Frequency
    frequency: ExpenseFrequency
    frequency_interval: int = Field(1, ge=1, le=12)
    
    # Schedule
    start_date: date
    end_date: Optional[date] = None
    next_due_date: date
    preferred_day: Optional[int] = Field(None, ge=1, le=28)
    
    # Payment
    auto_pay: bool = False
    payment_method: Optional[PaymentMethod] = None
    
    # Provider
    provider_name: Optional[str] = Field(None, max_length=255)
    provider_website: Optional[str] = Field(None, max_length=500)
    account_number: Optional[str] = Field(None, max_length=100)
    
    # Reminder
    reminder_enabled: bool = True
    reminder_days_before: int = Field(3, ge=0, le=30)
    
    # Type
    expense_type: RecurringExpenseType = RecurringExpenseType.BILL
    is_essential: bool = True
    
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    
    @field_validator('max_amount')
    @classmethod
    def max_must_be_greater_than_min(cls, v, info):
        if v is not None and info.data.get('min_amount') is not None:
            if v < info.data['min_amount']:
                raise ValueError('max_amount must be >= min_amount')
        return v
    
    @field_validator('end_date')
    @classmethod
    def end_must_be_after_start(cls, v, info):
        if v is not None and info.data.get('start_date') is not None:
            if v < info.data['start_date']:
                raise ValueError('end_date must be >= start_date')
        return v


class RecurringExpenseUpdate(BaseModel):
    """Schema for updating a recurring expense"""
    expense_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    
    base_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    is_variable: Optional[bool] = None
    min_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    max_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    
    frequency: Optional[ExpenseFrequency] = None
    frequency_interval: Optional[int] = Field(None, ge=1, le=12)
    
    end_date: Optional[date] = None
    next_due_date: Optional[date] = None
    preferred_day: Optional[int] = Field(None, ge=1, le=28)
    
    auto_pay: Optional[bool] = None
    payment_method: Optional[PaymentMethod] = None
    
    provider_name: Optional[str] = Field(None, max_length=255)
    provider_website: Optional[str] = Field(None, max_length=500)
    account_number: Optional[str] = Field(None, max_length=100)
    
    reminder_enabled: Optional[bool] = None
    reminder_days_before: Optional[int] = Field(None, ge=0, le=30)
    
    expense_type: Optional[RecurringExpenseType] = None
    is_essential: Optional[bool] = None
    
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    
    is_active: Optional[bool] = None
    paused_until: Optional[date] = None


# ============================================
# PAYMENT/HISTORY SCHEMAS
# ============================================

class RecordPaymentRequest(BaseModel):
    """Schema for recording a payment for a recurring expense"""
    amount_paid: Decimal = Field(..., ge=0, decimal_places=2)
    payment_date: date
    payment_method: Optional[PaymentMethod] = None
    confirmation_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    
    # Options
    update_next_due: bool = True  # Automatically calculate next due date
    create_expense_entry: bool = True  # Create a linked expense record


class PaymentHistoryResponse(BaseModel):
    """Schema for payment history entries"""
    history_id: UUID
    recurring_id: UUID
    
    amount_paid: Decimal
    expected_amount: Optional[Decimal] = None
    variance: Optional[Decimal] = None
    variance_percentage: Optional[Decimal] = None
    
    payment_date: date
    due_date: Optional[date] = None
    
    was_on_time: bool = True
    days_late: int = 0
    
    payment_method: Optional[str] = None
    confirmation_number: Optional[str] = None
    expense_id: Optional[UUID] = None
    
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# RESPONSE SCHEMAS
# ============================================

class RecurringExpenseResponse(BaseModel):
    """Full recurring expense response"""
    recurring_id: UUID
    user_id: UUID
    category_id: Optional[UUID] = None
    
    expense_name: str
    description: Optional[str] = None
    
    base_amount: Decimal
    is_variable: bool
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    avg_amount: Optional[Decimal] = None
    
    frequency: str
    frequency_interval: int
    
    start_date: date
    end_date: Optional[date] = None
    next_due_date: date
    preferred_day: Optional[int] = None
    
    auto_pay: bool
    payment_method: Optional[str] = None
    
    provider_name: Optional[str] = None
    provider_website: Optional[str] = None
    account_number: Optional[str] = None
    
    reminder_enabled: bool
    reminder_days_before: int
    
    expense_type: str
    is_essential: bool
    
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    
    is_active: bool
    paused_until: Optional[date] = None
    
    created_at: datetime
    updated_at: datetime
    
    # Computed properties
    is_due_soon: bool
    is_overdue: bool
    days_until_due: Optional[int] = None
    expected_amount: float
    monthly_equivalent: float
    annual_cost: float
    variance_percentage: Optional[float] = None
    
    # Recent history
    recent_payments: List[PaymentHistoryResponse] = []

    class Config:
        from_attributes = True


class RecurringExpenseSummary(BaseModel):
    """Lightweight summary for list views"""
    recurring_id: UUID
    expense_name: str
    expense_type: str
    provider_name: Optional[str] = None
    
    expected_amount: float
    next_due_date: date
    days_until_due: Optional[int] = None
    
    is_due_soon: bool
    is_overdue: bool
    is_essential: bool
    auto_pay: bool
    
    monthly_equivalent: float
    
    is_active: bool

    class Config:
        from_attributes = True


class UpcomingBillResponse(BaseModel):
    """Upcoming bill for dashboard"""
    recurring_id: UUID
    expense_name: str
    expected_amount: Decimal
    due_date: date
    days_until_due: int
    
    is_overdue: bool
    is_due_soon: bool
    
    provider_name: Optional[str] = None
    expense_type: str
    is_essential: bool
    auto_pay: bool

    class Config:
        from_attributes = True


# ============================================
# ANALYTICS SCHEMAS
# ============================================

class RecurringExpenseStats(BaseModel):
    """Statistics for recurring expenses"""
    total_monthly_recurring: Decimal
    total_annual_recurring: Decimal
    
    essential_monthly: Decimal
    discretionary_monthly: Decimal
    
    total_active_expenses: int
    bills_count: int
    subscriptions_count: int
    
    auto_pay_percentage: float
    
    upcoming_bills_7_days: int
    overdue_count: int


class MonthlyRecurringBreakdown(BaseModel):
    """Monthly breakdown by category/type"""
    month: str  # "2025-01"
    
    by_type: dict  # {"subscription": 50.00, "utility": 150.00}
    by_category: dict  # {"Entertainment": 50.00, "Housing": 150.00}
    
    total: Decimal
    essential_total: Decimal
    discretionary_total: Decimal


class VariableExpenseAnalysis(BaseModel):
    """Analysis of variable recurring expenses (like utilities)"""
    recurring_id: UUID
    expense_name: str
    
    avg_amount: Decimal
    min_recorded: Decimal
    max_recorded: Decimal
    std_deviation: Decimal
    
    trend: str  # "increasing", "decreasing", "stable"
    trend_percentage: float
    
    seasonal_pattern: Optional[dict] = None  # {"summer": 180, "winter": 120}
    
    payment_count: int


# ============================================
# BULK OPERATIONS
# ============================================

class BulkRecordPayments(BaseModel):
    """Record payments for multiple recurring expenses"""
    payments: List[dict]  # [{"recurring_id": UUID, "amount_paid": Decimal, "payment_date": date}]
    default_payment_method: Optional[PaymentMethod] = None


class RecurringExpenseImport(BaseModel):
    """Import recurring expenses from CSV/external source"""
    expenses: List[RecurringExpenseCreate]
    skip_duplicates: bool = True
    duplicate_check_fields: List[str] = ["expense_name", "provider_name"]