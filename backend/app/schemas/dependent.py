from pydantic import BaseModel, Field
from datetime import date, datetime
from uuid import UUID
from typing import Optional, List
from decimal import Decimal

# Dependent Expense Schemas
class DependentExpenseBase(BaseModel):
    expense_name: str = Field(..., min_length=1, max_length=255)
    amount: Decimal = Field(..., gt=0)
    expense_date: date
    category_id: Optional[UUID] = None
    is_recurring: bool = False
    frequency: Optional[str] = None
    notes: Optional[str] = None

class DependentExpenseCreate(DependentExpenseBase):
    pass

class DependentExpenseResponse(DependentExpenseBase):
    dependent_expense_id: UUID
    dependent_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# Shared Cost Schemas
class DependentSharedCostBase(BaseModel):
    partner_name: str = Field(..., min_length=1, max_length=255)
    total_cost: Decimal = Field(..., gt=0)
    your_contribution: Decimal = Field(..., gt=0)
    partner_contribution: Decimal = Field(..., gt=0)
    payment_date: date
    semester: Optional[str] = None
    notes: Optional[str] = None

class DependentSharedCostCreate(DependentSharedCostBase):
    pass

class DependentSharedCostResponse(DependentSharedCostBase):
    shared_cost_id: UUID
    dependent_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# Dependent Schemas
class DependentBase(BaseModel):
    dependent_name: str = Field(..., min_length=1, max_length=255)
    relationship: str = Field(..., min_length=1, max_length=50)
    dependent_type: str = Field(..., pattern="^(human|pet)$")
    dependent_category: str = Field(..., pattern="^(human|pet|asset|liability)$")
    date_of_birth: Optional[date] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    monthly_cost_estimate: Optional[Decimal] = None
    shared_responsibility: bool = False
    cost_sharing_partners: Optional[List[str]] = None
    partner_contribution_amount: Optional[Decimal] = None
    special_needs: Optional[str] = None
    notes: Optional[str] = None

class DependentCreate(DependentBase):
    pass

class DependentUpdate(BaseModel):
    dependent_name: Optional[str] = None
    monthly_cost_estimate: Optional[Decimal] = None
    partner_contribution_amount: Optional[Decimal] = None
    notes: Optional[str] = None

class DependentResponse(DependentBase):
    dependent_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class DependentWithDetails(DependentResponse):
    recent_expenses: List[DependentExpenseResponse] = []
    shared_costs: List[DependentSharedCostResponse] = []
    total_spent: Optional[Decimal] = None