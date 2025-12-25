# backend/app/api/v1/goals.py
"""
Financial Goals API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import date, datetime

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.goal import FinancialGoal, GoalMilestone, GoalProgressHistory
from app.schemas.goal import (
    FinancialGoalCreate, FinancialGoalUpdate, FinancialGoalResponse, FinancialGoalWithDetails,
    GoalMilestoneCreate, GoalMilestoneResponse,
    GoalProgressCreate, GoalProgressResponse
)

router = APIRouter()

# ============================================
# GOAL CRUD
# ============================================

@router.post("/", response_model=FinancialGoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_data: FinancialGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new financial goal"""
    
    db_goal = FinancialGoal(
        **goal_data.dict(),
        user_id=current_user.user_id
    )
    
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    
    # Calculate progress percentage
    response = FinancialGoalResponse.from_orm(db_goal)
    if db_goal.target_amount > 0:
        response.progress_percentage = float((db_goal.current_amount / db_goal.target_amount) * 100)
    
    # Calculate days remaining
    if db_goal.deadline_date:
        days_remaining = (db_goal.deadline_date - date.today()).days
        response.days_remaining = days_remaining
        
        # Calculate required monthly savings
        if days_remaining > 0:
            months_remaining = days_remaining / 30
            remaining_amount = float(db_goal.target_amount - db_goal.current_amount)
            response.required_monthly_savings = remaining_amount / months_remaining if months_remaining > 0 else remaining_amount
    
    return response

@router.get("/", response_model=List[FinancialGoalResponse])
def get_goals(
    status_filter: str = "active",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all goals for current user"""
    
    query = db.query(FinancialGoal).filter(FinancialGoal.user_id == current_user.user_id)
    
    if status_filter != "all":
        query = query.filter(FinancialGoal.status == status_filter)
    
    goals = query.order_by(FinancialGoal.priority_level).all()
    
    # Add calculated fields
    result = []
    for goal in goals:
        goal_response = FinancialGoalResponse.from_orm(goal)
        
        # Progress percentage
        if goal.target_amount > 0:
            goal_response.progress_percentage = float((goal.current_amount / goal.target_amount) * 100)
        
        # Days remaining and required savings
        if goal.deadline_date:
            days_remaining = (goal.deadline_date - date.today()).days
            goal_response.days_remaining = days_remaining
            
            if days_remaining > 0:
                months_remaining = days_remaining / 30
                remaining_amount = float(goal.target_amount - goal.current_amount)
                goal_response.required_monthly_savings = remaining_amount / months_remaining if months_remaining > 0 else remaining_amount
        
        result.append(goal_response)
    
    return result

@router.get("/{goal_id}", response_model=FinancialGoalWithDetails)
def get_goal(
    goal_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific goal with milestones and progress history"""
    
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.goal_id == goal_id,
        FinancialGoal.user_id == current_user.user_id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    # Get milestones and progress
    milestones = db.query(GoalMilestone).filter(GoalMilestone.goal_id == goal_id).all()
    recent_progress = db.query(GoalProgressHistory).filter(
        GoalProgressHistory.goal_id == goal_id
    ).order_by(GoalProgressHistory.contribution_date.desc()).limit(10).all()
    
    # Build response
    goal_response = FinancialGoalWithDetails.from_orm(goal)
    
    # Calculated fields
    if goal.target_amount > 0:
        goal_response.progress_percentage = float((goal.current_amount / goal.target_amount) * 100)
    
    if goal.deadline_date:
        days_remaining = (goal.deadline_date - date.today()).days
        goal_response.days_remaining = days_remaining
        
        if days_remaining > 0:
            months_remaining = days_remaining / 30
            remaining_amount = float(goal.target_amount - goal.current_amount)
            goal_response.required_monthly_savings = remaining_amount / months_remaining if months_remaining > 0 else remaining_amount
    
    goal_response.milestones = [GoalMilestoneResponse.from_orm(m) for m in milestones]
    goal_response.recent_progress = [GoalProgressResponse.from_orm(p) for p in recent_progress]
    
    return goal_response

@router.put("/{goal_id}", response_model=FinancialGoalResponse)
def update_goal(
    goal_id: UUID,
    goal_data: FinancialGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a goal"""
    
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.goal_id == goal_id,
        FinancialGoal.user_id == current_user.user_id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    # Update fields
    for field, value in goal_data.dict(exclude_unset=True).items():
        setattr(goal, field, value)
    
    # If status changed to completed, set completed_at
    if goal_data.status == "completed" and not goal.completed_at:
        goal.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(goal)
    
    return FinancialGoalResponse.from_orm(goal)

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a goal"""
    
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.goal_id == goal_id,
        FinancialGoal.user_id == current_user.user_id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    db.delete(goal)
    db.commit()
    
    return None

# ============================================
# GOAL PROGRESS
# ============================================

@router.post("/{goal_id}/progress", response_model=GoalProgressResponse, status_code=status.HTTP_201_CREATED)
def add_progress(
    goal_id: UUID,
    progress_data: GoalProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add progress to a goal (contribute money)"""
    
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.goal_id == goal_id,
        FinancialGoal.user_id == current_user.user_id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    # Update goal amount
    goal.current_amount += progress_data.amount_added
    new_total = goal.current_amount
    
    # Calculate progress percentage
    progress_percentage = (new_total / goal.target_amount) * 100 if goal.target_amount > 0 else 0
    
    # Create progress record
    db_progress = GoalProgressHistory(
        goal_id=goal_id,
        amount_added=progress_data.amount_added,
        new_total=new_total,
        progress_percentage=progress_percentage,
        contribution_date=progress_data.contribution_date,
        source=progress_data.source,
        notes=progress_data.notes
    )
    
    db.add(db_progress)
    
    # Check if goal is completed
    if goal.current_amount >= goal.target_amount and goal.status == 'active':
        goal.status = 'completed'
        goal.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_progress)
    
    return db_progress

# ============================================
# MILESTONES
# ============================================

@router.post("/{goal_id}/milestones", response_model=GoalMilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_milestone(
    goal_id: UUID,
    milestone_data: GoalMilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a milestone for a goal"""
    
    # Verify goal exists and belongs to user
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.goal_id == goal_id,
        FinancialGoal.user_id == current_user.user_id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    db_milestone = GoalMilestone(
        **milestone_data.dict(),
        goal_id=goal_id
    )
    
    db.add(db_milestone)
    db.commit()
    db.refresh(db_milestone)
    
    return db_milestone