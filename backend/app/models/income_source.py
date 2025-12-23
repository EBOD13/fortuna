from sqlalchemy import Column, String, DECIMAL, DateTime, Boolean, Date, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base

class IncomeSource(Base):
    __tablename__ = "income_sources"
    
    income_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    source_name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)
    
    # Pay structure
    pay_structure = Column(String(20), nullable=False)
    pay_rate = Column(DECIMAL(10, 2))
    pay_unit = Column(String(20))
    
    amount = Column(DECIMAL(12, 2), nullable=False)
    frequency = Column(String(20), nullable=False)
    next_payment_date = Column(Date)
    
    max_hours_per_week = Column(Integer)
    
    # Tax rates
    tax_rate_federal = Column(DECIMAL(5, 2))
    tax_rate_state = Column(DECIMAL(5, 2))
    tax_rate_city = Column(DECIMAL(5, 2))
    tax_rate_fica = Column(DECIMAL(5, 2), default=7.65)
    
    is_recurring = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    
    notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<IncomeSource {self.source_name}>"