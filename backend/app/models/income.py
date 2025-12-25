# backend/app/models/income.py
"""
Income Models
Track multiple income sources with different pay structures and tax calculations
"""

from sqlalchemy import (
    Column, String, Numeric, Boolean, Integer,
    Date, DateTime, ForeignKey, Text, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, date, timedelta
from dateutil.relativedelta import relativedelta
from decimal import Decimal
import uuid

from app.database import Base


class IncomeSource(Base):
    """
    Income sources - jobs, scholarships, stipends, etc.
    Supports different pay structures: hourly, salary, fixed amount
    """
    __tablename__ = "income_sources"
    
    income_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    # Basic info
    source_name = Column(String(255), nullable=False)  # "IT Job", "Engineering Pathways", "Scholarship"
    source_type = Column(String(50), nullable=False)  # job, scholarship, stipend, freelance, other
    employer_name = Column(String(255))  # Company/institution name
    description = Column(Text)
    
    # Pay structure
    pay_structure = Column(String(20), nullable=False)  # hourly, salary, fixed, per_session
    pay_rate = Column(Numeric(10, 2))  # Rate per unit (hourly rate, session rate, etc.)
    pay_unit = Column(String(20))  # hour, day, session, month, semester
    
    # For fixed amounts (like scholarship)
    fixed_amount = Column(Numeric(12, 2))  # Fixed amount per period
    
    # Payment frequency
    frequency = Column(String(20), nullable=False)  # weekly, biweekly, monthly, semester, one_time
    next_payment_date = Column(Date)
    
    # Work constraints (for hourly jobs)
    max_hours_per_week = Column(Integer)  # e.g., 20 hours for student jobs
    expected_hours_per_period = Column(Numeric(5, 2))  # Expected hours per pay period
    
    # Tax information
    is_taxable = Column(Boolean, default=True)
    tax_rate_federal = Column(Numeric(5, 2))
    tax_rate_state = Column(Numeric(5, 2))
    tax_rate_local = Column(Numeric(5, 2))
    tax_rate_fica = Column(Numeric(5, 2), default=7.65)  # Social Security + Medicare
    
    # For W-2 vs 1099
    tax_withholding_type = Column(String(20), default='w2')  # w2, 1099, none
    
    # Reliability scoring for budgeting
    is_guaranteed = Column(Boolean, default=True)  # Scholarship vs freelance
    reliability_score = Column(Numeric(3, 2), default=1.0)  # 0.00 - 1.00
    
    # Status
    is_active = Column(Boolean, default=True)
    start_date = Column(Date)
    end_date = Column(Date)  # For time-limited income like scholarships
    
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="income_sources")
    history = relationship("IncomeHistory", back_populates="income_source",
                          cascade="all, delete-orphan", order_by="desc(IncomeHistory.payment_date)")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('max_hours_per_week IS NULL OR max_hours_per_week > 0', name='check_max_hours'),
        CheckConstraint('reliability_score >= 0 AND reliability_score <= 1', name='check_reliability'),
    )
    
    @property
    def total_tax_rate(self):
        """Calculate total tax rate"""
        federal = float(self.tax_rate_federal or 0)
        state = float(self.tax_rate_state or 0)
        local = float(self.tax_rate_local or 0)
        fica = float(self.tax_rate_fica or 0) if self.is_taxable else 0
        return federal + state + local + fica
    
    @property
    def estimated_gross_per_period(self):
        """Estimate gross income per pay period"""
        if self.pay_structure == 'fixed':
            return float(self.fixed_amount or 0)
        elif self.pay_structure == 'hourly':
            hours = float(self.expected_hours_per_period or 0)
            rate = float(self.pay_rate or 0)
            return hours * rate
        elif self.pay_structure == 'salary':
            # Salary broken into pay periods
            annual = float(self.pay_rate or 0)
            if self.frequency == 'weekly':
                return annual / 52
            elif self.frequency == 'biweekly':
                return annual / 26
            elif self.frequency == 'monthly':
                return annual / 12
            return annual
        elif self.pay_structure == 'per_session':
            return float(self.pay_rate or 0)
        return 0
    
    @property
    def estimated_net_per_period(self):
        """Estimate net income after taxes"""
        gross = self.estimated_gross_per_period
        if not self.is_taxable:
            return gross
        tax_rate = self.total_tax_rate / 100
        return round(gross * (1 - tax_rate), 2)
    
    @property
    def estimated_monthly_gross(self):
        """Estimate monthly gross income"""
        gross = self.estimated_gross_per_period
        if self.frequency == 'weekly':
            return gross * 4.33
        elif self.frequency == 'biweekly':
            return gross * 2.17
        elif self.frequency == 'monthly':
            return gross
        elif self.frequency == 'semester':
            return gross / 4  # Roughly 4 months per semester
        return gross
    
    @property
    def estimated_monthly_net(self):
        """Estimate monthly net income"""
        monthly_gross = self.estimated_monthly_gross
        if not self.is_taxable:
            return round(monthly_gross, 2)
        tax_rate = self.total_tax_rate / 100
        return round(monthly_gross * (1 - tax_rate), 2)
    
    def calculate_next_payment_date(self, from_date=None):
        """Calculate next payment date based on frequency"""
        from_date = from_date or self.next_payment_date or date.today()
        
        if self.frequency == 'weekly':
            return from_date + timedelta(weeks=1)
        elif self.frequency == 'biweekly':
            return from_date + timedelta(weeks=2)
        elif self.frequency == 'monthly':
            return from_date + relativedelta(months=1)
        elif self.frequency == 'semester':
            return from_date + relativedelta(months=4)
        
        return from_date


class IncomeHistory(Base):
    """
    Actual income received - tracks payments with tax breakdowns
    Used for accurate tracking and AI learning
    """
    __tablename__ = "income_history"
    
    history_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    income_id = Column(UUID(as_uuid=True), ForeignKey("income_sources.income_id", ondelete="CASCADE"), nullable=False)
    
    # Work logged (for hourly/session based)
    hours_worked = Column(Numeric(5, 2))
    days_worked = Column(Numeric(5, 2))
    sessions_worked = Column(Integer)
    
    # Payment breakdown
    gross_amount = Column(Numeric(12, 2), nullable=False)
    
    # Tax deductions
    tax_federal = Column(Numeric(12, 2), default=0)
    tax_state = Column(Numeric(12, 2), default=0)
    tax_local = Column(Numeric(12, 2), default=0)
    tax_fica = Column(Numeric(12, 2), default=0)
    other_deductions = Column(Numeric(12, 2), default=0)
    total_deductions = Column(Numeric(12, 2))
    
    net_amount = Column(Numeric(12, 2), nullable=False)
    
    # Comparison to expected
    expected_gross = Column(Numeric(12, 2))
    variance = Column(Numeric(12, 2))  # Actual - Expected
    
    # Payment details
    payment_date = Column(Date, nullable=False)
    payment_period_start = Column(Date)
    payment_period_end = Column(Date)
    payment_method = Column(String(50))  # direct_deposit, check, cash
    
    # AI tracking
    ai_calculated = Column(Boolean, default=False)  # Was this pre-calculated by AI?
    user_confirmed = Column(Boolean, default=False)  # Did user confirm the amount?
    user_corrected = Column(Boolean, default=False)  # Did user correct AI calculation?
    
    notes = Column(Text)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    income_source = relationship("IncomeSource", back_populates="history")
    
    @property
    def effective_tax_rate(self):
        """Calculate effective tax rate for this payment"""
        if not self.gross_amount or float(self.gross_amount) == 0:
            return 0
        total_tax = float(self.total_deductions or 0)
        return round((total_tax / float(self.gross_amount)) * 100, 2)


class TaxBracket(Base):
    """
    Tax brackets for different jurisdictions
    Used for income tax calculations
    """
    __tablename__ = "tax_brackets"
    
    bracket_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Jurisdiction
    country = Column(String(100), default='United States')
    state = Column(String(100))
    locality = Column(String(100))
    
    # Bracket details
    tax_year = Column(Integer, nullable=False)
    bracket_type = Column(String(20), nullable=False)  # federal, state, local, fica
    
    # Income range
    min_income = Column(Numeric(12, 2), nullable=False)
    max_income = Column(Numeric(12, 2))  # NULL for top bracket
    
    # Rate
    rate = Column(Numeric(5, 2), nullable=False)  # Percentage
    
    # Filing status
    filing_status = Column(String(20), default='single')  # single, married_joint, married_separate, head_of_household
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))