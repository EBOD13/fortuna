# backend/app/schemas/budget.py
"""
Budget Schemas
Pydantic models for budget API
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from enum import Enum


class BudgetType(str, Enum):
    MONTHLY = "monthly"
    WEEKLY = "weekly"
    CUSTOM = "custom"


class BudgetStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    EXCEEDED = "exceeded"


# ============================================
# CATEGORY BUDGET SCHEMAS
# ============================================

class CategoryBudgetCreate(BaseModel):
    """Create a category budget allocation"""
    category_id: UUID
    allocated_amount: Decimal = Field(..., ge=0)
    is_flexible: bool = True
    priority: int = Field(5, ge=1, le=10)
    notes: Optional[str] = None


class CategoryBudgetUpdate(BaseModel):
    """Update a category budget"""
    allocated_amount: Optional[Decimal] = Field(None, ge=0)
    is_flexible: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = None


class CategoryBudgetResponse(BaseModel):
    """Category budget response"""
    category_budget_id: UUID
    budget_id: UUID
    category_id: UUID
    category_name: Optional[str] = None
    allocated_amount: Decimal
    spent_amount: Decimal
    remaining_amount: float
    spent_percentage: float
    is_over_budget: bool
    is_flexible: bool
    priority: int
    alert_at_percentage: int
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============================================
# BUDGET SCHEMAS
# ============================================

class BudgetCreate(BaseModel):
    """Create a new budget"""
    budget_name: str = Field(..., min_length=1, max_length=255)
    budget_type: BudgetType
    start_date: date
    end_date: date
    total_amount: Decimal = Field(..., ge=0)
    
    expected_income: Optional[Decimal] = Field(None, ge=0)
    savings_target: Optional[Decimal] = Field(None, ge=0)
    savings_target_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    
    is_rollover_enabled: bool = False
    alert_at_percentage: int = Field(80, ge=0, le=100)
    notes: Optional[str] = None
    
    # Optional: Create category budgets at the same time
    category_budgets: Optional[List[CategoryBudgetCreate]] = None
    
    @field_validator('end_date')
    @classmethod
    def end_after_start(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class BudgetUpdate(BaseModel):
    """Update a budget"""
    budget_name: Optional[str] = Field(None, min_length=1, max_length=255)
    total_amount: Optional[Decimal] = Field(None, ge=0)
    expected_income: Optional[Decimal] = Field(None, ge=0)
    savings_target: Optional[Decimal] = Field(None, ge=0)
    savings_target_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    is_rollover_enabled: Optional[bool] = None
    alert_at_percentage: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[BudgetStatus] = None
    notes: Optional[str] = None


class BudgetResponse(BaseModel):
    """Budget response"""
    budget_id: UUID
    user_id: UUID
    budget_name: str
    budget_type: str
    start_date: date
    end_date: date
    
    total_amount: Decimal
    allocated_amount: Decimal
    spent_amount: Decimal
    remaining_amount: float
    unallocated_amount: float
    spent_percentage: float
    is_over_budget: bool
    days_remaining: int
    daily_allowance: float
    
    expected_income: Optional[Decimal] = None
    savings_target: Optional[Decimal] = None
    savings_target_percentage: Optional[Decimal] = None
    
    status: str
    is_rollover_enabled: bool
    alert_at_percentage: int
    alert_sent: bool
    notes: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BudgetWithCategories(BudgetResponse):
    """Budget with category breakdowns"""
    category_budgets: List[CategoryBudgetResponse] = []


# ============================================
# BUDGET TEMPLATE SCHEMAS
# ============================================

class CategoryAllocation(BaseModel):
    """Category allocation for templates"""
    category_id: UUID
    amount: Optional[Decimal] = None
    percentage: Optional[Decimal] = None  # Percentage of total budget


class BudgetTemplateCreate(BaseModel):
    """Create a budget template"""
    template_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    budget_type: BudgetType
    total_amount: Decimal = Field(..., ge=0)
    category_allocations: Optional[List[CategoryAllocation]] = None
    savings_target_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    is_default: bool = False


class BudgetTemplateResponse(BaseModel):
    """Budget template response"""
    template_id: UUID
    user_id: UUID
    template_name: str
    description: Optional[str] = None
    budget_type: str
    total_amount: Decimal
    category_allocations: Optional[List[Dict]] = None
    savings_target_percentage: Optional[Decimal] = None
    is_default: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# BUDGET HISTORY & STATS
# ============================================

class BudgetHistoryResponse(BaseModel):
    """Budget history snapshot"""
    history_id: UUID
    budget_id: UUID
    record_date: date
    total_budget: Decimal
    spent_amount: Decimal
    remaining_amount: Decimal
    spent_percentage: Decimal
    daily_spent: Decimal
    transaction_count: int
    
    class Config:
        from_attributes = True


class BudgetStats(BaseModel):
    """Budget statistics"""
    total_budgets: int
    active_budgets: int
    total_budgeted: Decimal
    total_spent: Decimal
    total_remaining: Decimal
    overall_spent_percentage: float
    avg_daily_spending: float
    projected_end_of_month: float
    on_track: bool
    
    # Category breakdown
    category_spending: List[Dict[str, Any]]
    
    # Trends
    spending_trend: str  # increasing, decreasing, stable
    compared_to_last_period: Optional[float] = None  # percentage change


class QuickBudgetCreate(BaseModel):
    """Quick budget creation from income"""
    monthly_income: Decimal = Field(..., ge=0)
    savings_percentage: Decimal = Field(20, ge=0, le=100)  # Default 20% savings
    budget_type: BudgetType = BudgetType.MONTHLY
    
    # Optional: Use 50/30/20 rule or custom
    use_fifty_thirty_twenty: bool = True


class ApplyTemplateRequest(BaseModel):
    """Apply a template to create a new budget"""
    template_id: UUID
    start_date: date
    end_date: Optional[date] = None  # Will calculate based on budget_type
    total_amount: Optional[Decimal] = None  # Override template amount