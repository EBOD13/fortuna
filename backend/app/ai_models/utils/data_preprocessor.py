# backend/app/ai_models/utils/data_preprocessor.py
"""
Data Preprocessor
Prepare and transform data for ML models
"""

from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, date, timedelta
from uuid import UUID

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.models.expense import Expense, ExpenseEmotion, ExpenseCategory
from app.models.income import IncomeSource, IncomeHistory
from app.models.goal import FinancialGoal, GoalProgressHistory
from app.models.recurring_expense import RecurringExpense


class DataPreprocessor:
    """
    Prepare data from database for ML model training and prediction.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_expenses(
        self,
        user_id: UUID,
        days_back: int = 365,
        include_emotions: bool = True
    ) -> pd.DataFrame:
        """
        Get user's expense history as a DataFrame.
        """
        cutoff_date = date.today() - timedelta(days=days_back)
        
        query = self.db.query(Expense).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= cutoff_date
        ).order_by(Expense.expense_date)
        
        expenses = query.all()
        
        if not expenses:
            return pd.DataFrame()
        
        data = []
        for exp in expenses:
            record = {
                'expense_id': str(exp.expense_id),
                'user_id': str(exp.user_id),
                'expense_date': exp.expense_date,
                'amount': float(exp.amount),
                'category_id': str(exp.category_id) if exp.category_id else None,
                'category_name': exp.category.category_name if exp.category else 'Uncategorized',
                'merchant_name': exp.merchant_name,
                'is_recurring': exp.is_recurring,
                'is_planned': exp.is_planned,
                'payment_method': exp.payment_method,
            }
            
            # Add emotional data
            if include_emotions and exp.emotion:
                em = exp.emotion
                record.update({
                    'primary_emotion': em.primary_emotion,
                    'emotion_intensity': em.emotion_intensity,
                    'stress_level': em.stress_level,
                    'was_urgent': em.was_urgent,
                    'was_necessary': em.was_necessary,
                    'is_asset': em.is_asset,
                    'regret_level': em.regret_level,
                    'brought_joy': em.brought_joy,
                    'time_of_day': em.time_of_day,
                    'day_type': em.day_type,
                    'trigger_event': em.trigger_event,
                })
            
            data.append(record)
        
        return pd.DataFrame(data)
    
    def get_user_income(
        self,
        user_id: UUID,
        days_back: int = 365
    ) -> pd.DataFrame:
        """
        Get user's income history as a DataFrame.
        """
        cutoff_date = date.today() - timedelta(days=days_back)
        
        history = self.db.query(IncomeHistory).join(IncomeSource).filter(
            IncomeSource.user_id == user_id,
            IncomeHistory.payment_date >= cutoff_date
        ).order_by(IncomeHistory.payment_date).all()
        
        if not history:
            return pd.DataFrame()
        
        data = []
        for inc in history:
            record = {
                'history_id': str(inc.history_id),
                'income_id': str(inc.income_id),
                'payment_date': inc.payment_date,
                'gross_amount': float(inc.gross_amount),
                'net_amount': float(inc.net_amount),
                'total_deductions': float(inc.total_deductions or 0),
                'source_name': inc.income_source.source_name if inc.income_source else None,
                'source_type': inc.income_source.source_type if inc.income_source else None,
            }
            data.append(record)
        
        return pd.DataFrame(data)
    
    def get_user_goals(self, user_id: UUID) -> pd.DataFrame:
        """
        Get user's financial goals as a DataFrame.
        """
        goals = self.db.query(FinancialGoal).filter(
            FinancialGoal.user_id == user_id
        ).all()
        
        if not goals:
            return pd.DataFrame()
        
        data = []
        for goal in goals:
            record = {
                'goal_id': str(goal.goal_id),
                'user_id': str(goal.user_id),
                'goal_name': goal.goal_name,
                'goal_type': goal.goal_type,
                'target_amount': float(goal.target_amount),
                'current_amount': float(goal.current_amount or 0),
                'deadline_date': goal.deadline_date,
                'priority_level': goal.priority_level,
                'is_mandatory': goal.is_mandatory,
                'monthly_allocation': float(goal.monthly_allocation or 0),
                'status': goal.status,
                'created_at': goal.created_at,
            }
            data.append(record)
        
        return pd.DataFrame(data)
    
    def get_daily_spending_summary(
        self,
        user_id: UUID,
        days_back: int = 365
    ) -> pd.DataFrame:
        """
        Get daily spending summary for time series analysis.
        """
        expenses_df = self.get_user_expenses(user_id, days_back, include_emotions=False)
        
        if expenses_df.empty:
            return pd.DataFrame()
        
        # Aggregate by day
        daily = expenses_df.groupby('expense_date').agg({
            'amount': ['sum', 'count', 'mean', 'std'],
        }).reset_index()
        
        daily.columns = ['date', 'total_spent', 'transaction_count', 'avg_transaction', 'std_transaction']
        daily['std_transaction'] = daily['std_transaction'].fillna(0)
        
        # Fill missing dates with zeros
        date_range = pd.date_range(
            start=daily['date'].min(),
            end=daily['date'].max(),
            freq='D'
        )
        
        daily = daily.set_index('date').reindex(date_range, fill_value=0).reset_index()
        daily.columns = ['date', 'total_spent', 'transaction_count', 'avg_transaction', 'std_transaction']
        daily['user_id'] = str(user_id)
        
        return daily
    
    def get_weekly_category_spending(
        self,
        user_id: UUID,
        weeks_back: int = 52
    ) -> pd.DataFrame:
        """
        Get weekly spending by category.
        """
        days_back = weeks_back * 7
        expenses_df = self.get_user_expenses(user_id, days_back, include_emotions=False)
        
        if expenses_df.empty:
            return pd.DataFrame()
        
        expenses_df['week'] = pd.to_datetime(expenses_df['expense_date']).dt.isocalendar().week
        expenses_df['year'] = pd.to_datetime(expenses_df['expense_date']).dt.year
        
        weekly = expenses_df.groupby(['year', 'week', 'category_name']).agg({
            'amount': 'sum'
        }).reset_index()
        
        weekly.columns = ['year', 'week', 'category', 'amount']
        
        return weekly
    
    def get_emotional_spending_data(
        self,
        user_id: UUID,
        days_back: int = 365
    ) -> pd.DataFrame:
        """
        Get expenses with emotional data for pattern analysis.
        """
        expenses_df = self.get_user_expenses(user_id, days_back, include_emotions=True)
        
        if expenses_df.empty:
            return pd.DataFrame()
        
        # Filter to only expenses with emotional data
        emotional_cols = ['primary_emotion', 'stress_level', 'was_necessary']
        has_emotion = expenses_df['primary_emotion'].notna()
        
        return expenses_df[has_emotion].copy()
    
    def prepare_spending_prediction_data(
        self,
        user_id: UUID,
        sequence_length: int = 30
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare data for spending prediction model.
        
        Returns:
            Tuple of (X sequences, y targets) for training
        """
        from app.ai_models.utils.feature_engineering import FeatureEngineer
        
        daily_df = self.get_daily_spending_summary(user_id, days_back=365)
        
        if daily_df.empty or len(daily_df) < sequence_length + 1:
            return np.array([]), np.array([])
        
        # Add time features
        daily_df = FeatureEngineer.create_time_features(daily_df, 'date')
        
        # Create sequences
        X, y = FeatureEngineer.create_sequence_features(
            daily_df,
            group_col='user_id',
            value_col='total_spent',
            sequence_length=sequence_length
        )
        
        return X, y
    
    def prepare_goal_achievement_data(
        self,
        user_id: UUID
    ) -> pd.DataFrame:
        """
        Prepare data for goal achievement prediction.
        """
        from app.ai_models.utils.feature_engineering import FeatureEngineer
        
        goals_df = self.get_user_goals(user_id)
        
        if goals_df.empty:
            return pd.DataFrame()
        
        # Add goal features
        goals_df = FeatureEngineer.create_goal_features(goals_df)
        
        # Get income data for context
        income_df = self.get_user_income(user_id)
        if not income_df.empty:
            monthly_income = income_df.groupby(
                pd.Grouper(key='payment_date', freq='M')
            )['net_amount'].sum().mean()
            goals_df['avg_monthly_income'] = monthly_income
        else:
            goals_df['avg_monthly_income'] = 0
        
        # Get expense data for context
        expenses_df = self.get_user_expenses(user_id, days_back=90, include_emotions=False)
        if not expenses_df.empty:
            avg_daily_spending = expenses_df.groupby('expense_date')['amount'].sum().mean()
            goals_df['avg_daily_spending'] = avg_daily_spending
        else:
            goals_df['avg_daily_spending'] = 0
        
        return goals_df
    
    def generate_synthetic_data(
        self,
        user_id: UUID,
        days: int = 365
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Generate synthetic expense and income data for testing.
        Useful for new users or testing models.
        
        Returns:
            Tuple of (expenses_df, income_df)
        """
        np.random.seed(42)
        
        dates = pd.date_range(end=date.today(), periods=days, freq='D')
        
        # Generate expenses
        expenses = []
        categories = ['Food & Groceries', 'Eating Out', 'Transportation', 
                     'Entertainment', 'Shopping', 'Utilities', 'Healthcare']
        emotions = ['happy', 'stressed', 'bored', 'tired', 'planned', 'impulsive', 'neutral']
        
        for d in dates:
            # 1-5 transactions per day
            n_transactions = np.random.poisson(2) + 1
            
            for _ in range(n_transactions):
                category = np.random.choice(categories)
                
                # Base amount depends on category
                base_amounts = {
                    'Food & Groceries': 30, 'Eating Out': 20, 'Transportation': 15,
                    'Entertainment': 25, 'Shopping': 50, 'Utilities': 100, 'Healthcare': 75
                }
                
                amount = np.random.exponential(base_amounts.get(category, 30))
                amount = round(max(5, min(500, amount)), 2)
                
                # Weekend effect
                if d.weekday() >= 5:
                    amount *= 1.3
                
                expenses.append({
                    'user_id': str(user_id),
                    'expense_date': d.date(),
                    'amount': amount,
                    'category_name': category,
                    'primary_emotion': np.random.choice(emotions),
                    'stress_level': np.random.randint(1, 11),
                    'was_necessary': np.random.random() > 0.3,
                    'is_planned': np.random.random() > 0.5,
                })
        
        expenses_df = pd.DataFrame(expenses)
        
        # Generate income (bi-weekly)
        income = []
        pay_dates = pd.date_range(end=date.today(), periods=days//14, freq='2W')
        
        for d in pay_dates:
            income.append({
                'user_id': str(user_id),
                'payment_date': d.date(),
                'gross_amount': 2000 + np.random.normal(0, 100),
                'net_amount': 1600 + np.random.normal(0, 80),
                'source_name': 'Primary Job',
            })
        
        income_df = pd.DataFrame(income)
        
        return expenses_df, income_df