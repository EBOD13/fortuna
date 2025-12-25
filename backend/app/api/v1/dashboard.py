# backend/app/api/v1/dashboard.py
"""
Dashboard API Endpoints
Main endpoint for mobile app home screen
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get complete dashboard data.
    
    This is the main endpoint for the mobile app home screen.
    Returns all data needed to render the dashboard in one call.
    
    Includes:
    - Quick stats (spending, income, net)
    - Budget summary
    - Today's spending
    - Goals overview
    - Upcoming bills
    - Recent transactions
    - Streaks
    - Notifications
    - Quick insights
    - Check-in status
    """
    service = DashboardService(db)
    return service.get_dashboard(current_user.user_id)


@router.get("/quick-stats")
def get_quick_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get just the quick stats for header"""
    service = DashboardService(db)
    return service._get_quick_stats(current_user.user_id, date.today())


@router.get("/today")
def get_today_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's spending summary"""
    service = DashboardService(db)
    return service._get_today_spending(current_user.user_id, date.today())


@router.get("/weekly-summary")
def get_weekly_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get weekly summary for review"""
    service = DashboardService(db)
    return service.get_weekly_summary(current_user.user_id)


@router.get("/goals-overview")
def get_goals_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get goals overview for dashboard"""
    service = DashboardService(db)
    return service._get_goals_overview(current_user.user_id)


@router.get("/upcoming-bills")
def get_upcoming_bills(
    days: int = Query(7, ge=1, le=30, description="Days ahead to check"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get upcoming bills"""
    from datetime import timedelta
    service = DashboardService(db)
    
    today = date.today()
    # Modify the service method call - this is a simplified version
    return service._get_upcoming_bills(current_user.user_id, today)


@router.get("/recent-transactions")
def get_recent_transactions(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent transactions"""
    service = DashboardService(db)
    return service._get_recent_transactions(current_user.user_id)


@router.get("/checkin-status")
def get_checkin_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's check-in status"""
    service = DashboardService(db)
    return service._get_checkin_status(current_user.user_id, date.today())


@router.get("/streaks")
def get_streaks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's active streaks"""
    service = DashboardService(db)
    return service._get_streaks(current_user.user_id)