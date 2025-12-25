# backend/app/models/recurring_expense.py
"""
Recurring Expenses Models
Handles bills, subscriptions, and variable recurring costs
"""

from sqlalchemy import (
    Column, String, Numeric, Boolean, Integer, 
    Date, DateTime, ForeignKey, Text, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

from app.database import Base


class RecurringExpense(Base):
    """
    Recurring expenses like bills, subscriptions, and regular payments
    Supports both fixed and variable amounts
    """
    __tablename__ = "recurring_expenses"
    
    recurring_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("expense_categories.category_id", ondelete="SET NULL"))
    
    # Basic info
    expense_name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Amount handling (supports variable bills like utilities)
    base_amount = Column(Numeric(12, 2), nullable=False)  # Expected/estimated amount
    is_variable = Column(Boolean, default=False)  # True for utilities, etc.
    min_amount = Column(Numeric(12, 2))  # For variable expenses
    max_amount = Column(Numeric(12, 2))  # For variable expenses
    avg_amount = Column(Numeric(12, 2))  # Running average (calculated)
    
    # Frequency settings
    frequency = Column(String(20), nullable=False)  # daily, weekly, biweekly, monthly, quarterly, semi-annual, annual
    frequency_interval = Column(Integer, default=1)  # Every N periods (e.g., every 2 months)
    
    # Schedule
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)  # NULL = ongoing
    next_due_date = Column(Date, nullable=False)
    
    # Day preferences for monthly+ frequencies
    preferred_day = Column(Integer)  # Day of month (1-28)
    
    # Payment details
    auto_pay = Column(Boolean, default=False)
    payment_method = Column(String(50))  # credit_card, debit_card, bank_transfer, cash
    
    # Provider info
    provider_name = Column(String(255))
    provider_website = Column(String(500))
    account_number = Column(String(100))  # Masked/encrypted
    
    # Reminder settings
    reminder_enabled = Column(Boolean, default=True)
    reminder_days_before = Column(Integer, default=3)
    
    # Categories for special handling
    expense_type = Column(String(50), default='bill')  # bill, subscription, insurance, loan, rent, utility, other
    is_essential = Column(Boolean, default=True)  # Essential vs discretionary
    
    # Notes and tags
    notes = Column(Text)
    tags = Column(ARRAY(String))
    
    # Status
    is_active = Column(Boolean, default=True)
    paused_until = Column(Date)  # For temporary pauses
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="recurring_expenses")
    history = relationship("RecurringExpenseHistory", back_populates="recurring_expense", 
                          cascade="all, delete-orphan", order_by="desc(RecurringExpenseHistory.payment_date)")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('preferred_day IS NULL OR (preferred_day >= 1 AND preferred_day <= 28)', 
                       name='check_preferred_day'),
        CheckConstraint('reminder_days_before >= 0 AND reminder_days_before <= 30', 
                       name='check_reminder_days'),
    )
    
    @property
    def is_due_soon(self):
        """Check if bill is due within reminder period"""
        if not self.next_due_date or not self.reminder_days_before:
            return False
        days_until = (self.next_due_date - date.today()).days
        return 0 <= days_until <= self.reminder_days_before
    
    @property
    def is_overdue(self):
        """Check if bill is past due"""
        if not self.next_due_date:
            return False
        return self.next_due_date < date.today()
    
    @property
    def days_until_due(self):
        """Days until next payment"""
        if not self.next_due_date:
            return None
        return (self.next_due_date - date.today()).days
    
    @property
    def expected_amount(self):
        """Get the expected amount (avg for variable, base for fixed)"""
        if self.is_variable and self.avg_amount:
            return float(self.avg_amount)
        return float(self.base_amount)
    
    @property
    def monthly_equivalent(self):
        """Calculate monthly cost equivalent"""
        amount = self.expected_amount
        freq_multipliers = {
            'daily': 30,
            'weekly': 4.33,
            'biweekly': 2.17,
            'monthly': 1,
            'quarterly': 0.33,
            'semi-annual': 0.167,
            'annual': 0.083
        }
        multiplier = freq_multipliers.get(self.frequency, 1)
        return round(amount * multiplier / (self.frequency_interval or 1), 2)
    
    @property
    def annual_cost(self):
        """Calculate annual cost"""
        return round(self.monthly_equivalent * 12, 2)
    
    @property
    def variance_percentage(self):
        """For variable expenses, calculate variance from base"""
        if not self.is_variable or not self.avg_amount or not self.base_amount:
            return None
        base = float(self.base_amount)
        if base == 0:
            return None
        return round(((float(self.avg_amount) - base) / base) * 100, 2)
    
    def calculate_next_due_date(self, from_date=None):
        """Calculate the next due date based on frequency"""
        from_date = from_date or self.next_due_date or date.today()
        interval = self.frequency_interval or 1
        
        if self.frequency == 'daily':
            return from_date + timedelta(days=interval)
        elif self.frequency == 'weekly':
            return from_date + timedelta(weeks=interval)
        elif self.frequency == 'biweekly':
            return from_date + timedelta(weeks=2 * interval)
        elif self.frequency == 'monthly':
            new_date = from_date + relativedelta(months=interval)
            if self.preferred_day:
                try:
                    new_date = new_date.replace(day=self.preferred_day)
                except ValueError:
                    # Handle months with fewer days
                    new_date = new_date.replace(day=28)
            return new_date
        elif self.frequency == 'quarterly':
            return from_date + relativedelta(months=3 * interval)
        elif self.frequency == 'semi-annual':
            return from_date + relativedelta(months=6 * interval)
        elif self.frequency == 'annual':
            return from_date + relativedelta(years=interval)
        
        return from_date + relativedelta(months=interval)


class RecurringExpenseHistory(Base):
    """
    Payment history for recurring expenses
    Tracks actual payments vs expected
    """
    __tablename__ = "recurring_expense_history"
    
    history_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recurring_id = Column(UUID(as_uuid=True), ForeignKey("recurring_expenses.recurring_id", ondelete="CASCADE"), nullable=False)
    
    # Payment details
    amount_paid = Column(Numeric(12, 2), nullable=False)
    expected_amount = Column(Numeric(12, 2))
    variance = Column(Numeric(12, 2))  # amount_paid - expected_amount
    variance_percentage = Column(Numeric(5, 2))
    
    payment_date = Column(Date, nullable=False)
    due_date = Column(Date)  # The scheduled due date
    
    # Payment status
    was_on_time = Column(Boolean, default=True)
    days_late = Column(Integer, default=0)
    
    # Payment method used
    payment_method = Column(String(50))
    confirmation_number = Column(String(100))
    
    # Linked expense (if created)
    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.expense_id", ondelete="SET NULL"))
    
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    recurring_expense = relationship("RecurringExpense", back_populates="history")


class UpcomingBill(Base):
    """
    Materialized view-like table for upcoming bills
    Updated by scheduled task for quick dashboard queries
    """
    __tablename__ = "upcoming_bills"
    
    bill_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    recurring_id = Column(UUID(as_uuid=True), ForeignKey("recurring_expenses.recurring_id", ondelete="CASCADE"), nullable=False)
    
    expense_name = Column(String(255), nullable=False)
    expected_amount = Column(Numeric(12, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    
    # Quick status flags
    is_overdue = Column(Boolean, default=False)
    is_due_soon = Column(Boolean, default=False)  # Within 7 days
    days_until_due = Column(Integer)
    
    # For display
    provider_name = Column(String(255))
    expense_type = Column(String(50))
    is_essential = Column(Boolean, default=True)
    auto_pay = Column(Boolean, default=False)
    
    # Refresh tracking
    last_refreshed = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        {'info': {'is_view': True}}  # Mark as view-like for migrations
    )