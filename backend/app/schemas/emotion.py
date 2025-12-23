from pydantic import BaseModel, Field
from datetime import datetime, date
from uuid import UUID
from typing import Optional, List

# Expense Emotion Schemas
class ExpenseEmotionBase(BaseModel):
    was_urgent: bool = False
    was_necessary: bool = False
    is_asset: bool = False
    primary_emotion: str = Field(..., min_length=1, max_length=50)
    emotion_intensity: Optional[int] = Field(None, ge=1, le=10)
    secondary_emotions: Optional[List[str]] = None
    purchase_reason: str = Field(..., min_length=1)
    time_of_day: Optional[str] = None
    day_type: Optional[str] = None
    stress_level: Optional[int] = Field(None, ge=1, le=10)

class ExpenseEmotionCreate(ExpenseEmotionBase):
    expense_id: UUID

class ExpenseEmotionUpdate(BaseModel):
    regret_level: Optional[int] = Field(None, ge=1, le=10)
    brought_joy: Optional[bool] = None
    would_buy_again: Optional[bool] = None
    reflection_notes: Optional[str] = None

class ExpenseEmotionResponse(ExpenseEmotionBase):
    emotion_id: UUID
    expense_id: UUID
    user_id: UUID
    regret_level: Optional[int]
    brought_joy: Optional[bool]
    would_buy_again: Optional[bool]
    reflection_notes: Optional[str]
    created_at: datetime
    reflected_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Daily Check-in Schemas
class DailyCheckinResponse(BaseModel):
    checkin_id: UUID
    user_id: UUID
    checkin_date: str
    expenses_logged: bool
    emotions_captured: bool
    completed_at: Optional[datetime]
    is_streak_day: bool
    current_streak: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Spending Streak Schemas
class SpendingStreakResponse(BaseModel):
    streak_id: UUID
    user_id: UUID
    streak_type: str
    current_streak: int
    longest_streak: int
    streak_start_date: Optional[str]
    last_activity_date: Optional[str]
    is_active: bool
    
    class Config:
        from_attributes = True