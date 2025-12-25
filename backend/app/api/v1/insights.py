# backend/app/api/v1/insights.py
"""
AI Insights API Endpoints
Expose AI predictions and analysis
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import date

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.ai_service import AIService

router = APIRouter()


# ============================================
# DASHBOARD
# ============================================

@router.get(
    "/dashboard",
    summary="Get all AI insights for dashboard"
)
async def get_dashboard_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive AI insights for the user dashboard.
    
    Includes:
    - Spending predictions for next week
    - Goal achievement scores
    - Anomaly detection results
    - Emotional spending analysis
    - Alerts and recommendations
    """
    ai_service = AIService(db)
    return ai_service.get_dashboard_insights(current_user.user_id)


# ============================================
# SPENDING PREDICTIONS
# ============================================

@router.get(
    "/spending/predict",
    summary="Predict future spending"
)
async def predict_spending(
    days: int = Query(7, ge=1, le=30, description="Days to predict"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Predict spending for the specified number of days.
    
    Uses machine learning to analyze your spending patterns
    and predict future daily spending amounts.
    """
    ai_service = AIService(db)
    return ai_service.predict_spending(current_user.user_id, days)


@router.get(
    "/spending/weekly",
    summary="Predict next week's spending"
)
async def predict_weekly_spending(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Predict total spending for the next 7 days."""
    ai_service = AIService(db)
    return ai_service.predict_weekly_spending(current_user.user_id)


@router.get(
    "/spending/monthly",
    summary="Predict next month's spending"
)
async def predict_monthly_spending(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Predict total spending for the next 30 days with weekly breakdown."""
    ai_service = AIService(db)
    return ai_service.predict_monthly_spending(current_user.user_id)


# ============================================
# GOAL SCORING
# ============================================

@router.get(
    "/goals/score-all",
    summary="Score all goals"
)
async def score_all_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get achievement probability scores for all active goals.
    
    Each goal gets:
    - Probability percentage (0-100%)
    - Confidence level
    - Risk factors
    - Recommendations
    """
    ai_service = AIService(db)
    return ai_service.score_all_goals(current_user.user_id)


@router.post(
    "/goals/score",
    summary="Score a specific goal"
)
async def score_goal(
    goal_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Score a specific goal's achievement probability.
    
    Provide goal details:
    - target_amount
    - current_amount
    - deadline_date
    - priority_level
    - monthly_allocation (optional)
    """
    ai_service = AIService(db)
    return ai_service.score_goal(current_user.user_id, goal_data)


# ============================================
# ANOMALY DETECTION
# ============================================

@router.get(
    "/anomalies",
    summary="Detect spending anomalies"
)
async def detect_anomalies(
    days: int = Query(30, ge=7, le=90, description="Days to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Detect unusual spending patterns.
    
    Identifies:
    - Unusually high transactions
    - Unusual category spending
    - Unusual timing patterns
    - ML-detected anomalies
    """
    ai_service = AIService(db)
    return ai_service.detect_anomalies(current_user.user_id, days)


@router.get(
    "/anomalies/check-daily",
    summary="Check if daily spending is anomalous"
)
async def check_daily_anomaly(
    amount: float = Query(..., description="Today's total spending"),
    check_date: Optional[date] = Query(None, description="Date to check (default: today)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Quick check if a daily spending total is anomalous."""
    from datetime import date as date_type
    
    ai_service = AIService(db)
    return ai_service.check_daily_anomaly(
        current_user.user_id,
        amount,
        check_date or date_type.today()
    )


# ============================================
# EMOTIONAL ANALYSIS
# ============================================

@router.get(
    "/emotional",
    summary="Analyze emotional spending patterns"
)
async def analyze_emotional_patterns(
    days: int = Query(90, ge=7, le=365, description="Days to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Comprehensive emotional spending analysis.
    
    THE CORE FORTUNA FEATURE!
    
    Reveals:
    - Which emotions trigger spending
    - Peak spending times
    - Category-emotion correlations
    - Spending triggers
    - Regret analysis
    - Your spending persona
    - Personalized recommendations
    """
    ai_service = AIService(db)
    return ai_service.analyze_emotional_patterns(current_user.user_id, days)


@router.get(
    "/emotional/monthly/{year}/{month}",
    summary="Get monthly emotional report"
)
async def get_monthly_emotional_report(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get emotional spending report for a specific month."""
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be 1-12")
    
    ai_service = AIService(db)
    return ai_service.get_monthly_emotional_report(current_user.user_id, year, month)


@router.get(
    "/emotional/risk-score",
    summary="Get emotional spending risk score"
)
async def get_emotional_risk_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get your emotional spending risk score (0-100).
    
    Higher scores indicate more risk for problematic emotional spending.
    """
    ai_service = AIService(db)
    analysis = ai_service.analyze_emotional_patterns(current_user.user_id, 90)
    
    return {
        'risk_score': analysis.get('risk_score', 0),
        'persona': analysis.get('spending_persona', {}),
        'top_recommendations': analysis.get('recommendations', [])[:3],
    }