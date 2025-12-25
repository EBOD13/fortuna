# backend/app/ai_models/utils/feature_engineering.py
"""
Feature Engineering
Transform raw financial data into ML-ready features
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, date, timedelta
from decimal import Decimal

import numpy as np
import pandas as pd


class FeatureEngineer:
    """
    Feature engineering for financial data.
    Creates time-based, categorical, and behavioral features.
    """
    
    @staticmethod
    def create_time_features(df: pd.DataFrame, date_column: str = 'date') -> pd.DataFrame:
        """
        Extract time-based features from date column.
        
        Features created:
        - day_of_week (0-6)
        - day_of_month (1-31)
        - week_of_year (1-52)
        - month (1-12)
        - quarter (1-4)
        - is_weekend (bool)
        - is_month_start (bool)
        - is_month_end (bool)
        - is_payday (bool) - assumed 1st and 15th
        """
        df = df.copy()
        
        if date_column not in df.columns:
            raise ValueError(f"Date column '{date_column}' not found")
        
        dates = pd.to_datetime(df[date_column])
        
        df['day_of_week'] = dates.dt.dayofweek
        df['day_of_month'] = dates.dt.day
        df['week_of_year'] = dates.dt.isocalendar().week.astype(int)
        df['month'] = dates.dt.month
        df['quarter'] = dates.dt.quarter
        df['year'] = dates.dt.year
        
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_month_start'] = (df['day_of_month'] <= 5).astype(int)
        df['is_month_end'] = (df['day_of_month'] >= 25).astype(int)
        df['is_payday'] = df['day_of_month'].isin([1, 15]).astype(int)
        
        return df
    
    @staticmethod
    def create_spending_features(expenses_df: pd.DataFrame) -> pd.DataFrame:
        """
        Create spending pattern features from expense history.
        
        Features:
        - rolling averages (7, 14, 30 days)
        - spending velocity (rate of change)
        - category concentration
        - spending volatility
        """
        df = expenses_df.copy()
        df = df.sort_values('expense_date')
        
        # Rolling spending averages
        df['rolling_7d_avg'] = df.groupby('user_id')['amount'].transform(
            lambda x: x.rolling(7, min_periods=1).mean()
        )
        df['rolling_14d_avg'] = df.groupby('user_id')['amount'].transform(
            lambda x: x.rolling(14, min_periods=1).mean()
        )
        df['rolling_30d_avg'] = df.groupby('user_id')['amount'].transform(
            lambda x: x.rolling(30, min_periods=1).mean()
        )
        
        # Spending velocity (daily change rate)
        df['spending_velocity'] = df.groupby('user_id')['amount'].transform(
            lambda x: x.diff().fillna(0)
        )
        
        # Volatility (rolling std)
        df['spending_volatility'] = df.groupby('user_id')['amount'].transform(
            lambda x: x.rolling(14, min_periods=1).std().fillna(0)
        )
        
        return df
    
    @staticmethod
    def create_category_features(expenses_df: pd.DataFrame) -> pd.DataFrame:
        """
        Create category-based spending features.
        """
        df = expenses_df.copy()
        
        # Category frequency
        category_counts = df.groupby(['user_id', 'category_name']).size().reset_index(name='category_frequency')
        df = df.merge(category_counts, on=['user_id', 'category_name'], how='left')
        
        # Category average spending
        category_avg = df.groupby(['user_id', 'category_name'])['amount'].mean().reset_index(name='category_avg_spend')
        df = df.merge(category_avg, on=['user_id', 'category_name'], how='left')
        
        return df
    
    @staticmethod
    def create_emotional_features(expenses_df: pd.DataFrame) -> pd.DataFrame:
        """
        Create emotional spending features.
        
        Features:
        - emotion encoded
        - stress level normalized
        - was_impulsive (derived)
        - emotional_spending_streak
        """
        df = expenses_df.copy()
        
        # Emotion encoding (one-hot or ordinal)
        emotion_map = {
            'happy': 1, 'excited': 2, 'celebratory': 3,  # Positive
            'neutral': 0, 'planned': 0,  # Neutral
            'bored': -1, 'tired': -1,  # Low energy
            'stressed': -2, 'anxious': -2, 'frustrated': -2,  # Negative
            'sad': -3, 'guilty': -3, 'impulsive': -2  # High risk
        }
        
        if 'primary_emotion' in df.columns:
            df['emotion_score'] = df['primary_emotion'].map(emotion_map).fillna(0)
            
            # Impulsive indicator
            df['was_impulsive'] = (
                (df['primary_emotion'].isin(['impulsive', 'bored', 'stressed'])) |
                (df.get('was_necessary', True) == False)
            ).astype(int)
        
        # Normalize stress level
        if 'stress_level' in df.columns:
            df['stress_normalized'] = df['stress_level'].fillna(5) / 10.0
        
        return df
    
    @staticmethod
    def create_income_features(income_df: pd.DataFrame, expenses_df: pd.DataFrame) -> pd.DataFrame:
        """
        Create income-relative features.
        
        Features:
        - spending_to_income_ratio
        - days_since_payday
        - budget_remaining_pct
        """
        # Aggregate monthly income
        income_monthly = income_df.groupby(
            ['user_id', pd.Grouper(key='payment_date', freq='M')]
        )['net_amount'].sum().reset_index()
        income_monthly.columns = ['user_id', 'month', 'monthly_income']
        
        # Aggregate monthly spending
        expenses_monthly = expenses_df.groupby(
            ['user_id', pd.Grouper(key='expense_date', freq='M')]
        )['amount'].sum().reset_index()
        expenses_monthly.columns = ['user_id', 'month', 'monthly_spending']
        
        # Merge
        merged = income_monthly.merge(expenses_monthly, on=['user_id', 'month'], how='outer')
        merged = merged.fillna(0)
        
        # Calculate ratios
        merged['spending_to_income_ratio'] = np.where(
            merged['monthly_income'] > 0,
            merged['monthly_spending'] / merged['monthly_income'],
            0
        )
        
        merged['budget_remaining'] = merged['monthly_income'] - merged['monthly_spending']
        merged['budget_remaining_pct'] = np.where(
            merged['monthly_income'] > 0,
            merged['budget_remaining'] / merged['monthly_income'],
            0
        )
        
        return merged
    
    @staticmethod
    def create_goal_features(goals_df: pd.DataFrame) -> pd.DataFrame:
        """
        Create goal achievement features.
        
        Features:
        - completion_rate
        - days_to_deadline
        - required_daily_savings
        - savings_velocity
        - on_track_indicator
        """
        df = goals_df.copy()
        
        today = date.today()
        
        # Completion rate
        df['completion_rate'] = np.where(
            df['target_amount'] > 0,
            df['current_amount'] / df['target_amount'],
            0
        )
        
        # Days to deadline
        if 'deadline_date' in df.columns:
            df['days_to_deadline'] = df['deadline_date'].apply(
                lambda x: (x - today).days if pd.notna(x) else 365
            )
            df['days_to_deadline'] = df['days_to_deadline'].clip(lower=0)
        
        # Required daily savings
        df['remaining_amount'] = df['target_amount'] - df['current_amount']
        df['required_daily_savings'] = np.where(
            df['days_to_deadline'] > 0,
            df['remaining_amount'] / df['days_to_deadline'],
            df['remaining_amount']
        )
        
        return df
    
    @staticmethod
    def create_sequence_features(
        df: pd.DataFrame,
        group_col: str,
        value_col: str,
        sequence_length: int = 30
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create sequences for time series models (LSTM).
        
        Args:
            df: DataFrame with time series data
            group_col: Column to group by (e.g., user_id)
            value_col: Column with values to predict
            sequence_length: Length of input sequences
            
        Returns:
            Tuple of (X sequences, y targets)
        """
        sequences = []
        targets = []
        
        for _, group in df.groupby(group_col):
            values = group[value_col].values
            
            for i in range(len(values) - sequence_length):
                sequences.append(values[i:i + sequence_length])
                targets.append(values[i + sequence_length])
        
        return np.array(sequences), np.array(targets)
    
    @staticmethod
    def normalize_features(df: pd.DataFrame, columns: List[str]) -> Tuple[pd.DataFrame, Dict]:
        """
        Normalize numerical features to 0-1 range.
        
        Returns:
            Tuple of (normalized df, normalization params)
        """
        df = df.copy()
        params = {}
        
        for col in columns:
            if col in df.columns:
                min_val = df[col].min()
                max_val = df[col].max()
                
                if max_val > min_val:
                    df[col] = (df[col] - min_val) / (max_val - min_val)
                else:
                    df[col] = 0
                
                params[col] = {'min': min_val, 'max': max_val}
        
        return df, params
    
    @staticmethod
    def encode_categorical(df: pd.DataFrame, columns: List[str]) -> Tuple[pd.DataFrame, Dict]:
        """
        One-hot encode categorical columns.
        
        Returns:
            Tuple of (encoded df, encoding mappings)
        """
        df = df.copy()
        mappings = {}
        
        for col in columns:
            if col in df.columns:
                dummies = pd.get_dummies(df[col], prefix=col)
                mappings[col] = list(dummies.columns)
                df = pd.concat([df.drop(col, axis=1), dummies], axis=1)
        
        return df, mappings