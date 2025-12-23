from pydantic import BaseModel, Field
from datetime import date, datetime
from uuid import UUID
from typing import Optional, List
from decimal import Decimal

# Milestone Schemas
class GoalMilestoneBase(BaseModel):
    milestone_name: str = Field(..., min_length=1, max_length=255)
    target_amount: Decimal = Field(..., gt=0)
    target_date: date

class GoalMilestoneCreate(GoalMilestoneBase):
    pass

class GoalMilestoneResponse(GoalMilestoneBase):
    milestone_id: UUID
    goal_id: UUID
    is_achieved: bool
    achieved_date: Optional[date]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Progress History Schemas
class GoalProgressCreate(BaseModel):
    amount_added: Decimal = Field(..., gt=0)
    contribution_date: date = Field(default_factory=date.today)
    source: Optional[str] = "manual"
    notes: Optional[str] = None

class GoalProgressResponse(BaseModel):
    progress_id: UUID
    goal_id: UUID
    amount_added: Decimal
    new_total: Decimal
    progress_percentage: Decimal
    contribution_date: date
    source: str
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Goal Schemas
class FinancialGoalBase(BaseModel):
    goal_name: str = Field(..., min_length=1, max_length=255)
    goal_type: str = Field(..., pattern="^(savings|debt_payoff|purchase|emergency_fund|education|investment)$")
    target_amount: Decimal = Field(..., gt=0)
    current_amount: Decimal = Field(default=0, ge=0)
    deadline_date: Optional[date] = None
    priority_level: int = Field(..., ge=1, le=10)
    is_mandatory: bool = False
    monthly_allocation: Optional[Decimal] = None

class FinancialGoalCreate(FinancialGoalBase):
    pass

class FinancialGoalUpdate(BaseModel):
    goal_name: Optional[str] = None
    target_amount: Optional[Decimal] = None
    deadline_date: Optional[date] = None
    priority_level: Optional[int] = Field(None, ge=1, le=10)
    monthly_allocation: Optional[Decimal] = None
    status: Optional[str] = Field(None, pattern="^(active|completed|paused|cancelled)$")

class FinancialGoalResponse(FinancialGoalBase):
    goal_id: UUID
    user_id: UUID
    confidence_score: Optional[Decimal]
    status: str
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    
    # Calculated fields
    progress_percentage: Optional[float] = None
    days_remaining: Optional[int] = None
    required_monthly_savings: Optional[float] = None
    
    class Config:
        from_attributes = True

class FinancialGoalWithDetails(FinancialGoalResponse):
    milestones: List[GoalMilestoneResponse] = []
    recent_progress: List[GoalProgressResponse] = []