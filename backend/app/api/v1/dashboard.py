from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Dict, List, Any
from datetime import date, datetime, timedelta
from decimal import Decimal

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.income_source import IncomeSource
from app.models.expense import Expense
from app.models.expense_category import ExpenseCategory
from app.models.financial_goal import FinancialGoal
from app.models.recurring_expense import RecurringExpense
from app.models.dependent import Dependent

router = APIRouter()

@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get complete dashboard data
    
    Returns:
    - Financial health score (calculated)
    - Income summary
    - Expense summary
    - Goal progress
    - Upcoming bills
    - Recent transactions
    - Spending trends
    """
    
    today = date.today()
    current_month_start = date(today.year, today.month, 1)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    
    # ============================================
    # INCOME SUMMARY
    # ============================================
    
    active_incomes = db.query(IncomeSource).filter(
        IncomeSource.user_id == current_user.user_id,
        IncomeSource.is_active == True
    ).all()
    
    # Calculate monthly income
    monthly_income = Decimal('0')
    for income in active_incomes:
        if income.frequency == 'monthly':
            monthly_income += income.amount
        elif income.frequency == 'biweekly':
            monthly_income += income.amount * 2
        elif income.frequency == 'weekly':
            monthly_income += income.amount * 4
        elif income.frequency == 'semester':
            monthly_income += income.amount / 4  # Assuming 4-month semester
    
    # ============================================
    # EXPENSE SUMMARY
    # ============================================
    
    # Current month expenses
    current_month_expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.user_id,
        Expense.expense_date >= current_month_start
    ).scalar() or Decimal('0')
    
    # Last month expenses
    last_month_expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.user_id,
        Expense.expense_date >= last_month_start,
        Expense.expense_date < current_month_start
    ).scalar() or Decimal('0')
    
    # Spending by category (current month)
    category_spending = db.query(
        ExpenseCategory.category_name,
        func.sum(Expense.amount).label('total')
    ).join(Expense).filter(
        Expense.user_id == current_user.user_id,
        Expense.expense_date >= current_month_start
    ).group_by(ExpenseCategory.category_name).all()
    
    # ============================================
    # GOAL PROGRESS
    # ============================================
    
    active_goals = db.query(FinancialGoal).filter(
        FinancialGoal.user_id == current_user.user_id,
        FinancialGoal.status == 'active'
    ).order_by(FinancialGoal.priority_level).all()
    
    goals_summary = []
    total_goal_target = Decimal('0')
    total_goal_current = Decimal('0')
    goals_on_track = 0
    
    for goal in active_goals:
        progress_percentage = float((goal.current_amount / goal.target_amount) * 100) if goal.target_amount > 0 else 0
        
        on_track = False
        if goal.deadline_date:
            days_remaining = (goal.deadline_date - today).days
            if days_remaining > 0:
                months_remaining = days_remaining / 30
                required_monthly = float((goal.target_amount - goal.current_amount) / Decimal(str(months_remaining))) if months_remaining > 0 else 0
                # Consider on track if we have enough time or ahead of schedule
                on_track = progress_percentage >= 50 or required_monthly <= float(monthly_income) * 0.2
        else:
            on_track = progress_percentage > 0
        
        if on_track:
            goals_on_track += 1
        
        goals_summary.append({
            'goal_id': str(goal.goal_id),
            'goal_name': goal.goal_name,
            'target_amount': float(goal.target_amount),
            'current_amount': float(goal.current_amount),
            'progress_percentage': progress_percentage,
            'priority_level': goal.priority_level,
            'on_track': on_track
        })
        
        total_goal_target += goal.target_amount
        total_goal_current += goal.current_amount
    
    # ============================================
    # UPCOMING BILLS
    # ============================================
    
    upcoming_bills = db.query(RecurringExpense).filter(
        RecurringExpense.user_id == current_user.user_id,
        RecurringExpense.is_active == True,
        RecurringExpense.next_due_date >= today,
        RecurringExpense.next_due_date <= today + timedelta(days=30)
    ).order_by(RecurringExpense.next_due_date).limit(10).all()
    
    bills_summary = [
        {
            'recurring_id': str(bill.recurring_id),
            'expense_name': bill.expense_name,
            'amount': float(bill.base_amount),
            'due_date': bill.next_due_date.isoformat(),
            'days_until_due': (bill.next_due_date - today).days,
            'is_variable': bill.is_variable
        }
        for bill in upcoming_bills
    ]
    
    # ============================================
    # DEPENDENTS SUMMARY
    # ============================================
    
    dependents_count = db.query(func.count(Dependent.dependent_id)).filter(
        Dependent.user_id == current_user.user_id
    ).scalar()
    
    # ============================================
    # FINANCIAL HEALTH SCORE
    # ============================================
    
    # Simple calculation (can be enhanced)
    health_score = 50  # Base score
    
    # Income vs Expenses
    if monthly_income > 0:
        savings_rate = (monthly_income - current_month_expenses) / monthly_income
        if savings_rate > 0.3:
            health_score += 20
        elif savings_rate > 0.2:
            health_score += 15
        elif savings_rate > 0.1:
            health_score += 10
    
    # Goal progress
    if len(active_goals) > 0:
        goal_progress_avg = total_goal_current / total_goal_target if total_goal_target > 0 else 0
        health_score += int(goal_progress_avg * 20)
    
    # Active income sources
    if len(active_incomes) > 1:
        health_score += 10  # Diversified income
    
    # Ensure score is between 0 and 100
    health_score = min(max(health_score, 0), 100)
    
    # ============================================
    # SPENDING TREND
    # ============================================
    
    trend = "stable"
    if last_month_expenses > 0:
        change_percentage = ((current_month_expenses - last_month_expenses) / last_month_expenses) * 100
        if change_percentage > 10:
            trend = "increasing"
        elif change_percentage < -10:
            trend = "decreasing"
    
    # ============================================
    # BUILD RESPONSE
    # ============================================
    
    return {
        "financial_health_score": health_score,
        "income": {
            "monthly_total": float(monthly_income),
            "active_sources": len(active_incomes)
        },
        "expenses": {
            "current_month": float(current_month_expenses),
            "last_month": float(last_month_expenses),
            "trend": trend,
            "by_category": [
                {"category": cat, "amount": float(total)}
                for cat, total in category_spending
            ]
        },
        "savings": {
            "monthly_amount": float(monthly_income - current_month_expenses),
            "savings_rate": float((monthly_income - current_month_expenses) / monthly_income * 100) if monthly_income > 0 else 0
        },
        "goals": {
            "total_count": len(active_goals),
            "on_track_count": goals_on_track,
            "total_target": float(total_goal_target),
            "total_saved": float(total_goal_current),
            "overall_progress": float((total_goal_current / total_goal_target) * 100) if total_goal_target > 0 else 0,
            "goals": goals_summary
        },
        "upcoming_bills": {
            "count": len(bills_summary),
            "total_amount": sum(bill['amount'] for bill in bills_summary),
            "bills": bills_summary
        },
        "dependents": {
            "count": dependents_count
        },
        "summary": {
            "net_monthly": float(monthly_income - current_month_expenses),
            "health_score": health_score,
            "goals_on_track": goals_on_track,
            "total_goals": len(active_goals)
        }
    }

@router.get("/trends")
def get_spending_trends(
    months: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get spending trends over time"""
    
    today = date.today()
    trends = []
    
    for i in range(months):
        # Calculate month start/end
        month_date = today - timedelta(days=30 * i)
        month_start = date(month_date.year, month_date.month, 1)
        
        # Next month start
        if month_date.month == 12:
            next_month = date(month_date.year + 1, 1, 1)
        else:
            next_month = date(month_date.year, month_date.month + 1, 1)
        
        # Get expenses for this month
        month_total = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == current_user.user_id,
            Expense.expense_date >= month_start,
            Expense.expense_date < next_month
        ).scalar() or 0
        
        trends.append({
            "month": month_start.strftime("%Y-%m"),
            "total_spent": float(month_total)
        })
    
    return list(reversed(trends))