# backend/app/services/budget_service.py
"""
Budget Service
Business logic for budget management
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, func, extract
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import date, datetime, timedelta
from decimal import Decimal
import json

from app.models.budget import Budget, CategoryBudget, BudgetHistory, BudgetTemplate
from app.models.expense import Expense, ExpenseCategory
from app.schemas.budget import (
    BudgetCreate, BudgetUpdate, CategoryBudgetCreate, CategoryBudgetUpdate,
    BudgetTemplateCreate, QuickBudgetCreate, ApplyTemplateRequest
)
from app.core.exceptions import NotFoundError, ValidationError


class BudgetService:
    """Service for managing budgets"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ============================================
    # BUDGET CRUD
    # ============================================
    
    def create_budget(self, user_id: UUID, data: BudgetCreate) -> Budget:
        """Create a new budget"""
        
        # Check for overlapping budgets
        existing = self.db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.budget_type == data.budget_type,
            Budget.status == 'active',
            Budget.start_date <= data.end_date,
            Budget.end_date >= data.start_date
        ).first()
        
        if existing:
            raise ValidationError(f"Overlapping {data.budget_type} budget exists for this period")
        
        budget = Budget(
            user_id=user_id,
            budget_name=data.budget_name,
            budget_type=data.budget_type,
            start_date=data.start_date,
            end_date=data.end_date,
            total_amount=data.total_amount,
            expected_income=data.expected_income,
            savings_target=data.savings_target,
            savings_target_percentage=data.savings_target_percentage,
            is_rollover_enabled=data.is_rollover_enabled,
            alert_at_percentage=data.alert_at_percentage,
            notes=data.notes,
        )
        
        self.db.add(budget)
        self.db.flush()  # Get the budget_id
        
        # Create category budgets if provided
        if data.category_budgets:
            for cat_budget in data.category_budgets:
                self._create_category_budget(budget.budget_id, cat_budget)
            
            # Update allocated amount
            budget.allocated_amount = sum(cb.allocated_amount for cb in data.category_budgets)
        
        self.db.commit()
        self.db.refresh(budget)
        
        return budget
    
    def get_budget(self, user_id: UUID, budget_id: UUID) -> Budget:
        """Get a specific budget"""
        budget = self.db.query(Budget).filter(
            Budget.budget_id == budget_id,
            Budget.user_id == user_id
        ).first()
        
        if not budget:
            raise NotFoundError("Budget not found")
        
        return budget
    
    def get_budgets(
        self,
        user_id: UUID,
        status: Optional[str] = None,
        budget_type: Optional[str] = None,
        include_categories: bool = False
    ) -> List[Budget]:
        """Get all budgets for a user"""
        query = self.db.query(Budget).filter(Budget.user_id == user_id)
        
        if status:
            query = query.filter(Budget.status == status)
        
        if budget_type:
            query = query.filter(Budget.budget_type == budget_type)
        
        return query.order_by(Budget.start_date.desc()).all()
    
    def get_active_budget(self, user_id: UUID, budget_type: str = "monthly") -> Optional[Budget]:
        """Get the currently active budget"""
        today = date.today()
        
        return self.db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.budget_type == budget_type,
            Budget.status == 'active',
            Budget.start_date <= today,
            Budget.end_date >= today
        ).first()
    
    def update_budget(self, user_id: UUID, budget_id: UUID, data: BudgetUpdate) -> Budget:
        """Update a budget"""
        budget = self.get_budget(user_id, budget_id)
        
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(budget, field, value)
        
        self.db.commit()
        self.db.refresh(budget)
        
        return budget
    
    def delete_budget(self, user_id: UUID, budget_id: UUID) -> None:
        """Delete a budget"""
        budget = self.get_budget(user_id, budget_id)
        self.db.delete(budget)
        self.db.commit()
    
    # ============================================
    # CATEGORY BUDGETS
    # ============================================
    
    def _create_category_budget(
        self,
        budget_id: UUID,
        data: CategoryBudgetCreate
    ) -> CategoryBudget:
        """Create a category budget"""
        cat_budget = CategoryBudget(
            budget_id=budget_id,
            category_id=data.category_id,
            allocated_amount=data.allocated_amount,
            is_flexible=data.is_flexible,
            priority=data.priority,
            notes=data.notes,
        )
        self.db.add(cat_budget)
        return cat_budget
    
    def add_category_budget(
        self,
        user_id: UUID,
        budget_id: UUID,
        data: CategoryBudgetCreate
    ) -> CategoryBudget:
        """Add a category budget to an existing budget"""
        budget = self.get_budget(user_id, budget_id)
        
        # Check if category already has allocation
        existing = self.db.query(CategoryBudget).filter(
            CategoryBudget.budget_id == budget_id,
            CategoryBudget.category_id == data.category_id
        ).first()
        
        if existing:
            raise ValidationError("Category already has an allocation in this budget")
        
        cat_budget = self._create_category_budget(budget_id, data)
        
        # Update budget allocated amount
        budget.allocated_amount = (budget.allocated_amount or 0) + data.allocated_amount
        
        self.db.commit()
        self.db.refresh(cat_budget)
        
        return cat_budget
    
    def update_category_budget(
        self,
        user_id: UUID,
        category_budget_id: UUID,
        data: CategoryBudgetUpdate
    ) -> CategoryBudget:
        """Update a category budget"""
        cat_budget = self.db.query(CategoryBudget).join(Budget).filter(
            CategoryBudget.category_budget_id == category_budget_id,
            Budget.user_id == user_id
        ).first()
        
        if not cat_budget:
            raise NotFoundError("Category budget not found")
        
        old_amount = cat_budget.allocated_amount
        
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(cat_budget, field, value)
        
        # Update parent budget allocated amount if amount changed
        if data.allocated_amount is not None and data.allocated_amount != old_amount:
            budget = cat_budget.budget
            budget.allocated_amount = (budget.allocated_amount or 0) - old_amount + data.allocated_amount
        
        self.db.commit()
        self.db.refresh(cat_budget)
        
        return cat_budget
    
    def get_category_budgets(self, user_id: UUID, budget_id: UUID) -> List[CategoryBudget]:
        """Get all category budgets for a budget"""
        budget = self.get_budget(user_id, budget_id)
        return budget.category_budgets
    
    # ============================================
    # SPENDING TRACKING
    # ============================================
    
    def update_spending(self, user_id: UUID, budget_id: Optional[UUID] = None) -> Budget:
        """
        Recalculate spent amounts from actual expenses.
        If budget_id is None, updates the active budget.
        """
        if budget_id:
            budget = self.get_budget(user_id, budget_id)
        else:
            budget = self.get_active_budget(user_id)
            if not budget:
                raise NotFoundError("No active budget found")
        
        # Calculate total spending for the period
        total_spent = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= budget.start_date,
            Expense.expense_date <= budget.end_date
        ).scalar() or Decimal('0')
        
        budget.spent_amount = total_spent
        
        # Update status if over budget
        if budget.spent_amount > budget.total_amount:
            budget.status = 'exceeded'
        
        # Update category budgets
        for cat_budget in budget.category_budgets:
            cat_spent = self.db.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
                Expense.category_id == cat_budget.category_id,
                Expense.expense_date >= budget.start_date,
                Expense.expense_date <= budget.end_date
            ).scalar() or Decimal('0')
            
            cat_budget.spent_amount = cat_spent
        
        self.db.commit()
        self.db.refresh(budget)
        
        return budget
    
    def record_expense_to_budget(
        self,
        user_id: UUID,
        expense: Expense
    ) -> Optional[Budget]:
        """
        Update budget when an expense is logged.
        Called by expense service.
        """
        budget = self.get_active_budget(user_id)
        
        if not budget:
            return None
        
        # Update total spent
        budget.spent_amount = (budget.spent_amount or 0) + expense.amount
        
        # Update category budget if exists
        if expense.category_id:
            cat_budget = self.db.query(CategoryBudget).filter(
                CategoryBudget.budget_id == budget.budget_id,
                CategoryBudget.category_id == expense.category_id
            ).first()
            
            if cat_budget:
                cat_budget.spent_amount = (cat_budget.spent_amount or 0) + expense.amount
                
                # Check category alert
                if not cat_budget.alert_sent and cat_budget.spent_percentage >= cat_budget.alert_at_percentage:
                    cat_budget.alert_sent = True
                    # TODO: Trigger notification
        
        # Check budget alert
        if not budget.alert_sent and budget.spent_percentage >= budget.alert_at_percentage:
            budget.alert_sent = True
            # TODO: Trigger notification
        
        # Update status
        if budget.spent_amount > budget.total_amount:
            budget.status = 'exceeded'
        
        self.db.commit()
        
        return budget
    
    # ============================================
    # BUDGET STATS
    # ============================================
    
    def get_budget_stats(self, user_id: UUID) -> Dict[str, Any]:
        """Get budget statistics"""
        budget = self.get_active_budget(user_id)
        
        if not budget:
            return {
                'has_active_budget': False,
                'message': 'No active budget. Create one to start tracking!'
            }
        
        # Category breakdown
        category_spending = []
        for cat_budget in budget.category_budgets:
            category = self.db.query(ExpenseCategory).filter(
                ExpenseCategory.category_id == cat_budget.category_id
            ).first()
            
            category_spending.append({
                'category_id': str(cat_budget.category_id),
                'category_name': category.category_name if category else 'Unknown',
                'allocated': float(cat_budget.allocated_amount),
                'spent': float(cat_budget.spent_amount),
                'remaining': cat_budget.remaining_amount,
                'percentage': cat_budget.spent_percentage,
                'is_over': cat_budget.is_over_budget,
            })
        
        # Calculate daily average and projection
        days_elapsed = (date.today() - budget.start_date).days + 1
        avg_daily = float(budget.spent_amount) / days_elapsed if days_elapsed > 0 else 0
        
        total_days = (budget.end_date - budget.start_date).days + 1
        projected_total = avg_daily * total_days
        
        # Spending trend (compare first half to second half of elapsed period)
        half_point = budget.start_date + timedelta(days=days_elapsed // 2)
        
        first_half = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= budget.start_date,
            Expense.expense_date < half_point
        ).scalar() or 0
        
        second_half = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= half_point,
            Expense.expense_date <= date.today()
        ).scalar() or 0
        
        if first_half > 0:
            if second_half > first_half * 1.1:
                trend = 'increasing'
            elif second_half < first_half * 0.9:
                trend = 'decreasing'
            else:
                trend = 'stable'
        else:
            trend = 'stable'
        
        return {
            'has_active_budget': True,
            'budget_id': str(budget.budget_id),
            'budget_name': budget.budget_name,
            'total_budgeted': float(budget.total_amount),
            'total_spent': float(budget.spent_amount),
            'total_remaining': budget.remaining_amount,
            'overall_spent_percentage': budget.spent_percentage,
            'days_remaining': budget.days_remaining,
            'daily_allowance': budget.daily_allowance,
            'avg_daily_spending': round(avg_daily, 2),
            'projected_end_of_month': round(projected_total, 2),
            'on_track': projected_total <= float(budget.total_amount),
            'category_spending': category_spending,
            'spending_trend': trend,
        }
    
    # ============================================
    # BUDGET TEMPLATES
    # ============================================
    
    def create_template(self, user_id: UUID, data: BudgetTemplateCreate) -> BudgetTemplate:
        """Create a budget template"""
        
        # If this is default, unset other defaults
        if data.is_default:
            self.db.query(BudgetTemplate).filter(
                BudgetTemplate.user_id == user_id,
                BudgetTemplate.budget_type == data.budget_type,
                BudgetTemplate.is_default == True
            ).update({'is_default': False})
        
        template = BudgetTemplate(
            user_id=user_id,
            template_name=data.template_name,
            description=data.description,
            budget_type=data.budget_type,
            total_amount=data.total_amount,
            category_allocations=json.dumps([a.model_dump() for a in data.category_allocations]) if data.category_allocations else None,
            savings_target_percentage=data.savings_target_percentage,
            is_default=data.is_default,
        )
        
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        
        return template
    
    def apply_template(self, user_id: UUID, data: ApplyTemplateRequest) -> Budget:
        """Create a budget from a template"""
        template = self.db.query(BudgetTemplate).filter(
            BudgetTemplate.template_id == data.template_id,
            BudgetTemplate.user_id == user_id
        ).first()
        
        if not template:
            raise NotFoundError("Template not found")
        
        # Calculate end date if not provided
        end_date = data.end_date
        if not end_date:
            if template.budget_type == 'monthly':
                # End of month
                next_month = data.start_date.replace(day=28) + timedelta(days=4)
                end_date = next_month - timedelta(days=next_month.day)
            elif template.budget_type == 'weekly':
                end_date = data.start_date + timedelta(days=6)
            else:
                end_date = data.start_date + timedelta(days=30)
        
        # Use provided amount or template amount
        total_amount = data.total_amount or template.total_amount
        
        # Parse category allocations
        category_budgets = []
        if template.category_allocations:
            allocations = json.loads(template.category_allocations)
            for alloc in allocations:
                if alloc.get('percentage'):
                    amount = total_amount * Decimal(str(alloc['percentage'])) / 100
                else:
                    amount = Decimal(str(alloc.get('amount', 0)))
                
                category_budgets.append(CategoryBudgetCreate(
                    category_id=UUID(alloc['category_id']),
                    allocated_amount=amount
                ))
        
        # Create budget
        budget_data = BudgetCreate(
            budget_name=f"{template.template_name} - {data.start_date.strftime('%B %Y')}",
            budget_type=template.budget_type,
            start_date=data.start_date,
            end_date=end_date,
            total_amount=total_amount,
            savings_target_percentage=template.savings_target_percentage,
            category_budgets=category_budgets,
        )
        
        return self.create_budget(user_id, budget_data)
    
    # ============================================
    # QUICK BUDGET CREATION
    # ============================================
    
    def create_quick_budget(self, user_id: UUID, data: QuickBudgetCreate) -> Budget:
        """
        Create a budget quickly based on income.
        Uses 50/30/20 rule if selected.
        """
        today = date.today()
        
        if data.budget_type == 'monthly':
            start_date = today.replace(day=1)
            next_month = start_date.replace(day=28) + timedelta(days=4)
            end_date = next_month - timedelta(days=next_month.day)
            budget_name = f"Budget - {start_date.strftime('%B %Y')}"
        else:
            # Weekly - start from Monday
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
            budget_name = f"Budget - Week {start_date.isocalendar()[1]}"
        
        # Calculate budget amount (income - savings)
        savings_amount = data.monthly_income * data.savings_percentage / 100
        budget_amount = data.monthly_income - savings_amount
        
        category_budgets = []
        
        if data.use_fifty_thirty_twenty:
            # Get or create default categories
            needs_cats = ['Rent/Housing', 'Utilities', 'Groceries', 'Transportation', 'Healthcare']
            wants_cats = ['Entertainment', 'Dining Out', 'Shopping', 'Subscriptions']
            
            # 50% Needs, 30% Wants (20% already allocated to savings)
            needs_amount = data.monthly_income * Decimal('0.5')
            wants_amount = data.monthly_income * Decimal('0.3')
            
            # TODO: Auto-allocate to categories
            # For now, just create the main budget
        
        budget_data = BudgetCreate(
            budget_name=budget_name,
            budget_type=data.budget_type,
            start_date=start_date,
            end_date=end_date,
            total_amount=budget_amount,
            expected_income=data.monthly_income,
            savings_target=savings_amount,
            savings_target_percentage=data.savings_percentage,
            category_budgets=category_budgets if category_budgets else None,
        )
        
        return self.create_budget(user_id, budget_data)
    
    # ============================================
    # BUDGET HISTORY
    # ============================================
    
    def record_daily_snapshot(self, user_id: UUID) -> Optional[BudgetHistory]:
        """Record daily budget snapshot for history"""
        budget = self.get_active_budget(user_id)
        
        if not budget:
            return None
        
        today = date.today()
        
        # Check if already recorded today
        existing = self.db.query(BudgetHistory).filter(
            BudgetHistory.budget_id == budget.budget_id,
            BudgetHistory.record_date == today
        ).first()
        
        if existing:
            return existing
        
        # Get today's spending
        daily_spent = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date == today
        ).scalar() or 0
        
        daily_count = self.db.query(func.count(Expense.expense_id)).filter(
            Expense.user_id == user_id,
            Expense.expense_date == today
        ).scalar() or 0
        
        history = BudgetHistory(
            budget_id=budget.budget_id,
            record_date=today,
            total_budget=budget.total_amount,
            spent_amount=budget.spent_amount,
            remaining_amount=Decimal(str(budget.remaining_amount)),
            spent_percentage=Decimal(str(budget.spent_percentage)),
            daily_spent=Decimal(str(daily_spent)),
            transaction_count=daily_count,
        )
        
        self.db.add(history)
        self.db.commit()
        self.db.refresh(history)
        
        return history
    
    def get_budget_history(
        self,
        user_id: UUID,
        budget_id: UUID,
        days: int = 30
    ) -> List[BudgetHistory]:
        """Get budget history for charting"""
        budget = self.get_budget(user_id, budget_id)
        
        cutoff = date.today() - timedelta(days=days)
        
        return self.db.query(BudgetHistory).filter(
            BudgetHistory.budget_id == budget_id,
            BudgetHistory.record_date >= cutoff
        ).order_by(BudgetHistory.record_date).all()