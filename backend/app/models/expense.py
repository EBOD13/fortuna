# backend/app/models/expense.py
"""
Expense Models
Track expenses with categories and emotional context
Core feature of Fortuna - understanding the WHY behind spending
"""

from sqlalchemy import (
    Column, String, Numeric, Boolean, Integer,
    Date, DateTime, Time, ForeignKey, Text, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.database import Base


class ExpenseCategory(Base):
    """
    Expense categories - both system defaults and user-created
    """
    __tablename__ = "expense_categories"
    
    category_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"))  # NULL for system defaults
    
    category_name = Column(String(100), nullable=False)
    parent_category_id = Column(UUID(as_uuid=True), ForeignKey("expense_categories.category_id", ondelete="SET NULL"))
    
    # Category classification
    category_type = Column(String(20), nullable=False)  # fixed, variable, discretionary
    is_essential = Column(Boolean, default=True)
    
    # Budget tracking
    monthly_budget = Column(Numeric(12, 2))
    
    # Display
    icon = Column(String(50))  # Icon name for UI
    color = Column(String(7))  # Hex color code
    
    # Seasonality (some categories have seasonal patterns)
    seasonality_factor = Column(Numeric(3, 2), default=1.0)  # 1.0 = no seasonality
    
    # System vs User
    is_system_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    expenses = relationship("Expense", back_populates="category")
    subcategories = relationship("ExpenseCategory", backref="parent", remote_side=[category_id])


class Expense(Base):
    """
    Individual expense transactions
    The core expense tracking table
    """
    __tablename__ = "expenses"
    
    expense_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("expense_categories.category_id", ondelete="SET NULL"))
    
    # Basic expense info
    expense_name = Column(String(255), nullable=False)
    description = Column(Text)
    amount = Column(Numeric(12, 2), nullable=False)
    
    # When
    expense_date = Column(Date, nullable=False)
    expense_time = Column(Time)  # Optional time of purchase
    
    # Where
    merchant_name = Column(String(255))
    location = Column(String(255))
    
    # How
    payment_method = Column(String(50))  # cash, credit_card, debit_card, etc.
    
    # Recurring link
    is_recurring = Column(Boolean, default=False)
    recurring_expense_id = Column(UUID(as_uuid=True), ForeignKey("recurring_expenses.recurring_id", ondelete="SET NULL"))
    
    # Dependent link
    dependent_id = Column(UUID(as_uuid=True), ForeignKey("dependents.dependent_id", ondelete="SET NULL"))
    
    # Tags for flexible categorization
    tags = Column(ARRAY(String))
    
    # Receipt
    receipt_url = Column(String(500))
    
    # Tracking metadata
    is_planned = Column(Boolean, default=False)  # Was this a planned purchase?
    logged_immediately = Column(Boolean, default=False)  # Logged right after purchase?
    
    # AI analysis
    ai_category_suggestion = Column(UUID(as_uuid=True))  # AI suggested category
    ai_confidence_score = Column(Numeric(3, 2))  # Confidence in categorization
    
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="expenses")
    category = relationship("ExpenseCategory", back_populates="expenses")
    emotion = relationship("ExpenseEmotion", back_populates="expense", uselist=False, cascade="all, delete-orphan")


class ExpenseEmotion(Base):
    """
    Emotional context for expenses - THE CORE FORTUNA FEATURE
    Understanding WHY purchases happen to build better habits
    """
    __tablename__ = "expense_emotions"
    
    emotion_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.expense_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    # Contextual classification
    was_urgent = Column(Boolean, default=False)  # Did you NEED it right then?
    was_necessary = Column(Boolean, default=False)  # Was it truly necessary?
    is_asset = Column(Boolean, default=False)  # Is this an asset or just consumption?
    
    # Primary emotional state at time of purchase
    primary_emotion = Column(String(50), nullable=False)
    # Options: happy, excited, stressed, anxious, bored, hungry, tired, 
    #          sad, frustrated, celebratory, impulsive, planned, guilty
    
    emotion_intensity = Column(Integer)  # 1-10 scale
    
    # Secondary emotions (can have multiple)
    secondary_emotions = Column(ARRAY(String))
    
    # The WHY - most important field
    purchase_reason = Column(Text, nullable=False)
    
    # Context
    time_of_day = Column(String(20))  # morning, afternoon, evening, night, late_night
    day_type = Column(String(20))  # weekday, weekend, holiday, exam_week, payday
    
    # Stress level at the time
    stress_level = Column(Integer)  # 1-10 scale
    
    # Was it related to a specific trigger?
    trigger_event = Column(String(255))  # "exam tomorrow", "fight with roommate", "got paid"
    
    # Reflection (filled in later)
    regret_level = Column(Integer)  # 1-10, filled in during daily/weekly review
    brought_joy = Column(Boolean)  # Did this purchase bring lasting joy?
    would_buy_again = Column(Boolean)  # Knowing what you know now...
    reflection_notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    reflected_at = Column(DateTime)  # When user reflected on this purchase
    
    # Relationships
    expense = relationship("Expense", back_populates="emotion")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('emotion_intensity IS NULL OR (emotion_intensity >= 1 AND emotion_intensity <= 10)', 
                       name='check_emotion_intensity'),
        CheckConstraint('stress_level IS NULL OR (stress_level >= 1 AND stress_level <= 10)', 
                       name='check_stress_level'),
        CheckConstraint('regret_level IS NULL OR (regret_level >= 1 AND regret_level <= 10)', 
                       name='check_regret_level'),
    )


class DailyCheckin(Base):
    """
    Daily expense logging check-in
    Reminds user to log expenses and maintains streaks
    """
    __tablename__ = "daily_checkins"
    
    checkin_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    checkin_date = Column(Date, nullable=False)
    
    # Completion tracking
    expenses_logged = Column(Boolean, default=False)
    emotions_captured = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    
    # Summary
    total_spent_today = Column(Numeric(12, 2), default=0)
    expense_count = Column(Integer, default=0)
    
    # Mood check
    overall_mood = Column(String(50))  # How are you feeling today?
    mood_notes = Column(Text)
    
    # Streak tracking
    is_streak_day = Column(Boolean, default=True)  # Does this count toward streak?
    current_streak = Column(Integer, default=0)
    
    # Reminder system
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime)
    reminder_responded = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    __table_args__ = (
        # Unique constraint: one checkin per user per day
        {'sqlite_autoincrement': True},
    )


class SpendingStreak(Base):
    """
    Track various spending discipline streaks
    """
    __tablename__ = "spending_streaks"
    
    streak_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    # Streak type
    streak_type = Column(String(50), nullable=False)
    # Types: daily_logging, no_impulse_buy, under_budget, no_eating_out, 
    #        meal_prep, emotional_logging, reflection_complete
    
    streak_name = Column(String(255))  # Custom name for display
    
    # Streak stats
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    streak_start_date = Column(Date)
    last_activity_date = Column(Date)
    
    # Goal
    target_streak = Column(Integer)  # Goal to reach
    
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class MonthlyEmotionalAnalysis(Base):
    """
    AI-generated monthly analysis of spending patterns and emotions
    The key insight generator for Fortuna
    """
    __tablename__ = "monthly_emotional_analysis"
    
    analysis_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    # Period
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    
    # Spending summary
    total_spending = Column(Numeric(12, 2), nullable=False)
    emotional_spending_amount = Column(Numeric(12, 2), nullable=False)  # Non-essential, emotional purchases
    emotional_spending_percentage = Column(Numeric(5, 2))
    
    # Emotional patterns (stored as category counts)
    most_common_emotion = Column(String(50))
    most_expensive_emotion = Column(String(50))  # Which emotion leads to biggest spending
    
    # Time patterns
    highest_spending_time = Column(String(20))  # When do you spend most?
    highest_spending_day = Column(String(20))  # Which day type?
    
    # Top triggers
    top_triggers = Column(ARRAY(String))  # Top 5 spending triggers
    
    # Categories most affected by emotions
    emotional_categories = Column(ARRAY(String))
    
    # AI-generated insights
    ai_observations = Column(Text)  # General observations about patterns
    behavioral_recommendations = Column(ARRAY(String))  # Specific recommendations
    meal_suggestions = Column(ARRAY(String))  # Easy meal ideas for stress eating
    
    # Comparison
    vs_last_month_spending = Column(Numeric(12, 2))
    vs_last_month_emotional = Column(Numeric(5, 2))  # Change in emotional spending %
    
    # User reflection
    user_reflection = Column(Text)
    action_items = Column(ARRAY(String))  # User's chosen action items
    reflection_completed = Column(Boolean, default=False)
    reflection_completed_at = Column(DateTime)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    __table_args__ = (
        CheckConstraint('month >= 1 AND month <= 12', name='check_month_range'),
    )