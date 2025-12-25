# backend/app/schemas/notification.py
"""
Notification Schemas
Pydantic models for notifications, reminders, and achievements
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date, datetime, time
from enum import Enum


class NotificationType(str, Enum):
    BUDGET_ALERT = "budget_alert"
    GOAL_MILESTONE = "goal_milestone"
    SPENDING_ANOMALY = "spending_anomaly"
    DAILY_REMINDER = "daily_reminder"
    WEEKLY_SUMMARY = "weekly_summary"
    BILL_REMINDER = "bill_reminder"
    EMOTIONAL_INSIGHT = "emotional_insight"
    ACHIEVEMENT = "achievement"


class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationCategory(str, Enum):
    BUDGET = "budget"
    GOAL = "goal"
    EXPENSE = "expense"
    INSIGHT = "insight"
    REMINDER = "reminder"
    ACHIEVEMENT = "achievement"


class ReminderFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class ReminderType(str, Enum):
    DAILY_CHECKIN = "daily_checkin"
    LOG_EXPENSES = "log_expenses"
    REVIEW_BUDGET = "review_budget"
    PAY_BILL = "pay_bill"
    GOAL_CONTRIBUTION = "goal_contribution"
    WEEKLY_REVIEW = "weekly_review"
    MONTHLY_REVIEW = "monthly_review"


# ============================================
# NOTIFICATION SCHEMAS
# ============================================

class NotificationCreate(BaseModel):
    """Create a notification (internal use)"""
    title: str = Field(..., min_length=1, max_length=255)
    message: str
    notification_type: NotificationType
    priority: NotificationPriority = NotificationPriority.NORMAL
    category: Optional[NotificationCategory] = None
    action_type: Optional[str] = None
    action_data: Optional[Dict[str, Any]] = None
    scheduled_for: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class NotificationResponse(BaseModel):
    """Notification response"""
    notification_id: UUID
    title: str
    message: str
    notification_type: str
    priority: str
    category: Optional[str] = None
    action_type: Optional[str] = None
    action_data: Optional[Dict[str, Any]] = None
    is_read: bool
    is_dismissed: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationUpdate(BaseModel):
    """Update notification (mark read, dismiss)"""
    is_read: Optional[bool] = None
    is_dismissed: Optional[bool] = None


class NotificationList(BaseModel):
    """Paginated notification list"""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
    page: int
    per_page: int


# ============================================
# REMINDER SCHEMAS
# ============================================

class ReminderCreate(BaseModel):
    """Create a reminder"""
    reminder_type: ReminderType
    title: str = Field(..., min_length=1, max_length=255)
    message: Optional[str] = None
    frequency: ReminderFrequency
    time_of_day: time
    
    # For weekly reminders (0=Monday, 6=Sunday)
    days_of_week: Optional[List[int]] = None
    
    # For monthly reminders
    day_of_month: Optional[int] = Field(None, ge=1, le=28)
    
    # Link to entity
    linked_entity_type: Optional[str] = None
    linked_entity_id: Optional[UUID] = None
    
    @field_validator('days_of_week')
    @classmethod
    def validate_days(cls, v):
        if v is not None:
            for day in v:
                if day < 0 or day > 6:
                    raise ValueError('days_of_week must be 0-6 (Monday-Sunday)')
        return v


class ReminderUpdate(BaseModel):
    """Update a reminder"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    message: Optional[str] = None
    time_of_day: Optional[time] = None
    days_of_week: Optional[List[int]] = None
    day_of_month: Optional[int] = Field(None, ge=1, le=28)
    is_active: Optional[bool] = None


class ReminderResponse(BaseModel):
    """Reminder response"""
    reminder_id: UUID
    reminder_type: str
    title: str
    message: Optional[str] = None
    frequency: str
    time_of_day: time
    days_of_week: Optional[List[int]] = None
    day_of_month: Optional[int] = None
    linked_entity_type: Optional[str] = None
    linked_entity_id: Optional[UUID] = None
    is_active: bool
    is_snoozed: bool
    snoozed_until: Optional[datetime] = None
    last_sent_at: Optional[datetime] = None
    next_scheduled_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class SnoozeReminderRequest(BaseModel):
    """Snooze a reminder"""
    snooze_until: datetime


# ============================================
# NOTIFICATION PREFERENCES
# ============================================

class NotificationPreferenceUpdate(BaseModel):
    """Update notification preferences"""
    push_enabled: Optional[bool] = None
    
    budget_alerts: Optional[bool] = None
    goal_updates: Optional[bool] = None
    spending_anomalies: Optional[bool] = None
    daily_reminders: Optional[bool] = None
    weekly_summaries: Optional[bool] = None
    bill_reminders: Optional[bool] = None
    emotional_insights: Optional[bool] = None
    achievements: Optional[bool] = None
    
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[time] = None
    quiet_hours_end: Optional[time] = None
    
    max_daily_notifications: Optional[int] = Field(None, ge=1, le=50)
    
    email_enabled: Optional[bool] = None
    email_frequency: Optional[str] = None


class NotificationPreferenceResponse(BaseModel):
    """Notification preferences response"""
    preference_id: UUID
    push_enabled: bool
    
    budget_alerts: bool
    goal_updates: bool
    spending_anomalies: bool
    daily_reminders: bool
    weekly_summaries: bool
    bill_reminders: bool
    emotional_insights: bool
    achievements: bool
    
    quiet_hours_enabled: bool
    quiet_hours_start: Optional[time] = None
    quiet_hours_end: Optional[time] = None
    
    max_daily_notifications: int
    
    email_enabled: bool
    email_frequency: str
    
    class Config:
        from_attributes = True


# ============================================
# ACHIEVEMENT SCHEMAS
# ============================================

class AchievementResponse(BaseModel):
    """Achievement definition response"""
    achievement_id: UUID
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    category: str
    requirement_type: str
    requirement_value: int
    points: int
    
    class Config:
        from_attributes = True


class UserAchievementResponse(BaseModel):
    """User's earned achievement"""
    user_achievement_id: UUID
    achievement: AchievementResponse
    earned_at: datetime
    current_progress: int
    target_progress: Optional[int] = None
    
    class Config:
        from_attributes = True


class AchievementProgress(BaseModel):
    """Progress towards an achievement"""
    achievement: AchievementResponse
    current_progress: int
    target_progress: int
    progress_percentage: float
    is_earned: bool
    earned_at: Optional[datetime] = None


class AchievementSummary(BaseModel):
    """User's achievement summary"""
    total_earned: int
    total_points: int
    recent_achievements: List[UserAchievementResponse]
    in_progress: List[AchievementProgress]