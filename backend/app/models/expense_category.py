from sqlalchemy import Column, String, Boolean, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.database import Base

class ExpenseCategory(Base):
    __tablename__ = "expense_categories"
    
    category_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    category_name = Column(String(100), nullable=False)
    category_type = Column(String(20), nullable=False)
    is_essential = Column(Boolean, default=True)
    monthly_budget = Column(DECIMAL(12, 2))
    icon = Column(String(50))
    
    # Relationships
    expenses = relationship("Expense", back_populates="category")
    
    def __repr__(self):
        return f"<ExpenseCategory {self.category_name}>"