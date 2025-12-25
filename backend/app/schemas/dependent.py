# backend/app/schemas/dependent.py
"""
Dependent Schemas
Pydantic models for API request/response validation
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from enum import Enum


# ============================================
# ENUMS
# ============================================

class DependentType(str, Enum):
    HUMAN = "human"
    PET = "pet"
    OTHER = "other"


class DependentCategory(str, Enum):
    FAMILY_EDUCATION = "family_education"
    CHILD_SUPPORT = "child_support"
    ELDER_CARE = "elder_care"
    PET_CARE = "pet_care"
    SPOUSE_SUPPORT = "spouse_support"
    SIBLING_SUPPORT = "sibling_support"
    OTHER = "other"


class Relationship(str, Enum):
    BROTHER = "brother"
    SISTER = "sister"
    PARENT = "parent"
    CHILD = "child"
    SPOUSE = "spouse"
    GRANDPARENT = "grandparent"
    PET = "pet"
    OTHER = "other"


class ExpenseFrequency(str, Enum):
    ONE_TIME = "one_time"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    SEMESTER = "semester"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"
    AS_NEEDED = "as_needed"


# ============================================
# EXPENSE TYPE SCHEMAS
# ============================================

class ExpenseTypeCreate(BaseModel):
    """Create expense type for a dependent"""
    type_name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    expected_amount: Optional[Decimal] = Field(None, ge=0)
    frequency: Optional[ExpenseFrequency] = None
    is_recurring: bool = False
    monthly_budget: Optional[Decimal] = Field(None, ge=0)


class ExpenseTypeResponse(BaseModel):
    """Response for expense type"""
    type_id: UUID
    dependent_id: UUID
    type_name: str
    description: Optional[str] = None
    expected_amount: Optional[Decimal] = None
    frequency: Optional[str] = None
    is_recurring: bool
    monthly_budget: Optional[Decimal] = None
    total_spent: Decimal
    last_expense_date: Optional[date] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# DEPENDENT SCHEMAS
# ============================================

class DependentCreate(BaseModel):
    """Schema for creating a new dependent"""
    dependent_name: str = Field(..., min_length=1, max_length=255)
    relationship: Relationship
    dependent_type: DependentType
    dependent_category: DependentCategory
    
    # Human-specific
    date_of_birth: Optional[date] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    
    # Pet-specific
    pet_type: Optional[str] = Field(None, max_length=50)
    pet_breed: Optional[str] = Field(None, max_length=100)
    
    # Financial
    monthly_cost_estimate: Optional[Decimal] = Field(None, ge=0)
    
    # Time-bound support
    support_start_date: Optional[date] = None
    support_end_date: Optional[date] = None
    remaining_semesters: Optional[int] = Field(None, ge=0)
    
    # Shared costs
    shared_responsibility: bool = False
    cost_sharing_partners: Optional[List[str]] = None
    your_share_percentage: Decimal = Field(100.00, ge=0, le=100)
    partner_contribution_amount: Optional[Decimal] = Field(None, ge=0)
    
    # Education-specific
    institution_name: Optional[str] = Field(None, max_length=255)
    semester_cost: Optional[Decimal] = Field(None, ge=0)
    
    # Other
    special_needs: Optional[str] = None
    notes: Optional[str] = None
    profile_image_url: Optional[str] = Field(None, max_length=500)
    
    # Initial expense types to create
    expense_types: Optional[List[ExpenseTypeCreate]] = None
    
    @field_validator('support_end_date')
    @classmethod
    def end_must_be_after_start(cls, v, info):
        if v is not None and info.data.get('support_start_date') is not None:
            if v < info.data['support_start_date']:
                raise ValueError('support_end_date must be >= support_start_date')
        return v


class DependentUpdate(BaseModel):
    """Schema for updating a dependent"""
    dependent_name: Optional[str] = Field(None, min_length=1, max_length=255)
    relationship: Optional[Relationship] = None
    dependent_category: Optional[DependentCategory] = None
    
    date_of_birth: Optional[date] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    
    pet_type: Optional[str] = Field(None, max_length=50)
    pet_breed: Optional[str] = Field(None, max_length=100)
    
    monthly_cost_estimate: Optional[Decimal] = Field(None, ge=0)
    
    support_start_date: Optional[date] = None
    support_end_date: Optional[date] = None
    remaining_semesters: Optional[int] = Field(None, ge=0)
    
    shared_responsibility: Optional[bool] = None
    cost_sharing_partners: Optional[List[str]] = None
    your_share_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    partner_contribution_amount: Optional[Decimal] = Field(None, ge=0)
    
    institution_name: Optional[str] = Field(None, max_length=255)
    semester_cost: Optional[Decimal] = Field(None, ge=0)
    
    special_needs: Optional[str] = None
    notes: Optional[str] = None
    profile_image_url: Optional[str] = Field(None, max_length=500)
    
    is_active: Optional[bool] = None


# ============================================
# EXPENSE SCHEMAS
# ============================================

class DependentExpenseCreate(BaseModel):
    """Schema for adding an expense for a dependent"""
    expense_type_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    
    expense_name: str = Field(..., min_length=1, max_length=255)
    amount: Decimal = Field(..., ge=0)
    expense_date: date
    
    # Education tracking
    semester: Optional[str] = Field(None, max_length=50)
    academic_year: Optional[str] = Field(None, max_length=20)
    
    # Payment
    payment_method: Optional[str] = Field(None, max_length=50)
    receipt_url: Optional[str] = Field(None, max_length=500)
    
    # Shared cost
    is_shared: bool = False
    your_share: Optional[Decimal] = Field(None, ge=0)
    partner_share: Optional[Decimal] = Field(None, ge=0)
    
    notes: Optional[str] = None
    
    # Link to main expense system
    create_main_expense: bool = True  # Also create in main expenses


class DependentExpenseResponse(BaseModel):
    """Response for dependent expense"""
    dependent_expense_id: UUID
    dependent_id: UUID
    expense_type_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    
    expense_name: str
    amount: Decimal
    expense_date: date
    
    semester: Optional[str] = None
    academic_year: Optional[str] = None
    
    payment_method: Optional[str] = None
    receipt_url: Optional[str] = None
    
    is_shared: bool
    your_share: Optional[Decimal] = None
    partner_share: Optional[Decimal] = None
    
    main_expense_id: Optional[UUID] = None
    notes: Optional[str] = None
    
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# SHARED COST SCHEMAS
# ============================================

class SharedCostCreate(BaseModel):
    """Create a shared cost agreement"""
    agreement_name: str = Field(..., min_length=1, max_length=255)
    total_cost: Decimal = Field(..., ge=0)
    
    your_contribution: Decimal = Field(..., ge=0)
    
    partner_name: str = Field(..., min_length=1, max_length=255)
    partner_contribution: Decimal = Field(..., ge=0)
    
    due_date: Optional[date] = None
    payment_period: Optional[str] = Field(None, max_length=50)
    
    # Monthly savings plan
    your_monthly_allocation: Optional[Decimal] = Field(None, ge=0)
    months_to_save: Optional[int] = Field(None, ge=1)
    
    notes: Optional[str] = None
    
    @field_validator('your_contribution', 'partner_contribution')
    @classmethod
    def contributions_must_equal_total(cls, v, info):
        # This is validated at service layer since we need both values
        return v


class SharedCostUpdate(BaseModel):
    """Update a shared cost agreement"""
    agreement_name: Optional[str] = Field(None, min_length=1, max_length=255)
    total_cost: Optional[Decimal] = Field(None, ge=0)
    
    your_contribution: Optional[Decimal] = Field(None, ge=0)
    your_contribution_paid: Optional[Decimal] = Field(None, ge=0)
    
    partner_name: Optional[str] = Field(None, min_length=1, max_length=255)
    partner_contribution: Optional[Decimal] = Field(None, ge=0)
    partner_contribution_paid: Optional[Decimal] = Field(None, ge=0)
    
    due_date: Optional[date] = None
    payment_period: Optional[str] = Field(None, max_length=50)
    
    your_monthly_allocation: Optional[Decimal] = Field(None, ge=0)
    months_to_save: Optional[int] = Field(None, ge=1)
    
    status: Optional[str] = None
    notes: Optional[str] = None


class SharedCostPaymentRequest(BaseModel):
    """Record a payment towards shared cost"""
    amount: Decimal = Field(..., ge=0)
    payment_date: date
    payer: str = Field(..., description="'you' or partner name")
    notes: Optional[str] = None


class SharedCostResponse(BaseModel):
    """Response for shared cost"""
    shared_cost_id: UUID
    dependent_id: UUID
    
    agreement_name: str
    total_cost: Decimal
    
    your_contribution: Decimal
    your_contribution_paid: Decimal
    
    partner_name: str
    partner_contribution: Decimal
    partner_contribution_paid: Decimal
    
    due_date: Optional[date] = None
    payment_period: Optional[str] = None
    
    your_monthly_allocation: Optional[Decimal] = None
    months_to_save: Optional[int] = None
    
    status: str
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    # Computed
    your_remaining: float
    total_paid: float
    total_remaining: float
    completion_percentage: float

    class Config:
        from_attributes = True


# ============================================
# RESPONSE SCHEMAS
# ============================================

class DependentResponse(BaseModel):
    """Full dependent response"""
    dependent_id: UUID
    user_id: UUID
    
    dependent_name: str
    relationship: str
    dependent_type: str
    dependent_category: str
    
    date_of_birth: Optional[date] = None
    age: Optional[int] = None
    calculated_age: Optional[int] = None
    
    pet_type: Optional[str] = None
    pet_breed: Optional[str] = None
    
    monthly_cost_estimate: Optional[Decimal] = None
    total_spent_to_date: Decimal
    
    support_start_date: Optional[date] = None
    support_end_date: Optional[date] = None
    remaining_semesters: Optional[int] = None
    
    shared_responsibility: bool
    cost_sharing_partners: Optional[List[str]] = None
    your_share_percentage: Decimal
    partner_contribution_amount: Optional[Decimal] = None
    
    institution_name: Optional[str] = None
    semester_cost: Optional[Decimal] = None
    
    special_needs: Optional[str] = None
    notes: Optional[str] = None
    profile_image_url: Optional[str] = None
    
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Computed
    support_duration_months: Optional[int] = None
    your_monthly_share: Optional[float] = None
    is_time_bound: bool
    total_remaining_cost: Optional[float] = None
    
    # Related data
    expense_types: List[ExpenseTypeResponse] = []
    recent_expenses: List[DependentExpenseResponse] = []
    active_shared_costs: List[SharedCostResponse] = []

    class Config:
        from_attributes = True


class DependentSummary(BaseModel):
    """Lightweight summary for list views"""
    dependent_id: UUID
    dependent_name: str
    relationship: str
    dependent_type: str
    dependent_category: str
    
    monthly_cost_estimate: Optional[Decimal] = None
    your_monthly_share: Optional[float] = None
    
    support_end_date: Optional[date] = None
    support_duration_months: Optional[int] = None
    
    is_time_bound: bool
    shared_responsibility: bool
    
    profile_image_url: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


# ============================================
# ANALYTICS SCHEMAS
# ============================================

class DependentStats(BaseModel):
    """Statistics for all dependents"""
    total_dependents: int
    human_dependents: int
    pet_dependents: int
    
    total_monthly_cost: Decimal
    your_monthly_share: Decimal
    
    total_spent_this_month: Decimal
    total_spent_this_year: Decimal
    
    time_bound_dependents: int
    shared_responsibility_count: int
    
    # By category
    by_category: Dict[str, Decimal]


class DependentMonthlySummaryResponse(BaseModel):
    """Monthly summary for a dependent"""
    dependent_id: UUID
    dependent_name: str
    
    year: int
    month: int
    
    total_expenses: Decimal
    expense_count: int
    expense_breakdown: Dict[str, Decimal]
    
    vs_budget: Optional[Decimal] = None
    vs_last_month: Optional[Decimal] = None

    class Config:
        from_attributes = True


class DependentCostProjection(BaseModel):
    """Project future costs for a dependent"""
    dependent_id: UUID
    dependent_name: str
    
    current_monthly_cost: Decimal
    projected_total_remaining: Decimal
    projected_end_date: Optional[date] = None
    
    # Monthly projections
    monthly_projections: List[Dict[str, Any]]  # [{"month": "2025-02", "amount": 500}]
    
    # For education
    remaining_semesters: Optional[int] = None
    per_semester_cost: Optional[Decimal] = None


# ============================================
# SPECIAL SCHEMAS
# ============================================

class BrotherEducationSetup(BaseModel):
    """Special schema for setting up brother's education support"""
    brother_name: str
    institution_name: str
    
    total_semester_cost: Decimal
    your_contribution: Decimal
    mom_contribution: Decimal
    
    remaining_semesters: int
    next_payment_due: date
    
    monthly_savings_target: Optional[Decimal] = None
    
    notes: Optional[str] = None


class PetSetup(BaseModel):
    """Special schema for setting up pet as dependent"""
    pet_name: str
    pet_type: str
    pet_breed: Optional[str] = None
    
    # Common expense types for pets
    monthly_food_cost: Optional[Decimal] = None
    monthly_litter_cost: Optional[Decimal] = None  # For cats
    rent_addition: Optional[Decimal] = None  # $50 per cat in rent
    estimated_vet_annual: Optional[Decimal] = None
    
    notes: Optional[str] = None