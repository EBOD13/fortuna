from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, date

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.models.expense_emotion import ExpenseEmotion, DailyCheckin, SpendingStreak
from app.schemas.emotion import (
    ExpenseEmotionCreate, ExpenseEmotionUpdate, ExpenseEmotionResponse,
    DailyCheckinResponse, SpendingStreakResponse
)

router = APIRouter()

# ============================================
# EMOTIONAL TRACKING
# ============================================

@router.post("/", response_model=ExpenseEmotionResponse, status_code=status.HTTP_201_CREATED)
def add_emotion_to_expense(
    emotion_data: ExpenseEmotionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add emotional context to an expense"""
    
    # Verify expense exists and belongs to user
    expense = db.query(Expense).filter(
        Expense.expense_id == emotion_data.expense_id,
        Expense.user_id == current_user.user_id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    # Check if emotion already exists for this expense
    existing = db.query(ExpenseEmotion).filter(
        ExpenseEmotion.expense_id == emotion_data.expense_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Emotion data already exists for this expense"
        )
    
    # Determine time of day
    now = datetime.now()
    hour = now.hour
    if hour < 6:
        time_of_day = "late_night"
    elif hour < 12:
        time_of_day = "morning"
    elif hour < 18:
        time_of_day = "afternoon"
    elif hour < 22:
        time_of_day = "evening"
    else:
        time_of_day = "late_night"
    
    # Determine day type
    today = date.today()
    weekday = today.weekday()
    if weekday >= 5:  # Saturday = 5, Sunday = 6
        day_type = "weekend"
    else:
        day_type = "weekday"
    
    # Create emotion record
    db_emotion = ExpenseEmotion(
        expense_id=emotion_data.expense_id,
        user_id=current_user.user_id,
        was_urgent=emotion_data.was_urgent,
        was_necessary=emotion_data.was_necessary,
        is_asset=emotion_data.is_asset,
        primary_emotion=emotion_data.primary_emotion,
        emotion_intensity=emotion_data.emotion_intensity,
        secondary_emotions=emotion_data.secondary_emotions,
        purchase_reason=emotion_data.purchase_reason,
        time_of_day=emotion_data.time_of_day or time_of_day,
        day_type=emotion_data.day_type or day_type,
        stress_level=emotion_data.stress_level
    )
    
    db.add(db_emotion)
    db.commit()
    db.refresh(db_emotion)
    
    # Update daily check-in
    today_str = today.isoformat()
    checkin = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.user_id,
        DailyCheckin.checkin_date == today_str
    ).first()
    
    if not checkin:
        checkin = DailyCheckin(
            user_id=current_user.user_id,
            checkin_date=today_str
        )
        db.add(checkin)
    
    checkin.emotions_captured = True
    
    # Check if check-in is complete
    if checkin.emotions_captured and checkin.expenses_logged:
        checkin.completed_at = datetime.utcnow()
        
        # Update streak
        _update_streak(db, current_user.user_id, today_str)
    
    db.commit()
    
    return db_emotion

@router.get("/expense/{expense_id}", response_model=ExpenseEmotionResponse)
def get_expense_emotion(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get emotional data for a specific expense"""
    
    emotion = db.query(ExpenseEmotion).join(Expense).filter(
        ExpenseEmotion.expense_id == expense_id,
        Expense.user_id == current_user.user_id
    ).first()
    
    if not emotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emotion data not found for this expense"
        )
    
    return emotion

@router.put("/{emotion_id}/reflect", response_model=ExpenseEmotionResponse)
def add_reflection(
    emotion_id: UUID,
    reflection_data: ExpenseEmotionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add reflection to an expense emotion (for monthly review)"""
    
    emotion = db.query(ExpenseEmotion).filter(
        ExpenseEmotion.emotion_id == emotion_id,
        ExpenseEmotion.user_id == current_user.user_id
    ).first()
    
    if not emotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emotion data not found"
        )
    
    # Update reflection fields
    for field, value in reflection_data.dict(exclude_unset=True).items():
        setattr(emotion, field, value)
    
    emotion.reflected_at = datetime.utcnow()
    
    db.commit()
    db.refresh(emotion)
    
    return emotion

# ============================================
# DAILY CHECK-INS
# ============================================

@router.get("/checkins/today", response_model=DailyCheckinResponse)
def get_today_checkin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's check-in status"""
    
    today = date.today().isoformat()
    
    checkin = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.user_id,
        DailyCheckin.checkin_date == today
    ).first()
    
    if not checkin:
        # Create one
        checkin = DailyCheckin(
            user_id=current_user.user_id,
            checkin_date=today
        )
        db.add(checkin)
        db.commit()
        db.refresh(checkin)
    
    return checkin

@router.post("/checkins/complete", response_model=DailyCheckinResponse)
def complete_daily_checkin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark today's check-in as complete"""
    
    today = date.today().isoformat()
    
    checkin = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.user_id,
        DailyCheckin.checkin_date == today
    ).first()
    
    if not checkin:
        checkin = DailyCheckin(
            user_id=current_user.user_id,
            checkin_date=today
        )
        db.add(checkin)
    
    checkin.expenses_logged = True
    checkin.emotions_captured = True
    checkin.completed_at = datetime.utcnow()
    
    # Update streak
    _update_streak(db, current_user.user_id, today)
    
    db.commit()
    db.refresh(checkin)
    
    return checkin

# ============================================
# STREAKS
# ============================================

@router.get("/streaks", response_model=List[SpendingStreakResponse])
def get_streaks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active streaks"""
    
    streaks = db.query(SpendingStreak).filter(
        SpendingStreak.user_id == current_user.user_id,
        SpendingStreak.is_active == True
    ).all()
    
    return streaks

# ============================================
# HELPER FUNCTIONS
# ============================================

def _update_streak(db: Session, user_id: UUID, date_str: str):
    """Update the daily logging streak"""
    
    streak = db.query(SpendingStreak).filter(
        SpendingStreak.user_id == user_id,
        SpendingStreak.streak_type == "daily_logging",
        SpendingStreak.is_active == True
    ).first()
    
    if not streak:
        # Create new streak
        streak = SpendingStreak(
            user_id=user_id,
            streak_type="daily_logging",
            current_streak=1,
            longest_streak=1,
            streak_start_date=date_str,
            last_activity_date=date_str
        )
        db.add(streak)
    else:
        # Check if consecutive day
        from datetime import datetime, timedelta
        last_date = datetime.fromisoformat(streak.last_activity_date).date()
        today = datetime.fromisoformat(date_str).date()
        
        if (today - last_date).days == 1:
            # Consecutive day - increment streak
            streak.current_streak += 1
            if streak.current_streak > streak.longest_streak:
                streak.longest_streak = streak.current_streak
        elif (today - last_date).days > 1:
            # Streak broken - reset
            streak.current_streak = 1
            streak.streak_start_date = date_str
        
        streak.last_activity_date = date_str
    
    db.commit()