# backend/app/api/v1/dependents.py
"""
Dependents API Endpoints
CRUD operations for managing financial dependents (humans, pets, shared costs)
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import date

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.dependent_service import DependentService
from app.schemas.dependent import (
    DependentCreate, DependentUpdate,
    DependentResponse, DependentSummary,
    ExpenseTypeCreate, ExpenseTypeResponse,
    DependentExpenseCreate, DependentExpenseResponse,
    SharedCostCreate, SharedCostUpdate, SharedCostResponse,
    SharedCostPaymentRequest,
    DependentStats, DependentCostProjection,
    DependentMonthlySummaryResponse,
    BrotherEducationSetup, PetSetup,
    DependentType, DependentCategory
)
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/dependents", tags=["Dependents"])


# ============================================
# DEPENDENT CRUD ENDPOINTS
# ============================================

@router.post(
    "/",
    response_model=DependentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new dependent"
)
async def create_dependent(
    dependent_data: DependentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new financial dependent.
    
    Types include:
    - **human**: Family members (brother, parent, child, spouse)
    - **pet**: Pets (cats, dogs, etc.)
    - **other**: Other dependents
    
    For shared costs (like brother's education):
    - Set `shared_responsibility` to True
    - Add `cost_sharing_partners` (e.g., ["Mom"])
    - Set `your_share_percentage` (e.g., 50%)
    """
    service = DependentService(db)
    
    try:
        dependent = service.create_dependent(current_user.user_id, dependent_data)
        return _build_dependent_response(dependent)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/",
    response_model=List[DependentSummary],
    summary="Get all dependents"
)
async def get_dependents(
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    dependent_type: Optional[DependentType] = Query(None, description="Filter by type"),
    dependent_category: Optional[DependentCategory] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all dependents for the current user."""
    service = DependentService(db)
    
    dependents = service.get_user_dependents(
        user_id=current_user.user_id,
        is_active=is_active,
        dependent_type=dependent_type.value if dependent_type else None,
        dependent_category=dependent_category.value if dependent_category else None
    )
    
    return [_build_dependent_summary(d) for d in dependents]


@router.get(
    "/stats",
    response_model=DependentStats,
    summary="Get dependent statistics"
)
async def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics for all dependents including:
    - Total count by type
    - Total monthly costs
    - Your share of costs
    - Spending summaries
    """
    service = DependentService(db)
    return service.get_stats(current_user.user_id)


@router.get(
    "/{dependent_id}",
    response_model=DependentResponse,
    summary="Get a specific dependent"
)
async def get_dependent(
    dependent_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific dependent."""
    service = DependentService(db)
    
    try:
        dependent = service.get_dependent(dependent_id, current_user.user_id)
        return _build_dependent_response(dependent)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put(
    "/{dependent_id}",
    response_model=DependentResponse,
    summary="Update a dependent"
)
async def update_dependent(
    dependent_id: UUID,
    dependent_data: DependentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing dependent."""
    service = DependentService(db)
    
    try:
        dependent = service.update_dependent(dependent_id, current_user.user_id, dependent_data)
        return _build_dependent_response(dependent)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete(
    "/{dependent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a dependent"
)
async def delete_dependent(
    dependent_id: UUID,
    permanent: bool = Query(False, description="Permanently delete"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete or deactivate a dependent."""
    service = DependentService(db)
    
    try:
        service.delete_dependent(dependent_id, current_user.user_id, hard_delete=permanent)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============================================
# EXPENSE TYPE ENDPOINTS
# ============================================

@router.post(
    "/{dependent_id}/expense-types",
    response_model=ExpenseTypeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an expense type"
)
async def add_expense_type(
    dependent_id: UUID,
    expense_type_data: ExpenseTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add an expense type for a dependent.
    
    Examples:
    - For brother: "Tuition", "Books", "Living Expenses"
    - For cat: "Food", "Litter", "Rent Addition", "Vet"
    """
    service = DependentService(db)
    
    try:
        expense_type = service.add_expense_type(dependent_id, current_user.user_id, expense_type_data)
        return expense_type
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "/{dependent_id}/expense-types",
    response_model=List[ExpenseTypeResponse],
    summary="Get expense types for a dependent"
)
async def get_expense_types(
    dependent_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all expense types for a dependent."""
    service = DependentService(db)
    
    try:
        return service.get_expense_types(dependent_id, current_user.user_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============================================
# EXPENSE TRACKING ENDPOINTS
# ============================================

@router.post(
    "/{dependent_id}/expenses",
    response_model=DependentExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an expense for a dependent"
)
async def add_expense(
    dependent_id: UUID,
    expense_data: DependentExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Record an expense for a dependent.
    
    For education expenses, include:
    - `semester` (e.g., "Fall 2024")
    - `academic_year` (e.g., "2024-2025")
    
    For shared expenses, the system will automatically calculate
    your share based on the dependent's share percentage.
    """
    service = DependentService(db)
    
    try:
        expense = service.add_expense(dependent_id, current_user.user_id, expense_data)
        return expense
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/{dependent_id}/expenses",
    response_model=List[DependentExpenseResponse],
    summary="Get expenses for a dependent"
)
async def get_expenses(
    dependent_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    expense_type_id: Optional[UUID] = Query(None, description="Filter by expense type"),
    start_date: Optional[date] = Query(None, description="Filter from date"),
    end_date: Optional[date] = Query(None, description="Filter to date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get expense history for a dependent."""
    service = DependentService(db)
    
    try:
        return service.get_expenses(
            dependent_id,
            current_user.user_id,
            limit=limit,
            expense_type_id=expense_type_id,
            start_date=start_date,
            end_date=end_date
        )
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============================================
# SHARED COST ENDPOINTS
# ============================================

@router.post(
    "/{dependent_id}/shared-costs",
    response_model=SharedCostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a shared cost agreement"
)
async def create_shared_cost(
    dependent_id: UUID,
    shared_cost_data: SharedCostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a shared cost agreement for a dependent.
    
    Example: Brother's tuition
    - total_cost: $12,000
    - your_contribution: $6,000
    - partner_name: "Mom"
    - partner_contribution: $6,000
    - due_date: 2025-01-15
    - your_monthly_allocation: $1,000 (if saving monthly)
    """
    service = DependentService(db)
    
    try:
        shared_cost = service.create_shared_cost(dependent_id, current_user.user_id, shared_cost_data)
        return _build_shared_cost_response(shared_cost)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/{dependent_id}/shared-costs",
    response_model=List[SharedCostResponse],
    summary="Get shared costs for a dependent"
)
async def get_shared_costs(
    dependent_id: UUID,
    status: Optional[str] = Query(None, description="Filter by status: pending, in_progress, completed"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all shared cost agreements for a dependent."""
    service = DependentService(db)
    
    try:
        shared_costs = service.get_shared_costs(dependent_id, current_user.user_id, status)
        return [_build_shared_cost_response(sc) for sc in shared_costs]
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/shared-costs/{shared_cost_id}/payments",
    response_model=SharedCostResponse,
    summary="Record a payment towards shared cost"
)
async def record_shared_cost_payment(
    shared_cost_id: UUID,
    payment_data: SharedCostPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Record a payment towards a shared cost agreement.
    
    - Set `payer` to "you" for your payments
    - Set `payer` to the partner's name for their payments
    """
    service = DependentService(db)
    
    try:
        shared_cost = service.record_shared_cost_payment(shared_cost_id, current_user.user_id, payment_data)
        return _build_shared_cost_response(shared_cost)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================
# ANALYTICS ENDPOINTS
# ============================================

@router.get(
    "/{dependent_id}/projection",
    response_model=DependentCostProjection,
    summary="Get cost projection for a dependent"
)
async def get_cost_projection(
    dependent_id: UUID,
    months_ahead: int = Query(12, ge=1, le=60, description="Months to project"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get projected future costs for a dependent.
    
    For time-bound dependents (like brother's education), 
    projections will stop at the support end date.
    """
    service = DependentService(db)
    
    try:
        return service.get_cost_projection(dependent_id, current_user.user_id, months_ahead)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "/{dependent_id}/monthly-summary/{year}/{month}",
    response_model=DependentMonthlySummaryResponse,
    summary="Get monthly summary for a dependent"
)
async def get_monthly_summary(
    dependent_id: UUID,
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get or generate monthly expense summary for a dependent."""
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    
    service = DependentService(db)
    
    try:
        summary = service.get_monthly_summary(dependent_id, current_user.user_id, year, month)
        return DependentMonthlySummaryResponse(
            dependent_id=summary.dependent_id,
            dependent_name=service.get_dependent(dependent_id, current_user.user_id).dependent_name,
            year=summary.year,
            month=summary.month,
            total_expenses=summary.total_expenses,
            expense_count=summary.expense_count,
            expense_breakdown=summary.expense_breakdown or {},
            vs_budget=summary.vs_budget,
            vs_last_month=summary.vs_last_month
        )
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============================================
# QUICK SETUP ENDPOINTS
# ============================================

@router.post(
    "/setup/brother-education",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Quick setup: Brother's education"
)
async def setup_brother_education(
    setup_data: BrotherEducationSetup,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Convenience endpoint to set up your brother's education support.
    
    Creates:
    - Dependent with education expense types
    - Shared cost agreement with your mom
    - Monthly savings allocation
    """
    service = DependentService(db)
    
    try:
        result = service.setup_brother_education(current_user.user_id, setup_data)
        return {
            "message": "Brother's education support set up successfully!",
            "dependent_id": str(result["dependent"].dependent_id),
            "shared_cost_id": str(result["shared_cost"].shared_cost_id),
            "monthly_savings_needed": float(result["monthly_savings_needed"]),
            "remaining_semesters": result["remaining_semesters"]
        }
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/setup/pet",
    response_model=DependentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Quick setup: Pet"
)
async def setup_pet(
    setup_data: PetSetup,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Convenience endpoint to set up a pet as a dependent.
    
    Creates:
    - Dependent with common pet expense types
    - Automatic monthly cost estimate
    """
    service = DependentService(db)
    
    try:
        dependent = service.setup_pet(current_user.user_id, setup_data)
        return _build_dependent_response(dependent)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================
# HELPER FUNCTIONS
# ============================================

def _build_dependent_response(dependent) -> DependentResponse:
    """Build full dependent response with computed properties"""
    return DependentResponse(
        dependent_id=dependent.dependent_id,
        user_id=dependent.user_id,
        dependent_name=dependent.dependent_name,
        relationship=dependent.relationship,
        dependent_type=dependent.dependent_type,
        dependent_category=dependent.dependent_category,
        date_of_birth=dependent.date_of_birth,
        age=dependent.age,
        calculated_age=dependent.calculated_age,
        pet_type=dependent.pet_type,
        pet_breed=dependent.pet_breed,
        monthly_cost_estimate=dependent.monthly_cost_estimate,
        total_spent_to_date=dependent.total_spent_to_date or 0,
        support_start_date=dependent.support_start_date,
        support_end_date=dependent.support_end_date,
        remaining_semesters=dependent.remaining_semesters,
        shared_responsibility=dependent.shared_responsibility,
        cost_sharing_partners=dependent.cost_sharing_partners,
        your_share_percentage=dependent.your_share_percentage,
        partner_contribution_amount=dependent.partner_contribution_amount,
        institution_name=dependent.institution_name,
        semester_cost=dependent.semester_cost,
        special_needs=dependent.special_needs,
        notes=dependent.notes,
        profile_image_url=dependent.profile_image_url,
        is_active=dependent.is_active,
        created_at=dependent.created_at,
        updated_at=dependent.updated_at,
        # Computed
        support_duration_months=dependent.support_duration_months,
        your_monthly_share=dependent.your_monthly_share,
        is_time_bound=dependent.is_time_bound,
        total_remaining_cost=dependent.total_remaining_cost,
        # Related
        expense_types=dependent.expense_types if dependent.expense_types else [],
        recent_expenses=dependent.expenses[:5] if dependent.expenses else [],
        active_shared_costs=[
            _build_shared_cost_response(sc) 
            for sc in dependent.shared_costs 
            if sc.status != 'completed'
        ] if dependent.shared_costs else []
    )


def _build_dependent_summary(dependent) -> DependentSummary:
    """Build lightweight dependent summary"""
    return DependentSummary(
        dependent_id=dependent.dependent_id,
        dependent_name=dependent.dependent_name,
        relationship=dependent.relationship,
        dependent_type=dependent.dependent_type,
        dependent_category=dependent.dependent_category,
        monthly_cost_estimate=dependent.monthly_cost_estimate,
        your_monthly_share=dependent.your_monthly_share,
        support_end_date=dependent.support_end_date,
        support_duration_months=dependent.support_duration_months,
        is_time_bound=dependent.is_time_bound,
        shared_responsibility=dependent.shared_responsibility,
        profile_image_url=dependent.profile_image_url,
        is_active=dependent.is_active
    )


def _build_shared_cost_response(shared_cost) -> SharedCostResponse:
    """Build shared cost response with computed properties"""
    return SharedCostResponse(
        shared_cost_id=shared_cost.shared_cost_id,
        dependent_id=shared_cost.dependent_id,
        agreement_name=shared_cost.agreement_name,
        total_cost=shared_cost.total_cost,
        your_contribution=shared_cost.your_contribution,
        your_contribution_paid=shared_cost.your_contribution_paid or 0,
        partner_name=shared_cost.partner_name,
        partner_contribution=shared_cost.partner_contribution,
        partner_contribution_paid=shared_cost.partner_contribution_paid or 0,
        due_date=shared_cost.due_date,
        payment_period=shared_cost.payment_period,
        your_monthly_allocation=shared_cost.your_monthly_allocation,
        months_to_save=shared_cost.months_to_save,
        status=shared_cost.status,
        completed_at=shared_cost.completed_at,
        notes=shared_cost.notes,
        created_at=shared_cost.created_at,
        updated_at=shared_cost.updated_at,
        # Computed
        your_remaining=shared_cost.your_remaining,
        total_paid=shared_cost.total_paid,
        total_remaining=shared_cost.total_remaining,
        completion_percentage=shared_cost.completion_percentage
    )