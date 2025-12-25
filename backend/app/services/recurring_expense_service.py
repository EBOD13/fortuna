# backend/app/services/recurring_expense_service.py
"""
Recurring Expense Service
Business logic for recurring expenses, bills, and subscriptions
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import date, datetime, timedelta
from decimal import Decimal
import statistics

from app.models.recurring_expense import (
    RecurringExpense, RecurringExpenseHistory, UpcomingBill
)
from app.schemas.recurring_expense import (
    RecurringExpenseCreate, RecurringExpenseUpdate,
    RecordPaymentRequest, RecurringExpenseStats,
    MonthlyRecurringBreakdown, VariableExpenseAnalysis
)
from app.core.exceptions import NotFoundError, ValidationError


class RecurringExpenseService:
    """Service for managing recurring expenses"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ============================================
    # CRUD OPERATIONS
    # ============================================
    
    def create_recurring_expense(
        self, 
        user_id: UUID, 
        data: RecurringExpenseCreate
    ) -> RecurringExpense:
        """Create a new recurring expense"""
        
        expense = RecurringExpense(
            user_id=user_id,
            expense_name=data.expense_name,
            description=data.description,
            category_id=data.category_id,
            base_amount=data.base_amount,
            is_variable=data.is_variable,
            min_amount=data.min_amount,
            max_amount=data.max_amount,
            frequency=data.frequency.value,
            frequency_interval=data.frequency_interval,
            start_date=data.start_date,
            end_date=data.end_date,
            next_due_date=data.next_due_date,
            preferred_day=data.preferred_day,
            auto_pay=data.auto_pay,
            payment_method=data.payment_method.value if data.payment_method else None,
            provider_name=data.provider_name,
            provider_website=data.provider_website,
            account_number=data.account_number,
            reminder_enabled=data.reminder_enabled,
            reminder_days_before=data.reminder_days_before,
            expense_type=data.expense_type.value,
            is_essential=data.is_essential,
            notes=data.notes,
            tags=data.tags
        )
        
        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        
        return expense
    
    def get_recurring_expense(
        self, 
        recurring_id: UUID, 
        user_id: UUID
    ) -> RecurringExpense:
        """Get a single recurring expense by ID"""
        
        expense = self.db.query(RecurringExpense).filter(
            RecurringExpense.recurring_id == recurring_id,
            RecurringExpense.user_id == user_id
        ).first()
        
        if not expense:
            raise NotFoundError(f"Recurring expense {recurring_id} not found")
        
        return expense
    
    def get_user_recurring_expenses(
        self,
        user_id: UUID,
        is_active: Optional[bool] = True,
        expense_type: Optional[str] = None,
        is_essential: Optional[bool] = None,
        order_by: str = "next_due_date"
    ) -> List[RecurringExpense]:
        """Get all recurring expenses for a user with optional filters"""
        
        query = self.db.query(RecurringExpense).filter(
            RecurringExpense.user_id == user_id
        )
        
        if is_active is not None:
            query = query.filter(RecurringExpense.is_active == is_active)
        
        if expense_type:
            query = query.filter(RecurringExpense.expense_type == expense_type)
        
        if is_essential is not None:
            query = query.filter(RecurringExpense.is_essential == is_essential)
        
        # Ordering
        if order_by == "next_due_date":
            query = query.order_by(RecurringExpense.next_due_date.asc())
        elif order_by == "amount":
            query = query.order_by(RecurringExpense.base_amount.desc())
        elif order_by == "name":
            query = query.order_by(RecurringExpense.expense_name.asc())
        elif order_by == "created":
            query = query.order_by(RecurringExpense.created_at.desc())
        
        return query.all()
    
    def update_recurring_expense(
        self,
        recurring_id: UUID,
        user_id: UUID,
        data: RecurringExpenseUpdate
    ) -> RecurringExpense:
        """Update an existing recurring expense"""
        
        expense = self.get_recurring_expense(recurring_id, user_id)
        
        update_data = data.model_dump(exclude_unset=True)
        
        # Handle enum conversions
        if 'frequency' in update_data and update_data['frequency']:
            update_data['frequency'] = update_data['frequency'].value
        if 'payment_method' in update_data and update_data['payment_method']:
            update_data['payment_method'] = update_data['payment_method'].value
        if 'expense_type' in update_data and update_data['expense_type']:
            update_data['expense_type'] = update_data['expense_type'].value
        
        for field, value in update_data.items():
            setattr(expense, field, value)
        
        self.db.commit()
        self.db.refresh(expense)
        
        return expense
    
    def delete_recurring_expense(
        self,
        recurring_id: UUID,
        user_id: UUID,
        hard_delete: bool = False
    ) -> None:
        """Delete or deactivate a recurring expense"""
        
        expense = self.get_recurring_expense(recurring_id, user_id)
        
        if hard_delete:
            self.db.delete(expense)
        else:
            expense.is_active = False
        
        self.db.commit()
    
    # ============================================
    # PAYMENT TRACKING
    # ============================================
    
    def record_payment(
        self,
        recurring_id: UUID,
        user_id: UUID,
        data: RecordPaymentRequest
    ) -> tuple[RecurringExpenseHistory, RecurringExpense]:
        """Record a payment for a recurring expense"""
        
        expense = self.get_recurring_expense(recurring_id, user_id)
        
        # Calculate variance
        expected = float(expense.expected_amount)
        actual = float(data.amount_paid)
        variance = actual - expected
        variance_pct = ((actual - expected) / expected * 100) if expected > 0 else 0
        
        # Check if on time
        was_on_time = data.payment_date <= expense.next_due_date
        days_late = 0 if was_on_time else (data.payment_date - expense.next_due_date).days
        
        # Create history record
        history = RecurringExpenseHistory(
            recurring_id=recurring_id,
            amount_paid=data.amount_paid,
            expected_amount=Decimal(str(expected)),
            variance=Decimal(str(variance)),
            variance_percentage=Decimal(str(round(variance_pct, 2))),
            payment_date=data.payment_date,
            due_date=expense.next_due_date,
            was_on_time=was_on_time,
            days_late=days_late,
            payment_method=data.payment_method.value if data.payment_method else expense.payment_method,
            confirmation_number=data.confirmation_number,
            notes=data.notes
        )
        
        self.db.add(history)
        
        # Update average for variable expenses
        if expense.is_variable:
            self._update_average(expense)
        
        # Update next due date
        if data.update_next_due:
            expense.next_due_date = expense.calculate_next_due_date()
        
        self.db.commit()
        self.db.refresh(history)
        self.db.refresh(expense)
        
        return history, expense
    
    def _update_average(self, expense: RecurringExpense) -> None:
        """Update running average for variable expenses"""
        
        # Get last 12 payments
        recent_payments = self.db.query(RecurringExpenseHistory).filter(
            RecurringExpenseHistory.recurring_id == expense.recurring_id
        ).order_by(
            RecurringExpenseHistory.payment_date.desc()
        ).limit(12).all()
        
        if recent_payments:
            amounts = [float(p.amount_paid) for p in recent_payments]
            expense.avg_amount = Decimal(str(round(statistics.mean(amounts), 2)))
    
    def get_payment_history(
        self,
        recurring_id: UUID,
        user_id: UUID,
        limit: int = 50
    ) -> List[RecurringExpenseHistory]:
        """Get payment history for a recurring expense"""
        
        # Verify ownership
        self.get_recurring_expense(recurring_id, user_id)
        
        return self.db.query(RecurringExpenseHistory).filter(
            RecurringExpenseHistory.recurring_id == recurring_id
        ).order_by(
            RecurringExpenseHistory.payment_date.desc()
        ).limit(limit).all()
    
    # ============================================
    # UPCOMING BILLS
    # ============================================
    
    def get_upcoming_bills(
        self,
        user_id: UUID,
        days_ahead: int = 30,
        include_overdue: bool = True
    ) -> List[RecurringExpense]:
        """Get bills due within the specified number of days"""
        
        today = date.today()
        future_date = today + timedelta(days=days_ahead)
        
        query = self.db.query(RecurringExpense).filter(
            RecurringExpense.user_id == user_id,
            RecurringExpense.is_active == True
        )
        
        if include_overdue:
            query = query.filter(
                RecurringExpense.next_due_date <= future_date
            )
        else:
            query = query.filter(
                RecurringExpense.next_due_date >= today,
                RecurringExpense.next_due_date <= future_date
            )
        
        return query.order_by(RecurringExpense.next_due_date.asc()).all()
    
    def get_overdue_bills(self, user_id: UUID) -> List[RecurringExpense]:
        """Get all overdue bills"""
        
        today = date.today()
        
        return self.db.query(RecurringExpense).filter(
            RecurringExpense.user_id == user_id,
            RecurringExpense.is_active == True,
            RecurringExpense.next_due_date < today
        ).order_by(
            RecurringExpense.next_due_date.asc()
        ).all()
    
    def get_bills_due_on_date(
        self,
        user_id: UUID,
        target_date: date
    ) -> List[RecurringExpense]:
        """Get bills due on a specific date"""
        
        return self.db.query(RecurringExpense).filter(
            RecurringExpense.user_id == user_id,
            RecurringExpense.is_active == True,
            RecurringExpense.next_due_date == target_date
        ).all()
    
    # ============================================
    # STATISTICS & ANALYTICS
    # ============================================
    
    def get_stats(self, user_id: UUID) -> RecurringExpenseStats:
        """Get statistics for recurring expenses"""
        
        expenses = self.get_user_recurring_expenses(user_id, is_active=True)
        
        total_monthly = sum(e.monthly_equivalent for e in expenses)
        total_annual = sum(e.annual_cost for e in expenses)
        
        essential = [e for e in expenses if e.is_essential]
        discretionary = [e for e in expenses if not e.is_essential]
        
        essential_monthly = sum(e.monthly_equivalent for e in essential)
        discretionary_monthly = sum(e.monthly_equivalent for e in discretionary)
        
        bills = [e for e in expenses if e.expense_type == 'bill']
        subscriptions = [e for e in expenses if e.expense_type == 'subscription']
        
        auto_pay_count = len([e for e in expenses if e.auto_pay])
        auto_pay_pct = (auto_pay_count / len(expenses) * 100) if expenses else 0
        
        upcoming_7 = len([e for e in expenses if e.days_until_due is not None and 0 <= e.days_until_due <= 7])
        overdue = len([e for e in expenses if e.is_overdue])
        
        return RecurringExpenseStats(
            total_monthly_recurring=Decimal(str(round(total_monthly, 2))),
            total_annual_recurring=Decimal(str(round(total_annual, 2))),
            essential_monthly=Decimal(str(round(essential_monthly, 2))),
            discretionary_monthly=Decimal(str(round(discretionary_monthly, 2))),
            total_active_expenses=len(expenses),
            bills_count=len(bills),
            subscriptions_count=len(subscriptions),
            auto_pay_percentage=round(auto_pay_pct, 2),
            upcoming_bills_7_days=upcoming_7,
            overdue_count=overdue
        )
    
    def get_monthly_breakdown(
        self,
        user_id: UUID,
        year: int,
        month: int
    ) -> MonthlyRecurringBreakdown:
        """Get breakdown of recurring expenses for a specific month"""
        
        # Get all active recurring expenses
        expenses = self.get_user_recurring_expenses(user_id, is_active=True)
        
        by_type: Dict[str, float] = {}
        by_category: Dict[str, float] = {}
        total = 0.0
        essential_total = 0.0
        discretionary_total = 0.0
        
        for expense in expenses:
            monthly_cost = expense.monthly_equivalent
            total += monthly_cost
            
            # By type
            expense_type = expense.expense_type or 'other'
            by_type[expense_type] = by_type.get(expense_type, 0) + monthly_cost
            
            # By category (would need to join with categories table)
            # For now, use expense_type as proxy
            by_category[expense_type] = by_category.get(expense_type, 0) + monthly_cost
            
            # Essential vs discretionary
            if expense.is_essential:
                essential_total += monthly_cost
            else:
                discretionary_total += monthly_cost
        
        return MonthlyRecurringBreakdown(
            month=f"{year}-{month:02d}",
            by_type={k: round(v, 2) for k, v in by_type.items()},
            by_category={k: round(v, 2) for k, v in by_category.items()},
            total=Decimal(str(round(total, 2))),
            essential_total=Decimal(str(round(essential_total, 2))),
            discretionary_total=Decimal(str(round(discretionary_total, 2)))
        )
    
    def analyze_variable_expense(
        self,
        recurring_id: UUID,
        user_id: UUID
    ) -> VariableExpenseAnalysis:
        """Analyze a variable recurring expense (like utilities)"""
        
        expense = self.get_recurring_expense(recurring_id, user_id)
        
        if not expense.is_variable:
            raise ValidationError("This expense is not marked as variable")
        
        # Get payment history
        history = self.db.query(RecurringExpenseHistory).filter(
            RecurringExpenseHistory.recurring_id == recurring_id
        ).order_by(
            RecurringExpenseHistory.payment_date.desc()
        ).all()
        
        if not history:
            raise ValidationError("No payment history available for analysis")
        
        amounts = [float(h.amount_paid) for h in history]
        
        avg = statistics.mean(amounts)
        min_amt = min(amounts)
        max_amt = max(amounts)
        std_dev = statistics.stdev(amounts) if len(amounts) > 1 else 0
        
        # Calculate trend (compare recent 3 to previous 3)
        if len(amounts) >= 6:
            recent_avg = statistics.mean(amounts[:3])
            previous_avg = statistics.mean(amounts[3:6])
            trend_pct = ((recent_avg - previous_avg) / previous_avg * 100) if previous_avg > 0 else 0
            
            if trend_pct > 5:
                trend = "increasing"
            elif trend_pct < -5:
                trend = "decreasing"
            else:
                trend = "stable"
        else:
            trend = "stable"
            trend_pct = 0
        
        # Seasonal analysis (group by month)
        seasonal: Dict[str, float] = {}
        for h in history:
            month_name = h.payment_date.strftime("%B")
            if month_name not in seasonal:
                seasonal[month_name] = []
            seasonal[month_name].append(float(h.amount_paid))
        
        seasonal_pattern = {k: round(statistics.mean(v), 2) for k, v in seasonal.items() if v}
        
        return VariableExpenseAnalysis(
            recurring_id=expense.recurring_id,
            expense_name=expense.expense_name,
            avg_amount=Decimal(str(round(avg, 2))),
            min_recorded=Decimal(str(round(min_amt, 2))),
            max_recorded=Decimal(str(round(max_amt, 2))),
            std_deviation=Decimal(str(round(std_dev, 2))),
            trend=trend,
            trend_percentage=round(trend_pct, 2),
            seasonal_pattern=seasonal_pattern if len(seasonal_pattern) > 1 else None,
            payment_count=len(history)
        )
    
    # ============================================
    # REMINDERS & NOTIFICATIONS
    # ============================================
    
    def get_bills_needing_reminder(self, user_id: UUID) -> List[RecurringExpense]:
        """Get bills that need reminders sent"""
        
        today = date.today()
        
        # Get all active expenses with reminders enabled
        expenses = self.db.query(RecurringExpense).filter(
            RecurringExpense.user_id == user_id,
            RecurringExpense.is_active == True,
            RecurringExpense.reminder_enabled == True,
            RecurringExpense.auto_pay == False  # Don't remind for auto-pay
        ).all()
        
        # Filter to those within reminder window
        needs_reminder = []
        for expense in expenses:
            if expense.days_until_due is not None:
                if 0 <= expense.days_until_due <= expense.reminder_days_before:
                    needs_reminder.append(expense)
        
        return needs_reminder
    
    # ============================================
    # BULK OPERATIONS
    # ============================================
    
    def pause_expense(
        self,
        recurring_id: UUID,
        user_id: UUID,
        pause_until: date
    ) -> RecurringExpense:
        """Temporarily pause a recurring expense"""
        
        expense = self.get_recurring_expense(recurring_id, user_id)
        expense.paused_until = pause_until
        expense.is_active = False
        
        self.db.commit()
        self.db.refresh(expense)
        
        return expense
    
    def resume_expense(
        self,
        recurring_id: UUID,
        user_id: UUID
    ) -> RecurringExpense:
        """Resume a paused recurring expense"""
        
        expense = self.get_recurring_expense(recurring_id, user_id)
        expense.paused_until = None
        expense.is_active = True
        
        # Recalculate next due date if it's in the past
        if expense.next_due_date < date.today():
            expense.next_due_date = expense.calculate_next_due_date(date.today())
        
        self.db.commit()
        self.db.refresh(expense)
        
        return expense