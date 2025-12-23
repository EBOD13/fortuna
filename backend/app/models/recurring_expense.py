from sqlalchemy import Column, String, DECIMAL, DateTime, Boolean, Date, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base

class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"
    
    recurring_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("expense_categories.category_id"))
    
    expense_name = Column(String(255), nullable=False)
    
    # Amount handling
    base_amount = Column(DECIMAL(12, 2), nullable=False)
    is_variable = Column(Boolean, default=False)  # TRUE for utilities
    min_amount = Column(DECIMAL(12, 2))
    max_amount = Column(DECIMAL(12, 2))
    avg_amount = Column(DECIMAL(12, 2))
    
    frequency = Column(String(20), nullable=False)  # 'monthly', 'yearly', etc.
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    next_due_date = Column(Date, nullable=False)
    
    auto_pay = Column(Boolean, default=False)
    payment_method = Column(String(50))
    provider_name = Column(String(255))
    account_number = Column(String(100))
    
    notes = Column(String)
    reminder_days_before = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    history = relationship("RecurringExpenseHistory", back_populates="recurring_expense", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<RecurringExpense {self.expense_name}: ${self.base_amount}>"

class RecurringExpenseHistory(Base):
    __tablename__ = "recurring_expense_history"
    
    history_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recurring_id = Column(UUID(as_uuid=True), ForeignKey("recurring_expenses.recurring_id"), nullable=False)
    
    amount_paid = Column(DECIMAL(12, 2), nullable=False)
    expected_amount = Column(DECIMAL(12, 2))
    variance = Column(DECIMAL(12, 2))
    payment_date = Column(Date, nullable=False)
    
    notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    recurring_expense = relationship("RecurringExpense", back_populates="history")
    
    def __repr__(self):
        return f"<Payment ${self.amount_paid} on {self.payment_date}>"