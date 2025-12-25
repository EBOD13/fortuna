# backend/app/models/notification.py
"""
Notification Models
User notifications, reminders, and alert preferences
"""

from sqlalchemy import (
    Column, String, Numeric, Boolean, Integer,
    Date, DateTime, Time, ForeignKey, Text, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


class Notification(Base):
    """
    User notifications (in-app and push)
    """
    __tablename__ = "notifications"
    
    notification_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    # Notification content
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)
    # Types: budget_alert, goal_milestone, spending_anomaly, daily_reminder,
    #        weekly_summary, bill_reminder, emotional_insight, achievement
    
    # Priority and category
    priority = Column(String(20), default='normal')  # low, normal, high, urgent
    category = Column(String(50))  # budget, goal, expense, insight, reminder
    
    # Action
    action_type = Column(String(50))  # open_budget, open_goal, log_expense, view_insight
    action_data = Column(JSONB)  # {"goal_id": "uuid", "budget_id": "uuid", etc.}
    
    # Status
    is_read = Column(Boolean, default=False)
    is_dismissed = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True))
    
    # Delivery
    is_push_sent = Column(Boolean, default=False)
    push_sent_at = Column(DateTime(timezone=True))
    
    # Scheduling
    scheduled_for = Column(DateTime(timezone=True))  # For scheduled notifications
    expires_at = Column(DateTime(timezone=True))  # Auto-dismiss after this time
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notifications")


class Reminder(Base):
    """
    Recurring reminders for various actions
    """
    __tablename__ = "reminders"
    
    reminder_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    # Reminder details
    reminder_type = Column(String(50), nullable=False)
    # Types: daily_checkin, log_expenses, review_budget, pay_bill, 
    #        goal_contribution, weekly_review, monthly_review
    
    title = Column(String(255), nullable=False)
    message = Column(Text)
    
    # Schedule
    frequency = Column(String(20), nullable=False)  # daily, weekly, monthly, custom
    time_of_day = Column(Time, nullable=False)  # When to send
    
    # For weekly reminders
    days_of_week = Column(ARRAY(Integer))  # [0,1,2,3,4,5,6] for Mon-Sun
    
    # For monthly reminders
    day_of_month = Column(Integer)  # 1-28
    
    # Linked entity (optional)
    linked_entity_type = Column(String(50))  # goal, budget, recurring_expense
    linked_entity_id = Column(UUID(as_uuid=True))
    
    # Status
    is_active = Column(Boolean, default=True)
    last_sent_at = Column(DateTime(timezone=True))
    next_scheduled_at = Column(DateTime(timezone=True))
    
    # Snooze
    is_snoozed = Column(Boolean, default=False)
    snoozed_until = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="reminders")
    
    __table_args__ = (
        CheckConstraint('day_of_month >= 1 AND day_of_month <= 28', name='check_day_of_month'),
    )


class NotificationPreference(Base):
    """
    User preferences for notifications
    """
    __tablename__ = "notification_preferences"
    
    preference_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Push notifications
    push_enabled = Column(Boolean, default=True)
    
    # Notification types enabled
    budget_alerts = Column(Boolean, default=True)
    goal_updates = Column(Boolean, default=True)
    spending_anomalies = Column(Boolean, default=True)
    daily_reminders = Column(Boolean, default=True)
    weekly_summaries = Column(Boolean, default=True)
    bill_reminders = Column(Boolean, default=True)
    emotional_insights = Column(Boolean, default=True)
    achievements = Column(Boolean, default=True)
    
    # Quiet hours
    quiet_hours_enabled = Column(Boolean, default=False)
    quiet_hours_start = Column(Time)  # e.g., 22:00
    quiet_hours_end = Column(Time)  # e.g., 08:00
    
    # Frequency limits
    max_daily_notifications = Column(Integer, default=10)
    
    # Email preferences
    email_enabled = Column(Boolean, default=False)
    email_frequency = Column(String(20), default='weekly')  # daily, weekly, monthly
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notification_preferences")


class Achievement(Base):
    """
    Gamification - user achievements/badges
    """
    __tablename__ = "achievements"
    
    achievement_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Achievement definition
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    icon = Column(String(50))  # Icon name/emoji
    category = Column(String(50))  # saving, budgeting, emotional, streak, milestone
    
    # Requirements
    requirement_type = Column(String(50))
    # Types: streak_days, total_saved, goals_completed, budget_under, 
    #        emotions_logged, reflections_done, no_impulse_days
    requirement_value = Column(Integer)  # e.g., 7 for 7-day streak
    
    # Rewards
    points = Column(Integer, default=10)
    
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserAchievement(Base):
    """
    Track which achievements users have earned
    """
    __tablename__ = "user_achievements"
    
    user_achievement_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    achievement_id = Column(UUID(as_uuid=True), ForeignKey("achievements.achievement_id", ondelete="CASCADE"), nullable=False)
    
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Progress tracking (for incremental achievements)
    current_progress = Column(Integer, default=0)
    target_progress = Column(Integer)
    
    # Notification sent
    notification_sent = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement")