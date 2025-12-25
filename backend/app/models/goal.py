# backend/app/models/goal.py
"""
Financial Goals Models
Handles goals, milestones, and progress tracking
"""

from sqlalchemy import (
    Column, String, Numeric, Boolean, Integer, 
    Date, DateTime, ForeignKey, Text, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


class FinancialGoal(Base):
    """
    Main financial goals table
    Supports the "invest first, then spend" principle
    """
    __tablename__ = "financial_goals"
    
    goal_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    goal_name = Column(String(255), nullable=False)
    goal_type = Column(String(50), nullable=False)  # emergency_fund, savings, debt_payoff, education, custom
    description = Column(Text)
    
    target_amount = Column(Numeric(12, 2), nullable=False)
    current_amount = Column(Numeric(12, 2), default=0.0)
    
    deadline_date = Column(Date)
    priority_level = Column(Integer, nullable=False)  # 1-10, 10 being highest
    is_mandatory = Column(Boolean, default=False)  # Must be funded before discretionary spending
    
    # "Invest First" principle - treat as a bill
    monthly_allocation = Column(Numeric(12, 2))  # Fixed monthly contribution
    treat_as_bill = Column(Boolean, default=False)  # If True, this is a non-negotiable expense
    allocation_day = Column(Integer)  # Day of month to allocate (1-28)
    
    # AI confidence scoring
    confidence_score = Column(Numeric(3, 2))  # 0.00 - 1.00 probability of achieving goal
    
    # Status tracking
    status = Column(String(20), default='active')  # active, paused, completed, abandoned
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="goals")
    milestones = relationship("GoalMilestone", back_populates="goal", cascade="all, delete-orphan")
    progress_history = relationship("GoalProgressHistory", back_populates="goal", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('priority_level >= 1 AND priority_level <= 10', name='check_priority_range'),
        CheckConstraint('allocation_day >= 1 AND allocation_day <= 28', name='check_allocation_day'),
    )
    
    @property
    def completion_percentage(self):
        """Calculate current completion percentage"""
        if self.target_amount and self.target_amount > 0:
            return round(float(self.current_amount or 0) / float(self.target_amount) * 100, 2)
        return 0.0
    
    @property
    def remaining_amount(self):
        """Calculate remaining amount to reach goal"""
        return float(self.target_amount or 0) - float(self.current_amount or 0)
    
    @property
    def days_remaining(self):
        """Calculate days until deadline"""
        if self.deadline_date:
            from datetime import date
            delta = self.deadline_date - date.today()
            return max(0, delta.days)
        return None
    
    @property
    def required_daily_savings(self):
        """Calculate required daily savings to meet goal"""
        if self.days_remaining and self.days_remaining > 0:
            return round(self.remaining_amount / self.days_remaining, 2)
        return None
    
    @property
    def required_monthly_savings(self):
        """Calculate required monthly savings to meet goal"""
        if self.days_remaining and self.days_remaining > 0:
            months_remaining = self.days_remaining / 30.44  # Average days per month
            if months_remaining > 0:
                return round(self.remaining_amount / months_remaining, 2)
        return None
    
    @property
    def is_on_track(self):
        """
        Determine if goal is on track based on expected progress
        """
        if not self.deadline_date or not self.created_at:
            return None
        
        from datetime import date, datetime
        
        created_date = self.created_at.date() if isinstance(self.created_at, datetime) else self.created_at
        total_days = (self.deadline_date - created_date).days
        elapsed_days = (date.today() - created_date).days
        
        if total_days <= 0:
            return self.completion_percentage >= 100
        
        expected_percentage = (elapsed_days / total_days) * 100
        return self.completion_percentage >= expected_percentage


class GoalMilestone(Base):
    """
    Milestones for breaking down large goals into achievable steps
    """
    __tablename__ = "goal_milestones"
    
    milestone_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("financial_goals.goal_id", ondelete="CASCADE"), nullable=False)
    
    milestone_name = Column(String(255), nullable=False)
    description = Column(Text)
    target_amount = Column(Numeric(12, 2), nullable=False)
    target_date = Column(Date, nullable=False)
    
    achieved_date = Column(Date)
    is_achieved = Column(Boolean, default=False)
    
    # Notification settings
    notify_on_achievement = Column(Boolean, default=True)
    reminder_days_before = Column(Integer, default=7)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    goal = relationship("FinancialGoal", back_populates="milestones")
    
    @property
    def days_until_target(self):
        """Days until target date"""
        if self.target_date:
            from datetime import date
            delta = self.target_date - date.today()
            return delta.days
        return None


class GoalProgressHistory(Base):
    """
    Track all contributions and changes to goals over time
    """
    __tablename__ = "goal_progress_history"
    
    progress_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("financial_goals.goal_id", ondelete="CASCADE"), nullable=False)
    
    amount_added = Column(Numeric(12, 2), nullable=False)  # Can be negative for withdrawals
    new_total = Column(Numeric(12, 2), nullable=False)
    progress_percentage = Column(Numeric(5, 2), nullable=False)
    
    contribution_date = Column(Date, nullable=False)
    
    # Source of contribution
    source = Column(String(50))  # manual, automatic, income_allocation, transfer
    source_description = Column(String(255))
    
    # For automatic allocations
    income_source_id = Column(UUID(as_uuid=True), ForeignKey("income_sources.income_id", ondelete="SET NULL"))
    
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    goal = relationship("FinancialGoal", back_populates="progress_history")


class GoalCategory(Base):
    """
    Predefined and custom goal categories
    """
    __tablename__ = "goal_categories"
    
    category_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"))  # NULL for system defaults
    
    category_name = Column(String(100), nullable=False)
    category_type = Column(String(50), nullable=False)  # emergency, savings, debt, education, retirement, custom
    description = Column(Text)
    icon = Column(String(50))
    color = Column(String(7))  # Hex color code
    
    # Suggested settings
    suggested_priority = Column(Integer)
    suggested_timeline_months = Column(Integer)
    
    is_system_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())