# backend/app/models/dependent.py
"""
Dependents Models
Handles financial dependents: humans (family), pets, and shared cost tracking
"""

from sqlalchemy import (
    Column, String, Numeric, Boolean, Integer, 
    Date, DateTime, ForeignKey, Text, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import date

from app.database import Base


class Dependent(Base):
    """
    Financial dependents - people or pets that rely on user financially
    Examples: Brother's education, cats, elderly parent, child
    """
    __tablename__ = "dependents"
    
    dependent_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    # Basic info
    dependent_name = Column(String(255), nullable=False)  # e.g., "My Brother", "Luna (cat)"
    relationship_type = Column(String(50), nullable=False) # brother, sister, parent, child, spouse, pet, other
    
    # Categorization
    dependent_type = Column(String(20), nullable=False)  # human, pet, other
    dependent_category = Column(String(50), nullable=False)  # family_education, pet_care, child_support, elder_care, etc.
    
    # For humans
    date_of_birth = Column(Date)
    age = Column(Integer)  # Can be manually set or calculated
    
    # For pets
    pet_type = Column(String(50))  # cat, dog, bird, etc.
    pet_breed = Column(String(100))
    
    # Financial tracking
    monthly_cost_estimate = Column(Numeric(12, 2))  # Estimated monthly spend
    total_spent_to_date = Column(Numeric(12, 2), default=0)
    
    # Time-bound support (like brother's education)
    support_start_date = Column(Date)
    support_end_date = Column(Date)  # When support is expected to end
    remaining_semesters = Column(Integer)  # For education-specific
    
    # Shared responsibility
    shared_responsibility = Column(Boolean, default=False)  # Is cost shared with someone?
    cost_sharing_partners = Column(ARRAY(String))  # e.g., ["Mom", "Dad"]
    your_share_percentage = Column(Numeric(5, 2), default=100.00)  # Your % of the cost
    partner_contribution_amount = Column(Numeric(12, 2))  # Amount others contribute
    
    # For education specifically
    institution_name = Column(String(255))
    semester_cost = Column(Numeric(12, 2))
    
    # Additional details
    special_needs = Column(Text)  # Any special requirements
    notes = Column(Text)
    
    # Profile image
    profile_image_url = Column(String(500))
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="dependents")
    expenses = relationship("DependentExpense", back_populates="dependent", 
                           cascade="all, delete-orphan", order_by="desc(DependentExpense.expense_date)")
    expense_types = relationship("DependentExpenseType", back_populates="dependent", cascade="all, delete-orphan")
    shared_costs = relationship("DependentSharedCost", back_populates="dependent", cascade="all, delete-orphan")
    
    @property
    def calculated_age(self):
        """Calculate age from date of birth"""
        if not self.date_of_birth:
            return self.age
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    @property
    def support_duration_months(self):
        """Calculate remaining support duration in months"""
        if not self.support_end_date:
            return None
        today = date.today()
        if self.support_end_date <= today:
            return 0
        delta = self.support_end_date - today
        return max(0, delta.days // 30)
    
    @property
    def your_monthly_share(self):
        """Calculate your share of the monthly cost"""
        if not self.monthly_cost_estimate:
            return None
        share_pct = float(self.your_share_percentage or 100)
        return round(float(self.monthly_cost_estimate) * (share_pct / 100), 2)
    
    @property
    def is_time_bound(self):
        """Check if this dependent has a defined end date"""
        return self.support_end_date is not None
    
    @property
    def total_remaining_cost(self):
        """Estimate total remaining cost until support ends"""
        if not self.support_end_date or not self.monthly_cost_estimate:
            return None
        months = self.support_duration_months
        if months is None:
            return None
        return round(self.your_monthly_share * months, 2)


class DependentExpenseType(Base):
    """
    Types of expenses for each dependent
    e.g., Brother: tuition, books, living
    e.g., Cat: food, litter, vet, rent_addition
    """
    __tablename__ = "dependent_expense_types"
    
    type_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dependent_id = Column(UUID(as_uuid=True), ForeignKey("dependents.dependent_id", ondelete="CASCADE"), nullable=False)
    
    type_name = Column(String(100), nullable=False)  # tuition, food, rent_addition, vet, etc.
    description = Column(Text)
    
    # Expected cost patterns
    expected_amount = Column(Numeric(12, 2))
    frequency = Column(String(20))  # monthly, semester, as_needed, annual
    is_recurring = Column(Boolean, default=False)
    
    # For budget allocation
    monthly_budget = Column(Numeric(12, 2))
    
    # Tracking
    total_spent = Column(Numeric(12, 2), default=0)
    last_expense_date = Column(Date)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    dependent = relationship("Dependent", back_populates="expense_types")


class DependentExpense(Base):
    """
    Individual expenses made for a dependent
    """
    __tablename__ = "dependent_expenses"
    
    dependent_expense_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dependent_id = Column(UUID(as_uuid=True), ForeignKey("dependents.dependent_id", ondelete="CASCADE"), nullable=False)
    expense_type_id = Column(UUID(as_uuid=True), ForeignKey("dependent_expense_types.type_id", ondelete="SET NULL"))
    category_id = Column(UUID(as_uuid=True), ForeignKey("expense_categories.category_id", ondelete="SET NULL"))
    
    # Expense details
    expense_name = Column(String(255), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    expense_date = Column(Date, nullable=False)
    
    # For education: semester tracking
    semester = Column(String(50))  # "Fall 2024", "Spring 2025"
    academic_year = Column(String(20))  # "2024-2025"
    
    # Payment details
    payment_method = Column(String(50))
    receipt_url = Column(String(500))
    
    # Shared cost tracking
    is_shared = Column(Boolean, default=False)
    your_share = Column(Numeric(12, 2))  # Your portion
    partner_share = Column(Numeric(12, 2))  # Partner's portion
    
    # Linked to main expense system
    main_expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.expense_id", ondelete="SET NULL"))
    
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    dependent = relationship("Dependent", back_populates="expenses")


class DependentSharedCost(Base):
    """
    Track shared cost agreements and payments with partners
    e.g., Mom pays $6000, you pay $6000 for brother's tuition
    """
    __tablename__ = "dependent_shared_costs"
    
    shared_cost_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dependent_id = Column(UUID(as_uuid=True), ForeignKey("dependents.dependent_id", ondelete="CASCADE"), nullable=False)
    
    # Agreement details
    agreement_name = Column(String(255), nullable=False)  # "Spring 2025 Tuition"
    total_cost = Column(Numeric(12, 2), nullable=False)
    
    # Your portion
    your_contribution = Column(Numeric(12, 2), nullable=False)
    your_contribution_paid = Column(Numeric(12, 2), default=0)
    
    # Partner's portion
    partner_name = Column(String(255), nullable=False)
    partner_contribution = Column(Numeric(12, 2), nullable=False)
    partner_contribution_paid = Column(Numeric(12, 2), default=0)
    
    # Schedule
    due_date = Column(Date)
    payment_period = Column(String(50))  # "Fall 2024", "Q1 2025"
    
    # Monthly allocation planning
    your_monthly_allocation = Column(Numeric(12, 2))  # Fixed monthly amount to save
    months_to_save = Column(Integer)
    
    # Status
    status = Column(String(20), default='pending')  # pending, in_progress, completed
    completed_at = Column(DateTime(timezone=True))
    
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    dependent = relationship("Dependent", back_populates="shared_costs")
    
    @property
    def your_remaining(self):
        """Calculate your remaining amount to pay"""
        return float(self.your_contribution or 0) - float(self.your_contribution_paid or 0)
    
    @property
    def total_paid(self):
        """Calculate total paid so far"""
        return float(self.your_contribution_paid or 0) + float(self.partner_contribution_paid or 0)
    
    @property
    def total_remaining(self):
        """Calculate total remaining"""
        return float(self.total_cost or 0) - self.total_paid
    
    @property
    def completion_percentage(self):
        """Calculate completion percentage"""
        if not self.total_cost or float(self.total_cost) == 0:
            return 0
        return round((self.total_paid / float(self.total_cost)) * 100, 2)


class DependentMonthlySummary(Base):
    """
    Monthly summary of expenses per dependent
    For analytics and tracking
    """
    __tablename__ = "dependent_monthly_summaries"
    
    summary_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dependent_id = Column(UUID(as_uuid=True), ForeignKey("dependents.dependent_id", ondelete="CASCADE"), nullable=False)
    
    # Period
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    
    # Totals
    total_expenses = Column(Numeric(12, 2), default=0)
    expense_count = Column(Integer, default=0)
    
    # Breakdown by type (JSONB)
    expense_breakdown = Column(JSONB)  # {"tuition": 6000, "books": 150}
    
    # Comparison
    vs_budget = Column(Numeric(12, 2))  # Over/under budget
    vs_last_month = Column(Numeric(12, 2))  # Change from last month
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        CheckConstraint('month >= 1 AND month <= 12', name='check_month_range'),
    )