# backend/app/services/dashboard_service.py
"""
Dashboard Service
Aggregates data from all services for the main dashboard view
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import date, datetime, timedelta
from decimal import Decimal

from app.models.expense import Expense, ExpenseCategory, DailyCheckin, SpendingStreak
from app.models.income import IncomeSource, IncomeHistory
from app.models.goal import FinancialGoal
from app.models.budget import Budget
from app.models.recurring_expense import RecurringExpense, UpcomingBill
from app.models.notification import Notification

from app.services.budget_service import BudgetService
from app.services.notification_service import NotificationService


class DashboardService:
    """Service for aggregating dashboard data"""
    
    def __init__(self, db: Session):
        self.db = db
        self.budget_service = BudgetService(db)
        self.notification_service = NotificationService(db)
    
    def get_dashboard(self, user_id: UUID) -> Dict[str, Any]:
        """
        Get complete dashboard data for a user.
        This is the main endpoint for the mobile app home screen.
        """
        today = date.today()
        
        dashboard = {
            'generated_at': datetime.utcnow().isoformat(),
            'greeting': self._get_greeting(),
            'quick_stats': self._get_quick_stats(user_id, today),
            'budget_summary': self._get_budget_summary(user_id),
            'spending_today': self._get_today_spending(user_id, today),
            'goals_overview': self._get_goals_overview(user_id),
            'upcoming_bills': self._get_upcoming_bills(user_id, today),
            'recent_transactions': self._get_recent_transactions(user_id),
            'streaks': self._get_streaks(user_id),
            'notifications': self._get_notifications(user_id),
            'insights': self._get_quick_insights(user_id),
            'checkin_status': self._get_checkin_status(user_id, today),
        }
        
        return dashboard
    
    def _get_greeting(self) -> str:
        """Get time-appropriate greeting"""
        hour = datetime.now().hour
        if hour < 12:
            return "Good morning"
        elif hour < 17:
            return "Good afternoon"
        else:
            return "Good evening"
    
    def _get_quick_stats(self, user_id: UUID, today: date) -> Dict[str, Any]:
        """Get quick financial stats"""
        # This month's dates
        month_start = today.replace(day=1)
        next_month = (month_start + timedelta(days=32)).replace(day=1)
        month_end = next_month - timedelta(days=1)
        
        # This week's dates
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        # Monthly spending
        monthly_spending = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= month_start,
            Expense.expense_date <= today
        ).scalar() or Decimal('0')
        
        # Weekly spending
        weekly_spending = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= week_start,
            Expense.expense_date <= today
        ).scalar() or Decimal('0')
        
        # Monthly income
        monthly_income = self.db.query(func.sum(IncomeHistory.net_amount)).join(IncomeSource).filter(
            IncomeSource.user_id == user_id,
            IncomeHistory.payment_date >= month_start,
            IncomeHistory.payment_date <= today
        ).scalar() or Decimal('0')
        
        # Net this month
        net_this_month = float(monthly_income) - float(monthly_spending)
        
        # Compared to last month
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        last_month_same_day = last_month_start + timedelta(days=today.day - 1)
        
        last_month_spending = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= last_month_start,
            Expense.expense_date <= last_month_same_day
        ).scalar() or Decimal('0')
        
        if last_month_spending > 0:
            spending_change = ((float(monthly_spending) - float(last_month_spending)) / float(last_month_spending)) * 100
        else:
            spending_change = 0
        
        return {
            'monthly_spending': float(monthly_spending),
            'weekly_spending': float(weekly_spending),
            'monthly_income': float(monthly_income),
            'net_this_month': net_this_month,
            'spending_change_vs_last_month': round(spending_change, 1),
            'spending_trend': 'up' if spending_change > 5 else ('down' if spending_change < -5 else 'stable'),
        }
    
    def _get_budget_summary(self, user_id: UUID) -> Dict[str, Any]:
        """Get active budget summary"""
        try:
            return self.budget_service.get_budget_stats(user_id)
        except Exception:
            return {'has_active_budget': False}
    
    def _get_today_spending(self, user_id: UUID, today: date) -> Dict[str, Any]:
        """Get today's spending details"""
        today_expenses = self.db.query(Expense).filter(
            Expense.user_id == user_id,
            Expense.expense_date == today
        ).order_by(Expense.created_at.desc()).all()
        
        total = sum(float(e.amount) for e in today_expenses)
        
        # Get budget daily allowance
        budget = self.budget_service.get_active_budget(user_id)
        daily_allowance = budget.daily_allowance if budget else None
        
        return {
            'total': total,
            'transaction_count': len(today_expenses),
            'daily_allowance': daily_allowance,
            'remaining_allowance': daily_allowance - total if daily_allowance else None,
            'is_over_allowance': total > daily_allowance if daily_allowance else False,
            'transactions': [
                {
                    'expense_id': str(e.expense_id),
                    'amount': float(e.amount),
                    'merchant': e.merchant_name,
                    'category': e.category.category_name if e.category else None,
                    'has_emotion': e.emotion is not None,
                }
                for e in today_expenses[:5]  # Last 5
            ]
        }
    
    def _get_goals_overview(self, user_id: UUID) -> Dict[str, Any]:
        """Get goals overview"""
        goals = self.db.query(FinancialGoal).filter(
            FinancialGoal.user_id == user_id,
            FinancialGoal.status == 'active'
        ).order_by(FinancialGoal.priority_level.desc()).all()
        
        total_target = sum(float(g.target_amount) for g in goals)
        total_saved = sum(float(g.current_amount or 0) for g in goals)
        
        goals_data = []
        for goal in goals[:3]:  # Top 3 by priority
            goals_data.append({
                'goal_id': str(goal.goal_id),
                'name': goal.goal_name,
                'target': float(goal.target_amount),
                'current': float(goal.current_amount or 0),
                'percentage': goal.completion_percentage,
                'deadline': goal.deadline_date.isoformat() if goal.deadline_date else None,
                'days_remaining': goal.days_remaining,
                'is_on_track': goal.is_on_track,
            })
        
        return {
            'active_goals': len(goals),
            'total_target': total_target,
            'total_saved': total_saved,
            'overall_progress': round(total_saved / total_target * 100, 1) if total_target > 0 else 0,
            'top_goals': goals_data,
        }
    
    def _get_upcoming_bills(self, user_id: UUID, today: date) -> List[Dict[str, Any]]:
        """Get upcoming bills for next 7 days"""
        next_week = today + timedelta(days=7)
        
        bills = self.db.query(UpcomingBill).join(RecurringExpense).filter(
            RecurringExpense.user_id == user_id,
            UpcomingBill.due_date >= today,
            UpcomingBill.due_date <= next_week,
            UpcomingBill.status == 'pending'
        ).order_by(UpcomingBill.due_date).limit(5).all()
        
        return [
            {
                'bill_id': str(bill.bill_id),
                'name': bill.recurring_expense.expense_name,
                'amount': float(bill.amount),
                'due_date': bill.due_date.isoformat(),
                'days_until_due': (bill.due_date - today).days,
                'category': bill.recurring_expense.category,
            }
            for bill in bills
        ]
    
    def _get_recent_transactions(self, user_id: UUID) -> List[Dict[str, Any]]:
        """Get recent transactions"""
        expenses = self.db.query(Expense).filter(
            Expense.user_id == user_id
        ).order_by(Expense.expense_date.desc(), Expense.created_at.desc()).limit(10).all()
        
        return [
            {
                'expense_id': str(e.expense_id),
                'date': e.expense_date.isoformat(),
                'amount': float(e.amount),
                'merchant': e.merchant_name,
                'category': e.category.category_name if e.category else None,
                'has_emotion': e.emotion is not None,
                'emotion': e.emotion.primary_emotion if e.emotion else None,
            }
            for e in expenses
        ]
    
    def _get_streaks(self, user_id: UUID) -> Dict[str, Any]:
        """Get user's active streaks"""
        streaks = self.db.query(SpendingStreak).filter(
            SpendingStreak.user_id == user_id,
            SpendingStreak.is_active == True
        ).all()
        
        streak_data = {}
        for streak in streaks:
            streak_data[streak.streak_type] = {
                'current': streak.current_streak,
                'longest': streak.longest_streak,
                'target': streak.target_streak,
            }
        
        # Get logging streak specifically
        logging_streak = streak_data.get('daily_logging', {}).get('current', 0)
        
        return {
            'logging_streak': logging_streak,
            'all_streaks': streak_data,
            'has_streak': logging_streak > 0,
        }
    
    def _get_notifications(self, user_id: UUID) -> Dict[str, Any]:
        """Get unread notifications count and recent"""
        notifications, total, unread = self.notification_service.get_notifications(
            user_id, limit=5
        )
        
        return {
            'unread_count': unread,
            'recent': [
                {
                    'notification_id': str(n.notification_id),
                    'title': n.title,
                    'message': n.message[:100] + '...' if len(n.message) > 100 else n.message,
                    'type': n.notification_type,
                    'is_read': n.is_read,
                    'created_at': n.created_at.isoformat(),
                }
                for n in notifications
            ]
        }
    
    def _get_quick_insights(self, user_id: UUID) -> Dict[str, Any]:
        """Get quick AI insights for dashboard"""
        # This is a simplified version - the full insights are in insights API
        
        # Get emotional spending percentage
        today = date.today()
        month_start = today.replace(day=1)
        
        total_spending = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= month_start
        ).scalar() or Decimal('0')
        
        emotional_spending = self.db.query(func.sum(Expense.amount)).join(
            Expense.emotion
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= month_start
        ).scalar() or Decimal('0')
        
        emotional_pct = round(float(emotional_spending) / float(total_spending) * 100, 1) if total_spending > 0 else 0
        
        # Get top spending category
        top_category = self.db.query(
            ExpenseCategory.category_name,
            func.sum(Expense.amount).label('total')
        ).join(Expense).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= month_start
        ).group_by(ExpenseCategory.category_name).order_by(
            func.sum(Expense.amount).desc()
        ).first()
        
        return {
            'emotional_spending_pct': emotional_pct,
            'top_category': {
                'name': top_category[0] if top_category else None,
                'amount': float(top_category[1]) if top_category else 0,
            },
            'tip': self._get_daily_tip(emotional_pct),
        }
    
    def _get_daily_tip(self, emotional_pct: float) -> str:
        """Get a contextual daily tip"""
        tips = [
            "💡 Try the 24-hour rule: Wait a day before non-essential purchases.",
            "💡 Log emotions with every purchase to understand your spending triggers.",
            "💡 Review your goals weekly to stay motivated.",
            "💡 Pack lunch tomorrow to save money and eat healthier.",
            "💡 Celebrate small wins - every dollar saved counts!",
        ]
        
        if emotional_pct > 50:
            return "💡 High emotional spending this month. Consider a brief pause before your next purchase."
        
        import random
        return random.choice(tips)
    
    def _get_checkin_status(self, user_id: UUID, today: date) -> Dict[str, Any]:
        """Get today's check-in status"""
        checkin = self.db.query(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.checkin_date == today
        ).first()
        
        if not checkin:
            return {
                'completed': False,
                'expenses_logged': False,
                'emotions_captured': False,
            }
        
        return {
            'completed': checkin.is_complete,
            'expenses_logged': checkin.expenses_logged,
            'emotions_captured': checkin.emotions_captured,
            'total_spent': float(checkin.total_spent_today or 0),
            'expense_count': checkin.expense_count or 0,
            'mood': checkin.overall_mood,
        }
    
    # ============================================
    # WEEKLY SUMMARY
    # ============================================
    
    def get_weekly_summary(self, user_id: UUID) -> Dict[str, Any]:
        """Get weekly summary for notifications"""
        today = date.today()
        week_start = today - timedelta(days=7)
        
        # Total spending
        total_spent = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= week_start,
            Expense.expense_date <= today
        ).scalar() or Decimal('0')
        
        # Category breakdown
        categories = self.db.query(
            ExpenseCategory.category_name,
            func.sum(Expense.amount).label('total')
        ).join(Expense).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= week_start,
            Expense.expense_date <= today
        ).group_by(ExpenseCategory.category_name).order_by(
            func.sum(Expense.amount).desc()
        ).limit(5).all()
        
        # Compare to previous week
        prev_week_start = week_start - timedelta(days=7)
        prev_week_spent = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= prev_week_start,
            Expense.expense_date < week_start
        ).scalar() or Decimal('0')
        
        change = 0
        if prev_week_spent > 0:
            change = ((float(total_spent) - float(prev_week_spent)) / float(prev_week_spent)) * 100
        
        # Goals progress
        goals = self.db.query(FinancialGoal).filter(
            FinancialGoal.user_id == user_id,
            FinancialGoal.status == 'active'
        ).all()
        
        goals_contributed = 0
        for goal in goals:
            # Check if any contributions this week
            # This would need GoalProgressHistory
            pass
        
        return {
            'period': f"{week_start.isoformat()} to {today.isoformat()}",
            'total_spent': float(total_spent),
            'vs_last_week': round(change, 1),
            'category_breakdown': [
                {'category': c[0], 'amount': float(c[1])}
                for c in categories
            ],
            'transactions_count': self.db.query(func.count(Expense.expense_id)).filter(
                Expense.user_id == user_id,
                Expense.expense_date >= week_start,
                Expense.expense_date <= today
            ).scalar() or 0,
            'daily_average': round(float(total_spent) / 7, 2),
        }