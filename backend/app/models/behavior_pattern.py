from sqlalchemy import Column, String, DECIMAL, DateTime, Boolean, Date, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from datetime import datetime
import uuid

from app.database import Base

class UserBehaviorPattern(Base):
    __tablename__ = "user_behavior_patterns"
    
    pattern_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    pattern_type = Column(String(50), nullable=False)
    pattern_name = Column(String(255), nullable=False)
    confidence_score = Column(DECIMAL(3, 2), nullable=False)
    
    frequency = Column(String(50))
    avg_impact = Column(DECIMAL(12, 2))
    triggers = Column(JSONB)
    time_of_occurrence = Column(JSONB)
    affected_categories = Column(ARRAY(String))
    
    first_detected = Column(Date, nullable=False)
    last_occurred = Column(Date)
    occurrence_count = Column(Integer, default=1)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Pattern {self.pattern_name}>"

class EmotionalTrigger(Base):
    __tablename__ = "emotional_triggers"
    
    trigger_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    trigger_name = Column(String(255), nullable=False)
    emotion = Column(String(50), nullable=False)
    typical_category = Column(String(100))
    avg_spending_when_triggered = Column(DECIMAL(12, 2))
    occurrence_count = Column(Integer, default=1)
    
    preventive_suggestions = Column(ARRAY(String))
    user_acknowledged = Column(Boolean, default=False)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Trigger {self.trigger_name}>"

class MealSuggestion(Base):
    __tablename__ = "meal_suggestions"
    
    meal_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    meal_name = Column(String(255), nullable=False)
    ingredients = Column(String, nullable=False)
    instructions = Column(String, nullable=False)
    prep_time_minutes = Column(Integer, nullable=False)
    estimated_cost = Column(DECIMAL(6, 2))
    dietary_tags = Column(ARRAY(String))
    meal_type = Column(String(50))
    
    # User interaction
    times_suggested = Column(Integer, default=0)
    times_made = Column(Integer, default=0)
    user_liked = Column(Boolean)
    user_notes = Column(String)
    
    # AI relevance
    suggested_for_emotion = Column(String(50))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Meal {self.meal_name}>"