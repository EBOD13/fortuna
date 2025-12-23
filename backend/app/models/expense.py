from sqlalchemy import Column, String, DECIMAL, DateTime, Boolean, Date, ForeignKey, Time
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base

class Expense(Base):
    __tablename__ = "expenses"
    
    expense_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("expense_categories.category_id"))
    
    expense_name = Column(String(255), nullable=False)
    amount = Column(DECIMAL(12, 2), nullable=False)
    expense_date = Column(Date, nullable=False)
    expense_time = Column(Time)
    
    payment_method = Column(String(50))
    merchant_name = Column(String(255))
    location = Column(String(255))
    
    is_recurring = Column(Boolean, default=False)
    recurrence_frequency = Column(String(20))
    
    tags = Column(ARRAY(String))
    notes = Column(String)
    
    logged_immediately = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship("ExpenseCategory", back_populates="expenses")
    
    def __repr__(self):
        return f"<Expense {self.expense_name}: ${self.amount}>"