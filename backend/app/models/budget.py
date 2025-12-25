# backend/app/models/budget.py
"""
Budget Models
Monthly/weekly budgets, category budgets, and budget tracking
"""

from sqlalchemy import (
    Column, String, Numeric, Boolean, Integer,
    Date, DateTime, ForeignKey, Text, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


class Budget(Base):
    """
    Main budget for a time period (monthly/weekly)
    """
    __tablename__ = "budgets"
    
    budget_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    # Budget period
    budget_name = Column(String(255), nullable=False)  # "December 2024", "Week 49"
    budget_type = Column(String(20), nullable=False)  # monthly, weekly, custom
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Amounts
    total_amount = Column(Numeric(12, 2), nullable=False)  # Total budget
    allocated_amount = Column(Numeric(12, 2), default=0)  # Amount allocated to categories
    spent_amount = Column(Numeric(12, 2), default=0)  # Actual spent
    
    # Income-based budgeting
    expected_income = Column(Numeric(12, 2))  # Expected income for period
    savings_target = Column(Numeric(12, 2))  # How much to save
    savings_target_percentage = Column(Numeric(5, 2))  # Or as percentage
    
    # Status
    status = Column(String(20), default='active')  # active, closed, exceeded
    is_rollover_enabled = Column(Boolean, default=False)  # Roll unused to next period
    
    # Alerts
    alert_at_percentage = Column(Integer, default=80)  # Alert when X% spent
    alert_sent = Column(Boolean, default=False)
    
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="budgets")
    category_budgets = relationship("CategoryBudget", back_populates="budget", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint('alert_at_percentage >= 0 AND alert_at_percentage <= 100', name='check_alert_percentage'),
    )
    
    @property
    def remaining_amount(self):
        """Calculate remaining budget"""
        return float(self.total_amount or 0) - float(self.spent_amount or 0)
    
    @property
    def spent_percentage(self):
        """Calculate percentage spent"""
        if self.total_amount and self.total_amount > 0:
            return round(float(self.spent_amount or 0) / float(self.total_amount) * 100, 1)
        return 0
    
    @property
    def unallocated_amount(self):
        """Amount not yet allocated to categories"""
        return float(self.total_amount or 0) - float(self.allocated_amount or 0)
    
    @property
    def is_over_budget(self):
        """Check if over budget"""
        return float(self.spent_amount or 0) > float(self.total_amount or 0)
    
    @property
    def days_remaining(self):
        """Days left in budget period"""
        from datetime import date
        delta = self.end_date - date.today()
        return max(0, delta.days)
    
    @property
    def daily_allowance(self):
        """Recommended daily spending for remaining days"""
        if self.days_remaining > 0:
            return round(self.remaining_amount / self.days_remaining, 2)
        return 0


class CategoryBudget(Base):
    """
    Budget allocation for specific categories
    """
    __tablename__ = "category_budgets"
    
    category_budget_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    budget_id = Column(UUID(as_uuid=True), ForeignKey("budgets.budget_id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("expense_categories.category_id", ondelete="CASCADE"), nullable=False)
    
    # Amounts
    allocated_amount = Column(Numeric(12, 2), nullable=False)
    spent_amount = Column(Numeric(12, 2), default=0)
    
    # Settings
    is_flexible = Column(Boolean, default=True)  # Can borrow from other categories
    priority = Column(Integer, default=5)  # 1-10, higher = more important
    
    # Alerts
    alert_at_percentage = Column(Integer, default=80)
    alert_sent = Column(Boolean, default=False)
    
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    budget = relationship("Budget", back_populates="category_budgets")
    category = relationship("ExpenseCategory")
    
    @property
    def remaining_amount(self):
        return float(self.allocated_amount or 0) - float(self.spent_amount or 0)
    
    @property
    def spent_percentage(self):
        if self.allocated_amount and self.allocated_amount > 0:
            return round(float(self.spent_amount or 0) / float(self.allocated_amount) * 100, 1)
        return 0
    
    @property
    def is_over_budget(self):
        return float(self.spent_amount or 0) > float(self.allocated_amount or 0)


class BudgetHistory(Base):
    """
    Track changes to budget spending over time
    """
    __tablename__ = "budget_history"
    
    history_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    budget_id = Column(UUID(as_uuid=True), ForeignKey("budgets.budget_id", ondelete="CASCADE"), nullable=False)
    
    record_date = Column(Date, nullable=False)
    
    # Snapshot
    total_budget = Column(Numeric(12, 2), nullable=False)
    spent_amount = Column(Numeric(12, 2), nullable=False)
    remaining_amount = Column(Numeric(12, 2), nullable=False)
    spent_percentage = Column(Numeric(5, 2), nullable=False)
    
    # Daily stats
    daily_spent = Column(Numeric(12, 2), default=0)
    transaction_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BudgetTemplate(Base):
    """
    Reusable budget templates
    """
    __tablename__ = "budget_templates"
    
    template_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    template_name = Column(String(255), nullable=False)
    description = Column(Text)
    
    budget_type = Column(String(20), nullable=False)  # monthly, weekly
    total_amount = Column(Numeric(12, 2), nullable=False)
    
    # Category allocations as JSON
    # Format: [{"category_id": "uuid", "amount": 500, "percentage": 25}, ...]
    category_allocations = Column(Text)  # JSON string
    
    savings_target_percentage = Column(Numeric(5, 2))
    
    is_default = Column(Boolean, default=False)  # Auto-apply to new periods
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())