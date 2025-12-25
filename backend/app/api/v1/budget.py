# backend/app/api/v1/budget.py
"""
Budget API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.budget_service import BudgetService
from app.schemas.budget import (
    BudgetCreate, BudgetUpdate, BudgetResponse, BudgetWithCategories,
    CategoryBudgetCreate, CategoryBudgetUpdate, CategoryBudgetResponse,
    BudgetTemplateCreate, BudgetTemplateResponse,
    BudgetHistoryResponse, BudgetStats,
    QuickBudgetCreate, ApplyTemplateRequest
)
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter()


# ============================================
# BUDGET CRUD
# ============================================

@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new budget"""
    service = BudgetService(db)
    try:
        budget = service.create_budget(current_user.user_id, data)
        return budget
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[BudgetResponse])
def get_budgets(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    budget_type: Optional[str] = Query(None, description="Filter by type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all budgets for current user"""
    service = BudgetService(db)
    return service.get_budgets(
        current_user.user_id,
        status=status_filter,
        budget_type=budget_type
    )


@router.get("/active", response_model=BudgetWithCategories)
def get_active_budget(
    budget_type: str = Query("monthly", description="Budget type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the currently active budget"""
    service = BudgetService(db)
    budget = service.get_active_budget(current_user.user_id, budget_type)
    
    if not budget:
        raise HTTPException(status_code=404, detail="No active budget found")
    
    return budget


@router.get("/stats", response_model=BudgetStats)
def get_budget_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get budget statistics"""
    service = BudgetService(db)
    return service.get_budget_stats(current_user.user_id)


@router.get("/{budget_id}", response_model=BudgetWithCategories)
def get_budget(
    budget_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific budget with category breakdowns"""
    service = BudgetService(db)
    try:
        return service.get_budget(current_user.user_id, budget_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Budget not found")


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: UUID,
    data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a budget"""
    service = BudgetService(db)
    try:
        return service.update_budget(current_user.user_id, budget_id, data)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Budget not found")


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a budget"""
    service = BudgetService(db)
    try:
        service.delete_budget(current_user.user_id, budget_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Budget not found")


@router.post("/{budget_id}/refresh", response_model=BudgetResponse)
def refresh_budget_spending(
    budget_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recalculate budget spending from expenses"""
    service = BudgetService(db)
    try:
        return service.update_spending(current_user.user_id, budget_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Budget not found")


# ============================================
# CATEGORY BUDGETS
# ============================================

@router.post("/{budget_id}/categories", response_model=CategoryBudgetResponse, status_code=status.HTTP_201_CREATED)
def add_category_budget(
    budget_id: UUID,
    data: CategoryBudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a category allocation to a budget"""
    service = BudgetService(db)
    try:
        return service.add_category_budget(current_user.user_id, budget_id, data)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Budget not found")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{budget_id}/categories", response_model=List[CategoryBudgetResponse])
def get_category_budgets(
    budget_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all category budgets for a budget"""
    service = BudgetService(db)
    try:
        return service.get_category_budgets(current_user.user_id, budget_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Budget not found")


@router.put("/categories/{category_budget_id}", response_model=CategoryBudgetResponse)
def update_category_budget(
    category_budget_id: UUID,
    data: CategoryBudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a category budget allocation"""
    service = BudgetService(db)
    try:
        return service.update_category_budget(current_user.user_id, category_budget_id, data)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Category budget not found")


# ============================================
# BUDGET HISTORY
# ============================================

@router.get("/{budget_id}/history", response_model=List[BudgetHistoryResponse])
def get_budget_history(
    budget_id: UUID,
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get budget history for charting"""
    service = BudgetService(db)
    try:
        return service.get_budget_history(current_user.user_id, budget_id, days)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Budget not found")


# ============================================
# QUICK BUDGET & TEMPLATES
# ============================================

@router.post("/quick", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_quick_budget(
    data: QuickBudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a budget quickly from income amount.
    Uses 50/30/20 rule if selected.
    """
    service = BudgetService(db)
    try:
        return service.create_quick_budget(current_user.user_id, data)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/templates", response_model=BudgetTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    data: BudgetTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a reusable budget template"""
    service = BudgetService(db)
    return service.create_template(current_user.user_id, data)


@router.get("/templates", response_model=List[BudgetTemplateResponse])
def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all budget templates"""
    from app.models.budget import BudgetTemplate
    
    return db.query(BudgetTemplate).filter(
        BudgetTemplate.user_id == current_user.user_id
    ).order_by(BudgetTemplate.is_default.desc()).all()


@router.post("/templates/apply", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def apply_template(
    data: ApplyTemplateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new budget from a template"""
    service = BudgetService(db)
    try:
        return service.apply_template(current_user.user_id, data)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Template not found")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))