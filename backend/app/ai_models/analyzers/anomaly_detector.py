# backend/app/ai_models/analyzers/anomaly_detector.py
"""
Anomaly Detector
Detect unusual spending patterns and flag potential issues
Uses Isolation Forest and statistical methods
"""

from typing import Dict, List, Optional, Tuple
from datetime import date, datetime, timedelta
import logging

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from scipy import stats

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """
    Detect anomalous spending patterns.
    
    Types of anomalies detected:
    - Unusually high single transactions
    - Unusual daily totals
    - Unusual category spending
    - Unusual timing patterns
    - Spending velocity anomalies
    """
    
    def __init__(self, contamination: float = 0.05):
        """
        Args:
            contamination: Expected proportion of anomalies (default 5%)
        """
        self.contamination = contamination
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        self.scaler = StandardScaler()
        self.is_fitted = False
        
        # Store statistics for rule-based detection
        self.stats: Dict[str, Dict] = {}
    
    def fit(self, expenses_df: pd.DataFrame) -> 'AnomalyDetector':
        """
        Fit the anomaly detector on historical data.
        
        Args:
            expenses_df: DataFrame with expense history
            
        Returns:
            self
        """
        if expenses_df.empty:
            logger.warning("Empty DataFrame provided for fitting")
            return self
        
        # Calculate statistics
        self._calculate_statistics(expenses_df)
        
        # Prepare features for Isolation Forest
        features = self._create_anomaly_features(expenses_df)
        
        if len(features) > 10:
            # Scale and fit
            features_scaled = self.scaler.fit_transform(features)
            self.model.fit(features_scaled)
            self.is_fitted = True
            logger.info("Anomaly detector fitted successfully")
        else:
            logger.warning("Not enough data to fit Isolation Forest")
        
        return self
    
    def _calculate_statistics(self, df: pd.DataFrame) -> None:
        """Calculate baseline statistics for anomaly detection."""
        
        # Overall spending stats
        self.stats['amount'] = {
            'mean': df['amount'].mean(),
            'std': df['amount'].std(),
            'median': df['amount'].median(),
            'q1': df['amount'].quantile(0.25),
            'q3': df['amount'].quantile(0.75),
            'iqr': df['amount'].quantile(0.75) - df['amount'].quantile(0.25),
        }
        
        # Daily totals
        daily = df.groupby('expense_date')['amount'].sum()
        self.stats['daily'] = {
            'mean': daily.mean(),
            'std': daily.std(),
            'median': daily.median(),
        }
        
        # Category stats
        if 'category_name' in df.columns:
            category_stats = {}
            for cat in df['category_name'].unique():
                cat_data = df[df['category_name'] == cat]['amount']
                category_stats[cat] = {
                    'mean': cat_data.mean(),
                    'std': cat_data.std() if len(cat_data) > 1 else cat_data.mean() * 0.3,
                    'count': len(cat_data),
                }
            self.stats['categories'] = category_stats
        
        # Day of week stats
        if 'expense_date' in df.columns:
            df_copy = df.copy()
            df_copy['dow'] = pd.to_datetime(df_copy['expense_date']).dt.dayofweek
            dow_stats = df_copy.groupby('dow')['amount'].agg(['mean', 'std'])
            self.stats['day_of_week'] = dow_stats.to_dict()
    
    def _create_anomaly_features(self, df: pd.DataFrame) -> np.ndarray:
        """Create features for Isolation Forest."""
        features = []
        
        for _, row in df.iterrows():
            amount = row['amount']
            
            # Normalized amount
            amount_z = (amount - self.stats['amount']['mean']) / (self.stats['amount']['std'] + 1e-6)
            
            # Category deviation
            cat = row.get('category_name', 'Unknown')
            if cat in self.stats.get('categories', {}):
                cat_stats = self.stats['categories'][cat]
                cat_z = (amount - cat_stats['mean']) / (cat_stats['std'] + 1e-6)
            else:
                cat_z = 0
            
            features.append([amount, amount_z, cat_z])
        
        return np.array(features)
    
    def detect_anomalies(
        self,
        expenses_df: pd.DataFrame,
        return_scores: bool = False
    ) -> pd.DataFrame:
        """
        Detect anomalies in expense data.
        
        Args:
            expenses_df: DataFrame with expenses to analyze
            return_scores: Whether to include anomaly scores
            
        Returns:
            DataFrame with anomaly flags and details
        """
        if expenses_df.empty:
            return pd.DataFrame()
        
        results = expenses_df.copy()
        results['is_anomaly'] = False
        results['anomaly_type'] = None
        results['anomaly_score'] = 0.0
        results['anomaly_reason'] = None
        
        # Rule-based detection
        results = self._detect_amount_anomalies(results)
        results = self._detect_category_anomalies(results)
        results = self._detect_timing_anomalies(results)
        
        # ML-based detection
        if self.is_fitted and len(expenses_df) > 0:
            features = self._create_anomaly_features(expenses_df)
            features_scaled = self.scaler.transform(features)
            
            # Isolation Forest prediction (-1 = anomaly, 1 = normal)
            predictions = self.model.predict(features_scaled)
            scores = self.model.decision_function(features_scaled)
            
            # Mark ML-detected anomalies
            ml_anomalies = predictions == -1
            results.loc[ml_anomalies & ~results['is_anomaly'], 'is_anomaly'] = True
            results.loc[ml_anomalies & results['anomaly_type'].isna(), 'anomaly_type'] = 'pattern'
            results.loc[ml_anomalies & results['anomaly_reason'].isna(), 'anomaly_reason'] = 'Unusual pattern detected by ML model'
            
            # Add scores (lower = more anomalous)
            results['ml_score'] = -scores  # Invert so higher = more anomalous
        
        return results
    
    def _detect_amount_anomalies(self, df: pd.DataFrame) -> pd.DataFrame:
        """Detect anomalies based on transaction amounts."""
        if 'amount' not in self.stats:
            return df
        
        stats = self.stats['amount']
        
        # IQR-based outliers
        lower_bound = stats['q1'] - 1.5 * stats['iqr']
        upper_bound = stats['q3'] + 1.5 * stats['iqr']
        
        high_amount = df['amount'] > upper_bound
        very_high = df['amount'] > stats['mean'] + 3 * stats['std']
        
        df.loc[high_amount, 'is_anomaly'] = True
        df.loc[high_amount, 'anomaly_type'] = 'high_amount'
        df.loc[high_amount, 'anomaly_reason'] = f'Amount exceeds typical range (>${upper_bound:.2f})'
        
        df.loc[very_high, 'anomaly_type'] = 'very_high_amount'
        df.loc[very_high, 'anomaly_reason'] = f'Amount significantly exceeds average (3+ std dev)'
        
        return df
    
    def _detect_category_anomalies(self, df: pd.DataFrame) -> pd.DataFrame:
        """Detect anomalies within categories."""
        if 'categories' not in self.stats or 'category_name' not in df.columns:
            return df
        
        for cat, stats in self.stats['categories'].items():
            cat_mask = df['category_name'] == cat
            
            # Z-score within category
            z_threshold = 2.5
            upper = stats['mean'] + z_threshold * stats['std']
            
            high_for_cat = cat_mask & (df['amount'] > upper) & ~df['is_anomaly']
            
            df.loc[high_for_cat, 'is_anomaly'] = True
            df.loc[high_for_cat, 'anomaly_type'] = 'category_outlier'
            df.loc[high_for_cat, 'anomaly_reason'] = f'Unusually high for {cat} (typical: ${stats["mean"]:.2f})'
        
        return df
    
    def _detect_timing_anomalies(self, df: pd.DataFrame) -> pd.DataFrame:
        """Detect anomalies based on timing patterns."""
        if 'expense_date' not in df.columns:
            return df
        
        df_copy = df.copy()
        df_copy['dow'] = pd.to_datetime(df_copy['expense_date']).dt.dayofweek
        df_copy['hour'] = pd.to_datetime(df_copy.get('expense_time', '12:00')).dt.hour if 'expense_time' in df_copy.columns else 12
        
        # Late night spending (if time available)
        if 'expense_time' in df.columns:
            late_night = (df_copy['hour'] >= 23) | (df_copy['hour'] <= 4)
            high_late_night = late_night & (df['amount'] > self.stats['amount']['median'] * 2)
            
            df.loc[high_late_night & ~df['is_anomaly'], 'is_anomaly'] = True
            df.loc[high_late_night, 'anomaly_type'] = 'timing'
            df.loc[high_late_night, 'anomaly_reason'] = 'High spending during late night hours'
        
        return df
    
    def get_anomaly_summary(self, expenses_df: pd.DataFrame) -> Dict:
        """
        Get summary of anomalies in the data.
        
        Returns:
            Dictionary with anomaly statistics
        """
        results = self.detect_anomalies(expenses_df)
        anomalies = results[results['is_anomaly']]
        
        if anomalies.empty:
            return {
                'total_anomalies': 0,
                'anomaly_rate': 0,
                'total_anomalous_spending': 0,
                'by_type': {},
                'recent_anomalies': []
            }
        
        by_type = anomalies['anomaly_type'].value_counts().to_dict()
        
        recent = anomalies.nlargest(5, 'expense_date')[
            ['expense_date', 'amount', 'category_name', 'anomaly_type', 'anomaly_reason']
        ].to_dict('records')
        
        return {
            'total_anomalies': len(anomalies),
            'anomaly_rate': len(anomalies) / len(results) * 100,
            'total_anomalous_spending': float(anomalies['amount'].sum()),
            'by_type': by_type,
            'recent_anomalies': recent,
            'average_anomaly_amount': float(anomalies['amount'].mean()),
        }
    
    def detect_daily_anomaly(
        self,
        daily_total: float,
        expense_date: date
    ) -> Dict:
        """
        Quick check if a daily total is anomalous.
        
        Args:
            daily_total: Total spending for the day
            expense_date: The date
            
        Returns:
            Dictionary with anomaly assessment
        """
        if 'daily' not in self.stats:
            return {'is_anomaly': False, 'reason': 'No baseline data'}
        
        stats = self.stats['daily']
        z_score = (daily_total - stats['mean']) / (stats['std'] + 1e-6)
        
        is_anomaly = abs(z_score) > 2.5
        
        if z_score > 2.5:
            reason = f'Daily spending ${daily_total:.2f} is {z_score:.1f}x above average (${stats["mean"]:.2f})'
            severity = 'high' if z_score > 3 else 'medium'
        elif z_score < -2.5:
            reason = f'Unusually low spending day (${daily_total:.2f} vs avg ${stats["mean"]:.2f})'
            severity = 'low'
        else:
            reason = None
            severity = None
        
        return {
            'is_anomaly': is_anomaly,
            'z_score': round(z_score, 2),
            'reason': reason,
            'severity': severity,
            'comparison': {
                'today': daily_total,
                'average': round(stats['mean'], 2),
                'typical_range': (
                    round(stats['mean'] - 2 * stats['std'], 2),
                    round(stats['mean'] + 2 * stats['std'], 2)
                )
            }
        }