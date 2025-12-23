from pydantic import BaseModel, Field
from datetime import date, datetime
from uuid import UUID
from typing import Optional, List
from decimal import Decimal

# History Schemas
class RecurringExpenseHistoryCreate(BaseModel):
    amount_paid: Decimal = Field(..., gt=0)
    payment_date: date = Field(default_factory=date.today)
    notes: Optional[str] = None

class RecurringExpenseHistoryResponse(BaseModel):
    history_id: UUID
    recurring_id: UUID
    amount_paid: Decimal
    expected_amount: Optional[Decimal]
    variance: Optional[Decimal]
    payment_date: date
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Recurring Expense Schemas
class RecurringExpenseBase(BaseModel):
    expense_name: str = Field(..., min_length=1, max_length=255)
    category_id: Optional[UUID] = None
    base_amount: Decimal = Field(..., gt=0)
    is_variable: bool = False
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    frequency: str = Field(..., pattern="^(weekly|biweekly|monthly|quarterly|yearly)$")
    start_date: date
    end_date: Optional[date] = None
    next_due_date: date
    auto_pay: bool = False
    payment_method: Optional[str] = None
    provider_name: Optional[str] = None
    account_number: Optional[str] = None
    notes: Optional[str] = None
    reminder_days_before: int = Field(default=3, ge=0, le=30)

class RecurringExpenseCreate(RecurringExpenseBase):
    pass

class RecurringExpenseUpdate(BaseModel):
    expense_name: Optional[str] = None
    base_amount: Optional[Decimal] = None
    next_due_date: Optional[date] = None
    auto_pay: Optional[bool] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class RecurringExpenseResponse(RecurringExpenseBase):
    recurring_id: UUID
    user_id: UUID
    avg_amount: Optional[Decimal]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class RecurringExpenseWithHistory(RecurringExpenseResponse):
    recent_payments: List[RecurringExpenseHistoryResponse] = []