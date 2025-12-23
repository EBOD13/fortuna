from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Time
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base

class ExpenseEmotion(Base):
    __tablename__ = "expense_emotions"
    
    emotion_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.expense_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    # Contextual classification
    was_urgent = Column(Boolean, default=False)
    was_necessary = Column(Boolean, default=False)
    is_asset = Column(Boolean, default=False)
    
    # Emotional state
    primary_emotion = Column(String(50), nullable=False)
    emotion_intensity = Column(Integer)  # 1-10
    secondary_emotions = Column(ARRAY(String))
    
    # Reasoning
    purchase_reason = Column(String, nullable=False)
    
    # Context
    time_of_day = Column(String(20))  # 'morning', 'afternoon', 'evening', 'late_night'
    day_type = Column(String(20))  # 'weekday', 'weekend', 'holiday', 'exam_week'
    stress_level = Column(Integer)  # 1-10
    
    # Later reflection
    regret_level = Column(Integer)  # 1-10
    brought_joy = Column(Boolean)
    would_buy_again = Column(Boolean)
    reflection_notes = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    reflected_at = Column(DateTime)
    
    def __repr__(self):
        return f"<ExpenseEmotion {self.primary_emotion}>"

class DailyCheckin(Base):
    __tablename__ = "daily_checkins"
    
    checkin_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    checkin_date = Column(String, nullable=False)  # Date as string for uniqueness
    
    # Completion tracking
    expenses_logged = Column(Boolean, default=False)
    emotions_captured = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    
    # Streak tracking
    is_streak_day = Column(Boolean, default=True)
    current_streak = Column(Integer, default=0)
    
    # Reminder system
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime)
    reminder_responded = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<DailyCheckin {self.checkin_date}>"

class SpendingStreak(Base):
    __tablename__ = "spending_streaks"
    
    streak_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    streak_type = Column(String(50), nullable=False)  # 'daily_logging', 'budget_adherence'
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    streak_start_date = Column(String)
    last_activity_date = Column(String)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Streak {self.streak_type}: {self.current_streak}>"