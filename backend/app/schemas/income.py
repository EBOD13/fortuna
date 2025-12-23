from pydantic import BaseModel, Field
from datetime import date, datetime
from uuid import UUID
from typing import Optional
from decimal import Decimal

class IncomeSourceBase(BaseModel):
    source_name: str = Field(..., min_length=1, max_length=255)
    source_type: str = Field(..., pattern="^(scholarship|salary|hourly|freelance|stipend|other)$")
    pay_structure: str = Field(..., pattern="^(hourly|daily|session|salary|fixed)$")
    pay_rate: Optional[Decimal] = None
    pay_unit: Optional[str] = None
    amount: Decimal = Field(..., gt=0)
    frequency: str = Field(..., pattern="^(weekly|biweekly|monthly|semester|one-time)$")
    next_payment_date: Optional[date] = None
    max_hours_per_week: Optional[int] = Field(None, ge=0, le=168)
    tax_rate_federal: Optional[Decimal] = Field(None, ge=0, le=100)
    tax_rate_state: Optional[Decimal] = Field(None, ge=0, le=100)
    tax_rate_city: Optional[Decimal] = Field(None, ge=0, le=100)
    is_recurring: bool = True
    notes: Optional[str] = None

class IncomeSourceCreate(IncomeSourceBase):
    pass

class IncomeSourceUpdate(BaseModel):
    source_name: Optional[str] = None
    amount: Optional[Decimal] = None
    next_payment_date: Optional[date] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class IncomeSourceResponse(IncomeSourceBase):
    income_id: UUID
    user_id: UUID
    tax_rate_fica: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True