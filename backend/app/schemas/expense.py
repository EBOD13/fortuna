from pydantic import BaseModel, Field
from datetime import date, datetime, time
from uuid import UUID
from typing import Optional, List
from decimal import Decimal

# Category Schemas
class ExpenseCategoryBase(BaseModel):
    category_name: str = Field(..., max_length=100)
    category_type: str = Field(..., pattern="^(fixed|variable|discretionary)$")
    is_essential: bool = True
    monthly_budget: Optional[Decimal] = None
    icon: Optional[str] = None

class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass

class ExpenseCategoryResponse(ExpenseCategoryBase):
    category_id: UUID
    user_id: UUID
    
    class Config:
        from_attributes = True

# Expense Schemas
class ExpenseBase(BaseModel):
    expense_name: str = Field(..., min_length=1, max_length=255)
    amount: Decimal = Field(..., gt=0)
    expense_date: date
    category_id: Optional[UUID] = None
    payment_method: Optional[str] = None
    merchant_name: Optional[str] = None
    location: Optional[str] = None
    is_recurring: bool = False
    recurrence_frequency: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    logged_immediately: bool = False

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    expense_name: Optional[str] = None
    amount: Optional[Decimal] = None
    expense_date: Optional[date] = None
    category_id: Optional[UUID] = None
    payment_method: Optional[str] = None
    merchant_name: Optional[str] = None
    notes: Optional[str] = None

class ExpenseResponse(ExpenseBase):
    expense_id: UUID
    user_id: UUID
    expense_time: Optional[time]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True