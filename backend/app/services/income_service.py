# backend/app/services/income_service.py
"""
Income Service
Business logic for income sources, tax calculations, and payment tracking
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional, Dict
from uuid import UUID
from datetime import date, datetime, timezone
from decimal import Decimal

from app.models.income import IncomeSource, IncomeHistory, TaxBracket
from app.schemas.income import (
    IncomeSourceCreate, IncomeSourceUpdate,
    LogIncomeRequest, IncomeStats, MonthlyIncomeBreakdown,
    StudentJobSetup, ScholarshipSetup
)
from app.core.exceptions import NotFoundError, ValidationError


class IncomeService:
    """Service for managing income sources"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ============================================
    # CRUD OPERATIONS
    # ============================================
    
    def create_income_source(
        self,
        user_id: UUID,
        data: IncomeSourceCreate
    ) -> IncomeSource:
        """Create a new income source"""
        
        income = IncomeSource(
            user_id=user_id,
            source_name=data.source_name,
            source_type=data.source_type.value,
            employer_name=data.employer_name,
            description=data.description,
            pay_structure=data.pay_structure.value,
            pay_rate=data.pay_rate,
            pay_unit=data.pay_unit,
            fixed_amount=data.fixed_amount,
            frequency=data.frequency.value,
            next_payment_date=data.next_payment_date,
            max_hours_per_week=data.max_hours_per_week,
            expected_hours_per_period=data.expected_hours_per_period,
            is_taxable=data.is_taxable,
            tax_rate_federal=data.tax_rate_federal,
            tax_rate_state=data.tax_rate_state,
            tax_rate_local=data.tax_rate_local,
            tax_rate_fica=data.tax_rate_fica,
            tax_withholding_type=data.tax_withholding_type.value,
            is_guaranteed=data.is_guaranteed,
            reliability_score=data.reliability_score,
            start_date=data.start_date,
            end_date=data.end_date,
            notes=data.notes
        )
        
        self.db.add(income)
        self.db.commit()
        self.db.refresh(income)
        
        return income
    
    def get_income_source(
        self,
        income_id: UUID,
        user_id: UUID
    ) -> IncomeSource:
        """Get a single income source"""
        
        income = self.db.query(IncomeSource).filter(
            IncomeSource.income_id == income_id,
            IncomeSource.user_id == user_id
        ).first()
        
        if not income:
            raise NotFoundError(f"Income source {income_id} not found")
        
        return income
    
    def get_user_income_sources(
        self,
        user_id: UUID,
        is_active: Optional[bool] = True,
        source_type: Optional[str] = None,
        is_guaranteed: Optional[bool] = None
    ) -> List[IncomeSource]:
        """Get all income sources for a user"""
        
        query = self.db.query(IncomeSource).filter(
            IncomeSource.user_id == user_id
        )
        
        if is_active is not None:
            query = query.filter(IncomeSource.is_active == is_active)
        
        if source_type:
            query = query.filter(IncomeSource.source_type == source_type)
        
        if is_guaranteed is not None:
            query = query.filter(IncomeSource.is_guaranteed == is_guaranteed)
        
        return query.order_by(IncomeSource.created_at.desc()).all()
    
    def update_income_source(
        self,
        income_id: UUID,
        user_id: UUID,
        data: IncomeSourceUpdate
    ) -> IncomeSource:
        """Update an income source"""
        
        income = self.get_income_source(income_id, user_id)
        
        update_data = data.model_dump(exclude_unset=True)
        
        # Handle enum conversions
        enum_fields = ['source_type', 'pay_structure', 'frequency', 'tax_withholding_type']
        for field in enum_fields:
            if field in update_data and update_data[field]:
                update_data[field] = update_data[field].value
        
        for field, value in update_data.items():
            setattr(income, field, value)
        
        self.db.commit()
        self.db.refresh(income)
        
        return income
    
    def delete_income_source(
        self,
        income_id: UUID,
        user_id: UUID,
        hard_delete: bool = False
    ) -> None:
        """Delete or deactivate an income source"""
        
        income = self.get_income_source(income_id, user_id)
        
        if hard_delete:
            self.db.delete(income)
        else:
            income.is_active = False
        
        self.db.commit()
    
    # ============================================
    # INCOME LOGGING
    # ============================================
    
    def log_income(
        self,
        income_id: UUID,
        user_id: UUID,
        data: LogIncomeRequest
    ) -> tuple[IncomeHistory, IncomeSource]:
        """Log actual income received"""
        
        income = self.get_income_source(income_id, user_id)
        
        # Calculate expected amount
        expected = income.estimated_gross_per_period
        
        # Calculate taxes if requested and not provided
        gross = float(data.gross_amount)
        
        if data.calculate_taxes and income.is_taxable:
            tax_federal = data.tax_federal or Decimal(str(gross * float(income.tax_rate_federal or 0) / 100))
            tax_state = data.tax_state or Decimal(str(gross * float(income.tax_rate_state or 0) / 100))
            tax_local = data.tax_local or Decimal(str(gross * float(income.tax_rate_local or 0) / 100))
            tax_fica = data.tax_fica or Decimal(str(gross * float(income.tax_rate_fica or 0) / 100))
        else:
            tax_federal = data.tax_federal or Decimal('0')
            tax_state = data.tax_state or Decimal('0')
            tax_local = data.tax_local or Decimal('0')
            tax_fica = data.tax_fica or Decimal('0')
        
        other_deductions = data.other_deductions or Decimal('0')
        total_deductions = tax_federal + tax_state + tax_local + tax_fica + other_deductions
        
        # Calculate net if not provided
        net_amount = data.net_amount or (data.gross_amount - total_deductions)
        
        # Calculate variance
        variance = gross - expected if expected else None
        
        history = IncomeHistory(
            income_id=income_id,
            hours_worked=data.hours_worked,
            days_worked=data.days_worked,
            sessions_worked=data.sessions_worked,
            gross_amount=data.gross_amount,
            tax_federal=tax_federal,
            tax_state=tax_state,
            tax_local=tax_local,
            tax_fica=tax_fica,
            other_deductions=other_deductions,
            total_deductions=total_deductions,
            net_amount=net_amount,
            expected_gross=Decimal(str(expected)) if expected else None,
            variance=Decimal(str(variance)) if variance is not None else None,
            payment_date=data.payment_date,
            payment_period_start=data.payment_period_start,
            payment_period_end=data.payment_period_end,
            payment_method=data.payment_method,
            ai_calculated=data.calculate_taxes,
            user_confirmed=not data.calculate_taxes,
            notes=data.notes
        )
        
        self.db.add(history)
        
        # Update next payment date
        if data.update_next_payment:
            income.next_payment_date = income.calculate_next_payment_date(data.payment_date)
        
        self.db.commit()
        self.db.refresh(history)
        self.db.refresh(income)
        
        return history, income
    
    def get_income_history(
        self,
        income_id: UUID,
        user_id: UUID,
        limit: int = 50
    ) -> List[IncomeHistory]:
        """Get payment history for an income source"""
        
        # Verify ownership
        self.get_income_source(income_id, user_id)
        
        return self.db.query(IncomeHistory).filter(
            IncomeHistory.income_id == income_id
        ).order_by(
            IncomeHistory.payment_date.desc()
        ).limit(limit).all()
    
    def confirm_income(
        self,
        history_id: UUID,
        user_id: UUID,
        actual_net: Optional[Decimal] = None
    ) -> IncomeHistory:
        """Confirm or correct an AI-calculated income entry"""
        
        history = self.db.query(IncomeHistory).filter(
            IncomeHistory.history_id == history_id
        ).first()
        
        if not history:
            raise NotFoundError(f"Income history {history_id} not found")
        
        # Verify ownership through income source
        self.get_income_source(history.income_id, user_id)
        
        history.user_confirmed = True
        
        if actual_net and actual_net != history.net_amount:
            history.user_corrected = True
            history.net_amount = actual_net
            # Recalculate total deductions
            history.total_deductions = history.gross_amount - actual_net
        
        self.db.commit()
        self.db.refresh(history)
        
        return history
    
    # ============================================
    # STATISTICS
    # ============================================
    
    def get_stats(self, user_id: UUID) -> IncomeStats:
        """Get income statistics"""
        
        sources = self.get_user_income_sources(user_id, is_active=True)
        
        total_monthly_gross = sum(s.estimated_monthly_gross for s in sources)
        total_monthly_net = sum(s.estimated_monthly_net for s in sources)
        
        guaranteed = [s for s in sources if s.is_guaranteed]
        variable = [s for s in sources if not s.is_guaranteed]
        
        guaranteed_monthly = sum(s.estimated_monthly_net for s in guaranteed)
        variable_monthly = sum(s.estimated_monthly_net for s in variable)
        
        # Calculate average effective tax rate
        if total_monthly_gross > 0:
            avg_tax_rate = ((total_monthly_gross - total_monthly_net) / total_monthly_gross) * 100
        else:
            avg_tax_rate = 0
        
        # By type breakdown
        by_type: Dict[str, float] = {}
        for s in sources:
            t = s.source_type
            by_type[t] = by_type.get(t, 0) + s.estimated_monthly_net
        
        # By source breakdown
        by_source: Dict[str, float] = {}
        for s in sources:
            by_source[s.source_name] = s.estimated_monthly_net
        
        return IncomeStats(
            total_monthly_gross=Decimal(str(round(total_monthly_gross, 2))),
            total_monthly_net=Decimal(str(round(total_monthly_net, 2))),
            total_annual_gross=Decimal(str(round(total_monthly_gross * 12, 2))),
            total_annual_net=Decimal(str(round(total_monthly_net * 12, 2))),
            guaranteed_monthly=Decimal(str(round(guaranteed_monthly, 2))),
            variable_monthly=Decimal(str(round(variable_monthly, 2))),
            active_sources_count=len(sources),
            average_effective_tax_rate=round(avg_tax_rate, 2),
            by_type={k: round(v, 2) for k, v in by_type.items()},
            by_source={k: round(v, 2) for k, v in by_source.items()}
        )
    
    def get_monthly_breakdown(
        self,
        user_id: UUID,
        year: int,
        month: int
    ) -> MonthlyIncomeBreakdown:
        """Get actual income received in a month"""
        
        # Get all income history for the month
        history = self.db.query(IncomeHistory).join(
            IncomeSource
        ).filter(
            IncomeSource.user_id == user_id,
            extract('year', IncomeHistory.payment_date) == year,
            extract('month', IncomeHistory.payment_date) == month
        ).all()
        
        total_gross = sum(float(h.gross_amount) for h in history)
        total_net = sum(float(h.net_amount) for h in history)
        total_taxes = sum(float(h.total_deductions or 0) for h in history)
        
        # By source
        by_source: Dict[str, float] = {}
        for h in history:
            source = self.db.query(IncomeSource).filter(
                IncomeSource.income_id == h.income_id
            ).first()
            if source:
                name = source.source_name
                by_source[name] = by_source.get(name, 0) + float(h.net_amount)
        
        return MonthlyIncomeBreakdown(
            year=year,
            month=month,
            total_gross=Decimal(str(round(total_gross, 2))),
            total_net=Decimal(str(round(total_net, 2))),
            total_taxes=Decimal(str(round(total_taxes, 2))),
            by_source={k: round(v, 2) for k, v in by_source.items()}
        )
    
    # ============================================
    # QUICK SETUP HELPERS
    # ============================================
    
    def setup_student_job(
        self,
        user_id: UUID,
        data: StudentJobSetup
    ) -> IncomeSource:
        """Quick setup for a student job"""
        
        # Calculate expected hours per biweekly period
        if data.frequency == 'biweekly':
            hours_per_period = float(data.expected_hours_per_week) * 2
        elif data.frequency == 'weekly':
            hours_per_period = float(data.expected_hours_per_week)
        else:
            hours_per_period = float(data.expected_hours_per_week) * 4.33
        
        create_data = IncomeSourceCreate(
            source_name=data.job_name,
            source_type='job',
            employer_name=data.employer_name,
            pay_structure='hourly',
            pay_rate=data.hourly_rate,
            pay_unit='hour',
            frequency=data.frequency,
            max_hours_per_week=data.max_hours_per_week,
            expected_hours_per_period=Decimal(str(hours_per_period)),
            is_taxable=True,
            tax_rate_federal=data.federal_tax_rate,
            tax_rate_state=data.state_tax_rate,
            tax_rate_fica=Decimal('7.65'),
            tax_withholding_type='w2',
            is_guaranteed=True,
            start_date=data.start_date
        )
        
        return self.create_income_source(user_id, create_data)
    
    def setup_scholarship(
        self,
        user_id: UUID,
        data: ScholarshipSetup
    ) -> IncomeSource:
        """Quick setup for a scholarship"""
        
        create_data = IncomeSourceCreate(
            source_name=data.scholarship_name,
            source_type='scholarship',
            employer_name=data.institution_name,
            description=f"Covers: {', '.join(data.covers)}",
            pay_structure='fixed',
            fixed_amount=data.semester_amount,
            frequency='semester',
            is_taxable=False,  # Most scholarships for tuition/room/board aren't taxable
            is_guaranteed=True,
            reliability_score=Decimal('1.0'),
            start_date=data.start_date
        )
        
        return self.create_income_source(user_id, create_data)