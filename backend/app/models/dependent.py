from sqlalchemy import (
    Column,
    String,
    DECIMAL,
    DateTime,
    Boolean,
    Date,
    Integer,
    ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class Dependent(Base):
    __tablename__ = "dependents"

    dependent_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)

    dependent_name = Column(String(255), nullable=False)

    dependent_relationship = Column(String(50), nullable=False)
    # examples: 'brother', 'sibling', 'pet', 'car'

    dependent_type = Column(String(20), nullable=False)
    dependent_category = Column(String(50), nullable=False)

    date_of_birth = Column(Date)
    age = Column(Integer)

    monthly_cost_estimate = Column(DECIMAL(12, 2))

    # Shared responsibility (e.g. brother's tuition shared with mom)
    shared_responsibility = Column(Boolean, default=False)
    cost_sharing_partners = Column(ARRAY(String))
    partner_contribution_amount = Column(DECIMAL(12, 2))

    special_needs = Column(String)
    notes = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    expenses = relationship(
        "DependentExpense",
        back_populates="dependent",
        cascade="all, delete-orphan"
    )

    shared_costs = relationship(
        "DependentSharedCost",
        back_populates="dependent",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Dependent {self.dependent_name} ({self.dependent_relationship})>"


class DependentExpense(Base):
    __tablename__ = "dependent_expenses"

    dependent_expense_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dependent_id = Column(UUID(as_uuid=True), ForeignKey("dependents.dependent_id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("expense_categories.category_id"))

    expense_name = Column(String(255), nullable=False)
    amount = Column(DECIMAL(12, 2), nullable=False)
    expense_date = Column(Date, nullable=False)

    is_recurring = Column(Boolean, default=False)
    frequency = Column(String(20))

    notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    dependent = relationship("Dependent", back_populates="expenses")

    def __repr__(self):
        return f"<DependentExpense {self.expense_name}: ${self.amount}>"


class DependentSharedCost(Base):
    __tablename__ = "dependent_shared_costs"

    shared_cost_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dependent_id = Column(UUID(as_uuid=True), ForeignKey("dependents.dependent_id"), nullable=False)

    partner_name = Column(String(255), nullable=False)
    total_cost = Column(DECIMAL(12, 2), nullable=False)
    your_contribution = Column(DECIMAL(12, 2), nullable=False)
    partner_contribution = Column(DECIMAL(12, 2), nullable=False)
    payment_date = Column(Date, nullable=False)

    semester = Column(String(50))
    notes = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)

    dependent = relationship("Dependent", back_populates="shared_costs")

    def __repr__(self):
        return f"<SharedCost ${self.total_cost}>"
