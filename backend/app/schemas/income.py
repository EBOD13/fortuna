# backend/app/schemas/income.py
"""
Income Schemas
Pydantic models for income sources and history API
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

class IncomeSourceType(str, Enum):
    JOB = "job"
    SCHOLARSHIP = "scholarship"
    STIPEND = "stipend"
    FREELANCE = "freelance"
    INVESTMENT = "investment"
    GIFT = "gift"
    OTHER = "other"


class PayStructure(str, Enum):
    HOURLY = "hourly"
    SALARY = "salary"
    FIXED = "fixed"
    PER_SESSION = "per_session"
    COMMISSION = "commission"


class PaymentFrequency(str, Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    SEMESTER = "semester"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"
    ONE_TIME = "one_time"


class TaxWithholdingType(str, Enum):
    W2 = "w2"
    W1099 = "1099"
    NONE = "none"


# ============================================
# CREATE/UPDATE SCHEMAS
# ============================================

class IncomeSourceCreate(BaseModel):
    """Create a new income source"""
    source_name: str = Field(..., min_length=1, max_length=255)
    source_type: IncomeSourceType
    employer_name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    
    # Pay structure
    pay_structure: PayStructure
    pay_rate: Optional[Decimal] = Field(None, ge=0)
    pay_unit: Optional[str] = Field(None, max_length=20)
    fixed_amount: Optional[Decimal] = Field(None, ge=0)
    
    # Frequency
    frequency: PaymentFrequency
    next_payment_date: Optional[date] = None
    
    # Work constraints
    max_hours_per_week: Optional[int] = Field(None, ge=1, le=168)
    expected_hours_per_period: Optional[Decimal] = Field(None, ge=0)
    
    # Tax
    is_taxable: bool = True
    tax_rate_federal: Optional[Decimal] = Field(None, ge=0, le=100)
    tax_rate_state: Optional[Decimal] = Field(None, ge=0, le=100)
    tax_rate_local: Optional[Decimal] = Field(None, ge=0, le=100)
    tax_rate_fica: Optional[Decimal] = Field(7.65, ge=0, le=100)
    tax_withholding_type: TaxWithholdingType = TaxWithholdingType.W2
    
    # Reliability
    is_guaranteed: bool = True
    reliability_score: Decimal = Field(1.0, ge=0, le=1)
    
    # Dates
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
    notes: Optional[str] = None
    
    @field_validator('pay_rate', 'fixed_amount')
    @classmethod
    def validate_pay_info(cls, v, info):
        # At least one of pay_rate or fixed_amount should be provided
        return v


class IncomeSourceUpdate(BaseModel):
    """Update an income source"""
    source_name: Optional[str] = Field(None, min_length=1, max_length=255)
    source_type: Optional[IncomeSourceType] = None
    employer_name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    
    pay_structure: Optional[PayStructure] = None
    pay_rate: Optional[Decimal] = Field(None, ge=0)
    pay_unit: Optional[str] = Field(None, max_length=20)
    fixed_amount: Optional[Decimal] = Field(None, ge=0)
    
    frequency: Optional[PaymentFrequency] = None
    next_payment_date: Optional[date] = None
    
    max_hours_per_week: Optional[int] = Field(None, ge=1, le=168)
    expected_hours_per_period: Optional[Decimal] = Field(None, ge=0)
    
    is_taxable: Optional[bool] = None
    tax_rate_federal: Optional[Decimal] = Field(None, ge=0, le=100)
    tax_rate_state: Optional[Decimal] = Field(None, ge=0, le=100)
    tax_rate_local: Optional[Decimal] = Field(None, ge=0, le=100)
    tax_rate_fica: Optional[Decimal] = Field(None, ge=0, le=100)
    tax_withholding_type: Optional[TaxWithholdingType] = None
    
    is_guaranteed: Optional[bool] = None
    reliability_score: Optional[Decimal] = Field(None, ge=0, le=1)
    
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
    notes: Optional[str] = None
    is_active: Optional[bool] = None


# ============================================
# INCOME LOGGING SCHEMAS
# ============================================

class LogIncomeRequest(BaseModel):
    """Log actual income received"""
    # Work done (for hourly/session)
    hours_worked: Optional[Decimal] = Field(None, ge=0)
    days_worked: Optional[Decimal] = Field(None, ge=0)
    sessions_worked: Optional[int] = Field(None, ge=0)
    
    # Amounts
    gross_amount: Decimal = Field(..., ge=0)
    
    # Tax deductions (optional - can be calculated)
    tax_federal: Optional[Decimal] = Field(None, ge=0)
    tax_state: Optional[Decimal] = Field(None, ge=0)
    tax_local: Optional[Decimal] = Field(None, ge=0)
    tax_fica: Optional[Decimal] = Field(None, ge=0)
    other_deductions: Optional[Decimal] = Field(None, ge=0)
    
    net_amount: Optional[Decimal] = Field(None, ge=0)  # Can be calculated
    
    # Payment details
    payment_date: date
    payment_period_start: Optional[date] = None
    payment_period_end: Optional[date] = None
    payment_method: Optional[str] = Field(None, max_length=50)
    
    notes: Optional[str] = None
    
    # Options
    calculate_taxes: bool = True  # Should we calculate taxes if not provided?
    update_next_payment: bool = True


class IncomeHistoryResponse(BaseModel):
    """Response for income history entry"""
    history_id: UUID
    income_id: UUID
    
    hours_worked: Optional[Decimal] = None
    days_worked: Optional[Decimal] = None
    sessions_worked: Optional[int] = None
    
    gross_amount: Decimal
    tax_federal: Decimal
    tax_state: Decimal
    tax_local: Decimal
    tax_fica: Decimal
    other_deductions: Decimal
    total_deductions: Decimal
    net_amount: Decimal
    
    expected_gross: Optional[Decimal] = None
    variance: Optional[Decimal] = None
    
    payment_date: date
    payment_period_start: Optional[date] = None
    payment_period_end: Optional[date] = None
    payment_method: Optional[str] = None
    
    ai_calculated: bool
    user_confirmed: bool
    user_corrected: bool
    
    effective_tax_rate: float
    
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# RESPONSE SCHEMAS
# ============================================

class IncomeSourceResponse(BaseModel):
    """Full income source response"""
    income_id: UUID
    user_id: UUID
    
    source_name: str
    source_type: str
    employer_name: Optional[str] = None
    description: Optional[str] = None
    
    pay_structure: str
    pay_rate: Optional[Decimal] = None
    pay_unit: Optional[str] = None
    fixed_amount: Optional[Decimal] = None
    
    frequency: str
    next_payment_date: Optional[date] = None
    
    max_hours_per_week: Optional[int] = None
    expected_hours_per_period: Optional[Decimal] = None
    
    is_taxable: bool
    tax_rate_federal: Optional[Decimal] = None
    tax_rate_state: Optional[Decimal] = None
    tax_rate_local: Optional[Decimal] = None
    tax_rate_fica: Optional[Decimal] = None
    tax_withholding_type: str
    
    is_guaranteed: bool
    reliability_score: Decimal
    
    is_active: bool
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
    notes: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    # Computed
    total_tax_rate: float
    estimated_gross_per_period: float
    estimated_net_per_period: float
    estimated_monthly_gross: float
    estimated_monthly_net: float
    
    # Recent history
    recent_payments: List[IncomeHistoryResponse] = []

    class Config:
        from_attributes = True


class IncomeSourceSummary(BaseModel):
    """Lightweight income source for lists"""
    income_id: UUID
    source_name: str
    source_type: str
    employer_name: Optional[str] = None
    
    pay_structure: str
    frequency: str
    next_payment_date: Optional[date] = None
    
    estimated_monthly_net: float
    is_guaranteed: bool
    is_active: bool

    class Config:
        from_attributes = True


# ============================================
# STATISTICS
# ============================================

class IncomeStats(BaseModel):
    """Income statistics"""
    total_monthly_gross: Decimal
    total_monthly_net: Decimal
    total_annual_gross: Decimal
    total_annual_net: Decimal
    
    guaranteed_monthly: Decimal
    variable_monthly: Decimal
    
    active_sources_count: int
    
    average_effective_tax_rate: float
    
    by_type: dict  # {"job": 2000, "scholarship": 7900}
    by_source: dict  # {"IT Job": 1000, "Engineering Pathways": 500}


class MonthlyIncomeBreakdown(BaseModel):
    """Monthly income breakdown"""
    year: int
    month: int
    
    total_gross: Decimal
    total_net: Decimal
    total_taxes: Decimal
    
    by_source: dict
    
    vs_last_month: Optional[Decimal] = None
    vs_expected: Optional[Decimal] = None


# ============================================
# SPECIALIZED SCHEMAS
# ============================================

class StudentJobSetup(BaseModel):
    """Quick setup for a student job"""
    job_name: str
    employer_name: str
    hourly_rate: Decimal
    max_hours_per_week: int = 20
    expected_hours_per_week: Decimal
    frequency: PaymentFrequency = PaymentFrequency.BIWEEKLY
    start_date: Optional[date] = None
    
    # Simple tax setup
    federal_tax_rate: Decimal = Field(12.0, description="Federal tax bracket %")
    state_tax_rate: Decimal = Field(5.0, description="State tax %")


class ScholarshipSetup(BaseModel):
    """Quick setup for a scholarship"""
    scholarship_name: str
    institution_name: str
    semester_amount: Decimal
    covers: List[str] = ["meals", "rent", "utilities"]  # What it covers
    start_date: Optional[date] = None
    semesters_remaining: int = 1