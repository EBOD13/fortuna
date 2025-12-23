from sqlalchemy import Column, String, DECIMAL, DateTime, Boolean, Date, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base

class FinancialGoal(Base):
    __tablename__ = "financial_goals"
    
    goal_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    goal_name = Column(String(255), nullable=False)
    goal_type = Column(String(50), nullable=False)  # 'savings', 'debt_payoff', 'purchase', 'emergency_fund', 'education'
    
    target_amount = Column(DECIMAL(12, 2), nullable=False)
    current_amount = Column(DECIMAL(12, 2), default=0.0)
    deadline_date = Column(Date)
    
    priority_level = Column(Integer, nullable=False)  # 1 (highest) to 10 (lowest)
    is_mandatory = Column(Boolean, default=False)
    
    # AI-calculated 
    monthly_allocation = Column(DECIMAL(12, 2))
    confidence_score = Column(DECIMAL(3, 2))
    
    status = Column(String(20), default='active')  # 'active', 'completed', 'paused', 'cancelled'
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relationships
    milestones = relationship("GoalMilestone", back_populates="goal", cascade="all, delete-orphan")
    progress_history = relationship("GoalProgressHistory", back_populates="goal", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Goal {self.goal_name}: ${self.current_amount}/${self.target_amount}>"

class GoalMilestone(Base):
    __tablename__ = "goal_milestones"
    
    milestone_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("financial_goals.goal_id"), nullable=False)
    
    milestone_name = Column(String(255), nullable=False)
    target_amount = Column(DECIMAL(12, 2), nullable=False)
    target_date = Column(Date, nullable=False)
    
    achieved_date = Column(Date)
    is_achieved = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    goal = relationship("FinancialGoal", back_populates="milestones")
    
    def __repr__(self):
        return f"<Milestone {self.milestone_name}>"

class GoalProgressHistory(Base):
    __tablename__ = "goal_progress_history"
    
    progress_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("financial_goals.goal_id"), nullable=False)
    
    amount_added = Column(DECIMAL(12, 2), nullable=False)
    new_total = Column(DECIMAL(12, 2), nullable=False)
    progress_percentage = Column(DECIMAL(5, 2), nullable=False)
    contribution_date = Column(Date, nullable=False)
    
    source = Column(String(50))  # 'manual', 'automatic', 'windfall'
    notes = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    goal = relationship("FinancialGoal", back_populates="progress_history")
    
    def __repr__(self):
        return f"<Progress +${self.amount_added}>"