# backend/app/api/v1/income.py
"""
Income API Endpoints
Manage income sources, log payments, track taxes
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import date

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.income_service import IncomeService
from app.schemas.income import (
    IncomeSourceCreate, IncomeSourceUpdate,
    IncomeSourceResponse, IncomeSourceSummary,
    LogIncomeRequest, IncomeHistoryResponse,
    IncomeStats, MonthlyIncomeBreakdown,
    StudentJobSetup, ScholarshipSetup,
    IncomeSourceType, PaymentFrequency
)
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/income", tags=["Income"])


# ============================================
# INCOME SOURCE CRUD
# ============================================

@router.post(
    "/sources",
    response_model=IncomeSourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create income source"
)
async def create_income_source(
    income_data: IncomeSourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new income source.
    
    Supports various pay structures:
    - **hourly**: For hourly jobs (like your IT and Engineering Pathways jobs)
    - **salary**: Annual salary broken into pay periods
    - **fixed**: Fixed amount per period (like your scholarship)
    - **per_session**: Per session/task payment
    """
    service = IncomeService(db)
    
    try:
        income = service.create_income_source(current_user.user_id, income_data)
        return _build_income_response(income)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/sources",
    response_model=List[IncomeSourceSummary],
    summary="Get all income sources"
)
async def get_income_sources(
    is_active: Optional[bool] = Query(True),
    source_type: Optional[IncomeSourceType] = Query(None),
    is_guaranteed: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all income sources for the current user."""
    service = IncomeService(db)
    
    sources = service.get_user_income_sources(
        current_user.user_id,
        is_active=is_active,
        source_type=source_type.value if source_type else None,
        is_guaranteed=is_guaranteed
    )
    
    return [_build_income_summary(s) for s in sources]


@router.get(
    "/stats",
    response_model=IncomeStats,
    summary="Get income statistics"
)
async def get_income_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get income statistics including:
    - Total monthly/annual income (gross and net)
    - Guaranteed vs variable income
    - Breakdown by source and type
    - Average effective tax rate
    """
    service = IncomeService(db)
    return service.get_stats(current_user.user_id)


@router.get(
    "/monthly/{year}/{month}",
    response_model=MonthlyIncomeBreakdown,
    summary="Get monthly income breakdown"
)
async def get_monthly_breakdown(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get actual income received in a specific month."""
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be 1-12")
    
    service = IncomeService(db)
    return service.get_monthly_breakdown(current_user.user_id, year, month)


@router.get(
    "/sources/{income_id}",
    response_model=IncomeSourceResponse,
    summary="Get income source"
)
async def get_income_source(
    income_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about an income source."""
    service = IncomeService(db)
    
    try:
        income = service.get_income_source(income_id, current_user.user_id)
        return _build_income_response(income)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put(
    "/sources/{income_id}",
    response_model=IncomeSourceResponse,
    summary="Update income source"
)
async def update_income_source(
    income_id: UUID,
    income_data: IncomeSourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing income source."""
    service = IncomeService(db)
    
    try:
        income = service.update_income_source(income_id, current_user.user_id, income_data)
        return _build_income_response(income)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete(
    "/sources/{income_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete income source"
)
async def delete_income_source(
    income_id: UUID,
    permanent: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete or deactivate an income source."""
    service = IncomeService(db)
    
    try:
        service.delete_income_source(income_id, current_user.user_id, hard_delete=permanent)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============================================
# INCOME LOGGING
# ============================================

@router.post(
    "/sources/{income_id}/log",
    response_model=IncomeHistoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log income received"
)
async def log_income(
    income_id: UUID,
    log_data: LogIncomeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Log actual income received.
    
    For hourly jobs, provide:
    - hours_worked
    - gross_amount (or let system calculate from hours * rate)
    
    Taxes can be:
    - Calculated automatically based on income source tax rates
    - Provided manually from your paycheck
    """
    service = IncomeService(db)
    
    try:
        history, _ = service.log_income(income_id, current_user.user_id, log_data)
        return history
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/sources/{income_id}/history",
    response_model=List[IncomeHistoryResponse],
    summary="Get payment history"
)
async def get_income_history(
    income_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payment history for an income source."""
    service = IncomeService(db)
    
    try:
        return service.get_income_history(income_id, current_user.user_id, limit)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/history/{history_id}/confirm",
    response_model=IncomeHistoryResponse,
    summary="Confirm or correct income entry"
)
async def confirm_income(
    history_id: UUID,
    actual_net: Optional[float] = Query(None, description="Actual net if different"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Confirm an AI-calculated income entry or correct it.
    
    If the actual net amount differs from calculation, provide it
    and the system will learn for future predictions.
    """
    service = IncomeService(db)
    
    try:
        from decimal import Decimal
        actual = Decimal(str(actual_net)) if actual_net else None
        return service.confirm_income(history_id, current_user.user_id, actual)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============================================
# QUICK SETUP
# ============================================

@router.post(
    "/setup/student-job",
    response_model=IncomeSourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Quick setup: Student job"
)
async def setup_student_job(
    setup_data: StudentJobSetup,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Quick setup for a student job.
    
    Perfect for your IT and Engineering Pathways jobs!
    Just provide hourly rate, expected hours, and basic tax info.
    """
    service = IncomeService(db)
    
    try:
        income = service.setup_student_job(current_user.user_id, setup_data)
        return _build_income_response(income)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/setup/scholarship",
    response_model=IncomeSourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Quick setup: Scholarship"
)
async def setup_scholarship(
    setup_data: ScholarshipSetup,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Quick setup for a scholarship.
    
    For your $7,900 scholarship that covers meals, rent, and utilities!
    """
    service = IncomeService(db)
    
    try:
        income = service.setup_scholarship(current_user.user_id, setup_data)
        return _build_income_response(income)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================
# HELPERS
# ============================================

def _build_income_response(income) -> IncomeSourceResponse:
    """Build full income response"""
    return IncomeSourceResponse(
        income_id=income.income_id,
        user_id=income.user_id,
        source_name=income.source_name,
        source_type=income.source_type,
        employer_name=income.employer_name,
        description=income.description,
        pay_structure=income.pay_structure,
        pay_rate=income.pay_rate,
        pay_unit=income.pay_unit,
        fixed_amount=income.fixed_amount,
        frequency=income.frequency,
        next_payment_date=income.next_payment_date,
        max_hours_per_week=income.max_hours_per_week,
        expected_hours_per_period=income.expected_hours_per_period,
        is_taxable=income.is_taxable,
        tax_rate_federal=income.tax_rate_federal,
        tax_rate_state=income.tax_rate_state,
        tax_rate_local=income.tax_rate_local,
        tax_rate_fica=income.tax_rate_fica,
        tax_withholding_type=income.tax_withholding_type,
        is_guaranteed=income.is_guaranteed,
        reliability_score=income.reliability_score,
        is_active=income.is_active,
        start_date=income.start_date,
        end_date=income.end_date,
        notes=income.notes,
        created_at=income.created_at,
        updated_at=income.updated_at,
        # Computed
        total_tax_rate=income.total_tax_rate,
        estimated_gross_per_period=income.estimated_gross_per_period,
        estimated_net_per_period=income.estimated_net_per_period,
        estimated_monthly_gross=income.estimated_monthly_gross,
        estimated_monthly_net=income.estimated_monthly_net,
        # History
        recent_payments=income.history[:5] if income.history else []
    )


def _build_income_summary(income) -> IncomeSourceSummary:
    """Build lightweight income summary"""
    return IncomeSourceSummary(
        income_id=income.income_id,
        source_name=income.source_name,
        source_type=income.source_type,
        employer_name=income.employer_name,
        pay_structure=income.pay_structure,
        frequency=income.frequency,
        next_payment_date=income.next_payment_date,
        estimated_monthly_net=income.estimated_monthly_net,
        is_guaranteed=income.is_guaranteed,
        is_active=income.is_active
    )