# backend/app/services/expense_service.py
"""
Expense Service
Business logic for expenses, emotional tracking, and daily check-ins
The heart of Fortuna's behavioral insights
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from typing import List, Optional, Dict, Tuple
from uuid import UUID
from datetime import date, datetime, timezone, timedelta
from decimal import Decimal

from app.models.expense import (
    Expense, ExpenseCategory, ExpenseEmotion,
    DailyCheckin, SpendingStreak, MonthlyEmotionalAnalysis
)
from app.schemas.expense import (
    ExpenseCreate, ExpenseUpdate,
    ExpenseCategoryCreate, ExpenseCategoryUpdate,
    ExpenseEmotionCreate, ExpenseEmotionReflection,
    DailyCheckinCreate, DailyCheckinComplete,
    QuickExpenseLog, BulkExpenseLog,
    ExpenseStats, EmotionalSpendingStats, MonthlySpendingBreakdown,
    SubmitReflection
)
from app.core.exceptions import NotFoundError, ValidationError


class ExpenseService:
    """Service for managing expenses and emotional tracking"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ============================================
    # CATEGORY OPERATIONS
    # ============================================
    
    def create_category(
        self,
        user_id: UUID,
        data: ExpenseCategoryCreate
    ) -> ExpenseCategory:
        """Create a user category"""
        
        category = ExpenseCategory(
            user_id=user_id,
            category_name=data.category_name,
            parent_category_id=data.parent_category_id,
            category_type=data.category_type.value,
            is_essential=data.is_essential,
            monthly_budget=data.monthly_budget,
            icon=data.icon,
            color=data.color,
            is_system_default=False
        )
        
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        
        return category
    
    def get_categories(
        self,
        user_id: UUID,
        include_system: bool = True
    ) -> List[ExpenseCategory]:
        """Get all categories for a user"""
        
        query = self.db.query(ExpenseCategory).filter(
            ExpenseCategory.is_active == True
        )
        
        if include_system:
            query = query.filter(
                (ExpenseCategory.user_id == user_id) | 
                (ExpenseCategory.is_system_default == True)
            )
        else:
            query = query.filter(ExpenseCategory.user_id == user_id)
        
        return query.order_by(ExpenseCategory.category_name).all()
    
    def create_default_categories(self, user_id: UUID) -> List[ExpenseCategory]:
        """Create default expense categories for a new user"""
        
        defaults = [
            ("Food & Groceries", "variable", True, "shopping-cart", "#4CAF50"),
            ("Eating Out", "discretionary", False, "utensils", "#FF9800"),
            ("Rent/Housing", "fixed", True, "home", "#2196F3"),
            ("Utilities", "variable", True, "zap", "#9C27B0"),
            ("Transportation", "variable", True, "car", "#607D8B"),
            ("Entertainment", "discretionary", False, "film", "#E91E63"),
            ("Shopping", "discretionary", False, "shopping-bag", "#00BCD4"),
            ("Healthcare", "variable", True, "heart", "#F44336"),
            ("Education", "fixed", True, "book", "#3F51B5"),
            ("Pet Care", "variable", True, "paw", "#795548"),
            ("Personal Care", "variable", False, "smile", "#FF5722"),
            ("Subscriptions", "fixed", False, "repeat", "#673AB7"),
            ("Gifts", "discretionary", False, "gift", "#CDDC39"),
        ]
        
        categories = []
        for name, cat_type, essential, icon, color in defaults:
            cat = ExpenseCategory(
                user_id=user_id,
                category_name=name,
                category_type=cat_type,
                is_essential=essential,
                icon=icon,
                color=color,
                is_system_default=False
            )
            self.db.add(cat)
            categories.append(cat)
        
        self.db.commit()
        return categories
    
    # ============================================
    # EXPENSE CRUD
    # ============================================
    
    def create_expense(
        self,
        user_id: UUID,
        data: ExpenseCreate
    ) -> Expense:
        """Create a new expense with optional emotion"""
        
        expense = Expense(
            user_id=user_id,
            category_id=data.category_id,
            expense_name=data.expense_name,
            description=data.description,
            amount=data.amount,
            expense_date=data.expense_date,
            expense_time=data.expense_time,
            merchant_name=data.merchant_name,
            location=data.location,
            payment_method=data.payment_method.value if data.payment_method else None,
            is_recurring=data.recurring_expense_id is not None,
            recurring_expense_id=data.recurring_expense_id,
            dependent_id=data.dependent_id,
            tags=data.tags,
            receipt_url=data.receipt_url,
            is_planned=data.is_planned,
            logged_immediately=data.logged_immediately,
            notes=data.notes
        )
        
        self.db.add(expense)
        self.db.flush()  # Get the expense_id
        
        # Add emotion if provided
        if data.emotion:
            self._add_emotion(expense.expense_id, user_id, data.emotion)
        
        # Update daily check-in
        self._update_daily_checkin(user_id, data.expense_date, data.amount)
        
        self.db.commit()
        self.db.refresh(expense)
        
        return expense
    
    def get_expense(
        self,
        expense_id: UUID,
        user_id: UUID
    ) -> Expense:
        """Get a single expense"""
        
        expense = self.db.query(Expense).filter(
            Expense.expense_id == expense_id,
            Expense.user_id == user_id
        ).first()
        
        if not expense:
            raise NotFoundError(f"Expense {expense_id} not found")
        
        return expense
    
    def get_expenses(
        self,
        user_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        category_id: Optional[UUID] = None,
        has_emotion: Optional[bool] = None,
        limit: int = 100
    ) -> List[Expense]:
        """Get expenses with filters"""
        
        query = self.db.query(Expense).filter(
            Expense.user_id == user_id
        )
        
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        
        if category_id:
            query = query.filter(Expense.category_id == category_id)
        
        if has_emotion is not None:
            if has_emotion:
                query = query.filter(Expense.emotion != None)
            else:
                query = query.filter(Expense.emotion == None)
        
        return query.order_by(
            Expense.expense_date.desc(),
            Expense.expense_time.desc()
        ).limit(limit).all()
    
    def update_expense(
        self,
        expense_id: UUID,
        user_id: UUID,
        data: ExpenseUpdate
    ) -> Expense:
        """Update an expense"""
        
        expense = self.get_expense(expense_id, user_id)
        
        update_data = data.model_dump(exclude_unset=True)
        
        if 'payment_method' in update_data and update_data['payment_method']:
            update_data['payment_method'] = update_data['payment_method'].value
        
        for field, value in update_data.items():
            setattr(expense, field, value)
        
        self.db.commit()
        self.db.refresh(expense)
        
        return expense
    
    def delete_expense(
        self,
        expense_id: UUID,
        user_id: UUID
    ) -> None:
        """Delete an expense"""
        
        expense = self.get_expense(expense_id, user_id)
        self.db.delete(expense)
        self.db.commit()
    
    # ============================================
    # EMOTIONAL TRACKING
    # ============================================
    
    def _add_emotion(
        self,
        expense_id: UUID,
        user_id: UUID,
        data: ExpenseEmotionCreate
    ) -> ExpenseEmotion:
        """Add emotion to an expense"""
        
        emotion = ExpenseEmotion(
            expense_id=expense_id,
            user_id=user_id,
            was_urgent=data.was_urgent,
            was_necessary=data.was_necessary,
            is_asset=data.is_asset,
            primary_emotion=data.primary_emotion.value,
            emotion_intensity=data.emotion_intensity,
            secondary_emotions=data.secondary_emotions,
            purchase_reason=data.purchase_reason,
            time_of_day=data.time_of_day.value if data.time_of_day else None,
            day_type=data.day_type.value if data.day_type else None,
            stress_level=data.stress_level,
            trigger_event=data.trigger_event
        )
        
        self.db.add(emotion)
        return emotion
    
    def add_emotion_to_expense(
        self,
        expense_id: UUID,
        user_id: UUID,
        data: ExpenseEmotionCreate
    ) -> ExpenseEmotion:
        """Add emotional context to an existing expense"""
        
        expense = self.get_expense(expense_id, user_id)
        
        # Check if emotion already exists
        if expense.emotion:
            raise ValidationError("Expense already has emotional data")
        
        emotion = self._add_emotion(expense_id, user_id, data)
        
        # Update daily checkin
        checkin = self._get_or_create_checkin(user_id, expense.expense_date)
        checkin.emotions_captured = True
        
        self.db.commit()
        self.db.refresh(emotion)
        
        return emotion
    
    def reflect_on_expense(
        self,
        expense_id: UUID,
        user_id: UUID,
        data: ExpenseEmotionReflection
    ) -> ExpenseEmotion:
        """Add reflection to an expense's emotional data"""
        
        expense = self.get_expense(expense_id, user_id)
        
        if not expense.emotion:
            raise ValidationError("No emotional data to reflect on")
        
        emotion = expense.emotion
        emotion.regret_level = data.regret_level
        emotion.brought_joy = data.brought_joy
        emotion.would_buy_again = data.would_buy_again
        emotion.reflection_notes = data.reflection_notes
        emotion.reflected_at = datetime.now(timezone.utc)
        
        self.db.commit()
        self.db.refresh(emotion)
        
        return emotion
    
    def get_unreflected_expenses(
        self,
        user_id: UUID,
        days_back: int = 7
    ) -> List[Expense]:
        """Get expenses with emotions but no reflection"""
        
        cutoff = date.today() - timedelta(days=days_back)
        
        return self.db.query(Expense).join(
            ExpenseEmotion
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= cutoff,
            ExpenseEmotion.reflected_at == None
        ).order_by(
            Expense.expense_date.desc()
        ).all()
    
    # ============================================
    # DAILY CHECK-IN
    # ============================================
    
    def _get_or_create_checkin(
        self,
        user_id: UUID,
        checkin_date: date
    ) -> DailyCheckin:
        """Get or create a daily check-in"""
        
        checkin = self.db.query(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.checkin_date == checkin_date
        ).first()
        
        if not checkin:
            # Calculate current streak
            yesterday = checkin_date - timedelta(days=1)
            yesterday_checkin = self.db.query(DailyCheckin).filter(
                DailyCheckin.user_id == user_id,
                DailyCheckin.checkin_date == yesterday,
                DailyCheckin.expenses_logged == True
            ).first()
            
            current_streak = (yesterday_checkin.current_streak + 1) if yesterday_checkin else 1
            
            checkin = DailyCheckin(
                user_id=user_id,
                checkin_date=checkin_date,
                current_streak=current_streak
            )
            self.db.add(checkin)
            self.db.flush()
        
        return checkin
    
    def _update_daily_checkin(
        self,
        user_id: UUID,
        expense_date: date,
        amount: Decimal
    ) -> DailyCheckin:
        """Update daily check-in when expense is added"""
        
        checkin = self._get_or_create_checkin(user_id, expense_date)
        checkin.total_spent_today = (checkin.total_spent_today or Decimal('0')) + amount
        checkin.expense_count = (checkin.expense_count or 0) + 1
        checkin.expenses_logged = True
        
        return checkin
    
    def get_daily_checkin(
        self,
        user_id: UUID,
        checkin_date: Optional[date] = None
    ) -> DailyCheckin:
        """Get daily check-in for a date"""
        
        checkin_date = checkin_date or date.today()
        return self._get_or_create_checkin(user_id, checkin_date)
    
    def complete_daily_checkin(
        self,
        user_id: UUID,
        data: DailyCheckinComplete
    ) -> DailyCheckin:
        """Complete the daily check-in"""
        
        checkin = self._get_or_create_checkin(user_id, date.today())
        
        checkin.expenses_logged = data.expenses_logged
        checkin.emotions_captured = data.emotions_captured
        checkin.overall_mood = data.overall_mood
        checkin.mood_notes = data.mood_notes
        checkin.completed_at = datetime.now(timezone.utc)
        
        # Update streak
        if data.expenses_logged:
            self._update_streak(user_id, 'daily_logging')
        
        self.db.commit()
        self.db.refresh(checkin)
        
        return checkin
    
    def _update_streak(
        self,
        user_id: UUID,
        streak_type: str
    ) -> SpendingStreak:
        """Update or create a spending streak"""
        
        streak = self.db.query(SpendingStreak).filter(
            SpendingStreak.user_id == user_id,
            SpendingStreak.streak_type == streak_type,
            SpendingStreak.is_active == True
        ).first()
        
        today = date.today()
        
        if not streak:
            streak = SpendingStreak(
                user_id=user_id,
                streak_type=streak_type,
                current_streak=1,
                longest_streak=1,
                streak_start_date=today,
                last_activity_date=today
            )
            self.db.add(streak)
        else:
            # Check if streak continues
            if streak.last_activity_date == today - timedelta(days=1):
                streak.current_streak += 1
                streak.longest_streak = max(streak.longest_streak, streak.current_streak)
            elif streak.last_activity_date != today:
                # Streak broken, restart
                streak.current_streak = 1
                streak.streak_start_date = today
            
            streak.last_activity_date = today
        
        return streak
    
    def get_streaks(self, user_id: UUID) -> List[SpendingStreak]:
        """Get all active streaks for a user"""
        
        return self.db.query(SpendingStreak).filter(
            SpendingStreak.user_id == user_id,
            SpendingStreak.is_active == True
        ).all()
    
    # ============================================
    # QUICK LOGGING
    # ============================================
    
    def quick_log(
        self,
        user_id: UUID,
        data: QuickExpenseLog
    ) -> Expense:
        """Quick expense logging with minimal fields"""
        
        expense_data = ExpenseCreate(
            expense_name=data.expense_name,
            amount=data.amount,
            category_id=data.category_id,
            expense_date=date.today(),
            logged_immediately=True
        )
        
        if data.primary_emotion:
            expense_data.emotion = ExpenseEmotionCreate(
                primary_emotion=data.primary_emotion,
                was_necessary=data.was_necessary or False,
                purchase_reason=data.quick_reason or "Quick log"
            )
        
        return self.create_expense(user_id, expense_data)
    
    def bulk_log(
        self,
        user_id: UUID,
        data: BulkExpenseLog
    ) -> Tuple[List[Expense], DailyCheckin]:
        """Log multiple expenses at once (end of day)"""
        
        expenses = []
        for expense_data in data.expenses:
            expense = self.create_expense(user_id, expense_data)
            expenses.append(expense)
        
        # Complete check-in
        checkin = self._get_or_create_checkin(user_id, data.checkin_date)
        checkin.overall_mood = data.overall_mood
        checkin.expenses_logged = True
        checkin.completed_at = datetime.now(timezone.utc)
        
        self.db.commit()
        
        return expenses, checkin
    
    # ============================================
    # STATISTICS
    # ============================================
    
    def get_expense_stats(
        self,
        user_id: UUID,
        month: Optional[int] = None,
        year: Optional[int] = None
    ) -> ExpenseStats:
        """Get expense statistics"""
        
        today = date.today()
        month = month or today.month
        year = year or today.year
        
        # Today's spending
        today_expenses = self.db.query(
            func.sum(Expense.amount),
            func.count(Expense.expense_id)
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date == today
        ).first()
        
        total_today = float(today_expenses[0] or 0)
        count_today = today_expenses[1] or 0
        
        # This week
        week_start = today - timedelta(days=today.weekday())
        week_total = self.db.query(
            func.sum(Expense.amount)
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= week_start
        ).scalar() or 0
        
        # This month
        month_start = today.replace(day=1)
        month_expenses = self.db.query(
            func.sum(Expense.amount),
            func.count(Expense.expense_id)
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= month_start
        ).first()
        
        total_month = float(month_expenses[0] or 0)
        count_month = month_expenses[1] or 0
        
        # Daily average
        days_in_month = today.day
        daily_avg = total_month / days_in_month if days_in_month > 0 else 0
        
        # By category
        by_category = self._get_spending_by_category(user_id, month_start, today)
        
        # By payment method
        by_payment = self._get_spending_by_payment_method(user_id, month_start, today)
        
        # Essential vs discretionary
        essential, discretionary = self._get_essential_vs_discretionary(user_id, month_start, today)
        
        return ExpenseStats(
            total_spent_today=Decimal(str(round(total_today, 2))),
            total_spent_this_week=Decimal(str(round(float(week_total), 2))),
            total_spent_this_month=Decimal(str(round(total_month, 2))),
            daily_average=Decimal(str(round(daily_avg, 2))),
            by_category=by_category,
            by_payment_method=by_payment,
            essential_spending=essential,
            discretionary_spending=discretionary,
            expense_count_today=count_today,
            expense_count_month=count_month
        )
    
    def _get_spending_by_category(
        self,
        user_id: UUID,
        start_date: date,
        end_date: date
    ) -> Dict[str, Decimal]:
        """Get spending breakdown by category"""
        
        results = self.db.query(
            ExpenseCategory.category_name,
            func.sum(Expense.amount)
        ).join(
            Expense,
            Expense.category_id == ExpenseCategory.category_id
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date
        ).group_by(
            ExpenseCategory.category_name
        ).all()
        
        return {name: Decimal(str(round(float(amount), 2))) for name, amount in results}
    
    def _get_spending_by_payment_method(
        self,
        user_id: UUID,
        start_date: date,
        end_date: date
    ) -> Dict[str, Decimal]:
        """Get spending by payment method"""
        
        results = self.db.query(
            Expense.payment_method,
            func.sum(Expense.amount)
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date,
            Expense.payment_method != None
        ).group_by(
            Expense.payment_method
        ).all()
        
        return {method or "unknown": Decimal(str(round(float(amount), 2))) for method, amount in results}
    
    def _get_essential_vs_discretionary(
        self,
        user_id: UUID,
        start_date: date,
        end_date: date
    ) -> Tuple[Decimal, Decimal]:
        """Get essential vs discretionary spending"""
        
        essential = self.db.query(
            func.sum(Expense.amount)
        ).join(
            ExpenseCategory
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date,
            ExpenseCategory.is_essential == True
        ).scalar() or 0
        
        discretionary = self.db.query(
            func.sum(Expense.amount)
        ).join(
            ExpenseCategory
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date,
            ExpenseCategory.is_essential == False
        ).scalar() or 0
        
        return Decimal(str(round(float(essential), 2))), Decimal(str(round(float(discretionary), 2)))
    
    def get_emotional_stats(
        self,
        user_id: UUID,
        month: Optional[int] = None,
        year: Optional[int] = None
    ) -> EmotionalSpendingStats:
        """Get emotional spending analysis"""
        
        today = date.today()
        month = month or today.month
        year = year or today.year
        
        month_start = date(year, month, 1)
        if month == 12:
            month_end = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(year, month + 1, 1) - timedelta(days=1)
        
        # Get all emotional expenses for the month
        emotional_expenses = self.db.query(
            Expense, ExpenseEmotion
        ).join(
            ExpenseEmotion
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= month_start,
            Expense.expense_date <= month_end
        ).all()
        
        # Total spending
        total_month = self.db.query(
            func.sum(Expense.amount)
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= month_start,
            Expense.expense_date <= month_end
        ).scalar() or 0
        
        # Emotional spending (non-necessary, non-planned)
        emotional_amount = sum(
            float(e.amount) for e, em in emotional_expenses
            if not em.was_necessary
        )
        
        emotional_pct = (emotional_amount / float(total_month) * 100) if total_month > 0 else 0
        
        # By emotion
        by_emotion: Dict[str, float] = {}
        for expense, emotion in emotional_expenses:
            em = emotion.primary_emotion
            by_emotion[em] = by_emotion.get(em, 0) + float(expense.amount)
        
        # By time of day
        by_time: Dict[str, float] = {}
        for expense, emotion in emotional_expenses:
            if emotion.time_of_day:
                by_time[emotion.time_of_day] = by_time.get(emotion.time_of_day, 0) + float(expense.amount)
        
        # By day type
        by_day: Dict[str, float] = {}
        for expense, emotion in emotional_expenses:
            if emotion.day_type:
                by_day[emotion.day_type] = by_day.get(emotion.day_type, 0) + float(expense.amount)
        
        # Averages
        stress_levels = [em.stress_level for _, em in emotional_expenses if em.stress_level]
        avg_stress = sum(stress_levels) / len(stress_levels) if stress_levels else 0
        
        regret_levels = [em.regret_level for _, em in emotional_expenses if em.regret_level]
        avg_regret = sum(regret_levels) / len(regret_levels) if regret_levels else 0
        
        # Top triggers
        triggers = [em.trigger_event for _, em in emotional_expenses if em.trigger_event]
        trigger_counts = {}
        for t in triggers:
            trigger_counts[t] = trigger_counts.get(t, 0) + 1
        top_triggers = sorted(trigger_counts.keys(), key=lambda x: trigger_counts[x], reverse=True)[:5]
        
        # Highest spending emotion
        highest_emotion = max(by_emotion.keys(), key=lambda x: by_emotion[x]) if by_emotion else "none"
        
        # Joy and regret counts
        joy_count = sum(1 for _, em in emotional_expenses if em.brought_joy)
        regret_count = sum(1 for _, em in emotional_expenses if em.regret_level and em.regret_level >= 7)
        
        return EmotionalSpendingStats(
            total_emotional_spending=Decimal(str(round(emotional_amount, 2))),
            emotional_spending_percentage=round(emotional_pct, 2),
            by_emotion={k: Decimal(str(round(v, 2))) for k, v in by_emotion.items()},
            by_time_of_day={k: Decimal(str(round(v, 2))) for k, v in by_time.items()},
            by_day_type={k: Decimal(str(round(v, 2))) for k, v in by_day.items()},
            average_stress_level=round(avg_stress, 2),
            average_regret_level=round(avg_regret, 2),
            top_triggers=top_triggers,
            highest_spending_emotion=highest_emotion,
            purchases_with_regret=regret_count,
            purchases_that_brought_joy=joy_count
        )