# backend/app/ai_models/predictors/goal_scorer.py
"""
Goal Achievement Scorer
Predict probability of achieving financial goals on time
Uses XGBoost for robust probability estimation
"""

from typing import Dict, List, Optional, Tuple, Union
from datetime import date, datetime, timedelta
from decimal import Decimal
import logging

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, brier_score_loss
)

from app.ai_models.utils.base_model import BasePredictor

logger = logging.getLogger(__name__)


class GoalAchievementScorer(BasePredictor):
    """
    Predict probability of achieving a financial goal.
    
    Considers:
    - Goal parameters (target, deadline, priority)
    - Current progress
    - User's income stability
    - User's spending patterns
    - Historical goal completion rate
    
    Returns calibrated probability (0-100%)
    """
    
    def __init__(self, version: str = "1.0.0"):
        super().__init__("goal_achievement_scorer", version)
        
        # Use Gradient Boosting with calibration for better probabilities
        base_model = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
        
        self.model = CalibratedClassifierCV(base_model, cv=3, method='isotonic')
        self.scaler = StandardScaler()
        
        self.feature_names = [
            'completion_rate',
            'days_to_deadline',
            'days_elapsed',
            'required_daily_savings',
            'monthly_allocation',
            'priority_level',
            'is_mandatory',
            'avg_monthly_income',
            'avg_daily_spending',
            'income_stability',
            'savings_rate',
            'goal_amount_relative',  # relative to income
            'on_track_indicator',
            'savings_velocity',
        ]
    
    def _calculate_features(
        self,
        goal_data: Dict,
        income_data: Optional[Dict] = None,
        spending_data: Optional[Dict] = None
    ) -> np.ndarray:
        """Calculate features for a single goal."""
        
        today = date.today()
        
        # Goal features
        target = float(goal_data.get('target_amount', 0))
        current = float(goal_data.get('current_amount', 0))
        
        completion_rate = current / target if target > 0 else 0
        
        deadline = goal_data.get('deadline_date')
        if deadline:
            if isinstance(deadline, str):
                deadline = datetime.strptime(deadline, '%Y-%m-%d').date()
            days_to_deadline = max(0, (deadline - today).days)
        else:
            days_to_deadline = 365  # Default to 1 year
        
        created = goal_data.get('created_at')
        if created:
            if isinstance(created, str):
                created = datetime.fromisoformat(created)
            days_elapsed = (today - created.date()).days if hasattr(created, 'date') else 0
        else:
            days_elapsed = 0
        
        remaining = target - current
        required_daily = remaining / days_to_deadline if days_to_deadline > 0 else remaining
        
        monthly_allocation = float(goal_data.get('monthly_allocation', 0))
        priority = goal_data.get('priority_level', 5)
        is_mandatory = int(goal_data.get('is_mandatory', False))
        
        # Income features
        avg_monthly_income = float(income_data.get('avg_monthly', 3000)) if income_data else 3000
        income_stability = float(income_data.get('stability', 0.8)) if income_data else 0.8
        
        # Spending features
        avg_daily_spending = float(spending_data.get('avg_daily', 50)) if spending_data else 50
        
        # Derived features
        monthly_savings_potential = avg_monthly_income - (avg_daily_spending * 30)
        savings_rate = monthly_savings_potential / avg_monthly_income if avg_monthly_income > 0 else 0
        
        goal_relative = target / (avg_monthly_income * 12) if avg_monthly_income > 0 else 1
        
        # On track indicator
        if days_elapsed > 0 and days_to_deadline > 0:
            expected_progress = days_elapsed / (days_elapsed + days_to_deadline)
            on_track = 1 if completion_rate >= expected_progress else 0
        else:
            on_track = 1 if completion_rate > 0 else 0
        
        # Savings velocity (rate of progress)
        if days_elapsed > 0:
            savings_velocity = current / days_elapsed
        else:
            savings_velocity = 0
        
        features = [
            completion_rate,
            days_to_deadline,
            days_elapsed,
            required_daily,
            monthly_allocation,
            priority,
            is_mandatory,
            avg_monthly_income,
            avg_daily_spending,
            income_stability,
            savings_rate,
            goal_relative,
            on_track,
            savings_velocity,
        ]
        
        return np.array(features).reshape(1, -1)
    
    def train(
        self,
        goals_df: pd.DataFrame,
        outcomes: pd.Series
    ) -> Dict[str, float]:
        """
        Train the goal scorer on historical data.
        
        Args:
            goals_df: DataFrame with goal features
            outcomes: Series with 1=achieved, 0=not achieved
            
        Returns:
            Dictionary of training metrics
        """
        logger.info("Training goal achievement scorer...")
        
        # Ensure all features exist
        X = goals_df[self.feature_names].values
        y = outcomes.values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split for evaluation
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        y_prob = self.model.predict_proba(X_test)[:, 1]
        
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, zero_division=0),
            'recall': recall_score(y_test, y_pred, zero_division=0),
            'f1': f1_score(y_test, y_pred, zero_division=0),
            'roc_auc': roc_auc_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else 0.5,
            'brier_score': brier_score_loss(y_test, y_prob),
        }
        
        self.metrics = metrics
        self.is_trained = True
        self.training_date = datetime.now()
        self.metadata['training_samples'] = len(goals_df)
        
        logger.info(f"Training complete. ROC-AUC: {metrics['roc_auc']:.3f}")
        
        return metrics
    
    def train_with_synthetic(self, n_samples: int = 1000) -> Dict[str, float]:
        """
        Train with synthetic data for new deployments.
        Creates realistic goal scenarios.
        """
        np.random.seed(42)
        
        data = []
        outcomes = []
        
        for _ in range(n_samples):
            # Generate realistic goal scenario
            target = np.random.uniform(500, 50000)
            monthly_income = np.random.uniform(2000, 10000)
            daily_spending = np.random.uniform(30, 200)
            
            # Time parameters
            total_days = np.random.randint(30, 730)
            days_elapsed = np.random.randint(0, total_days)
            days_remaining = total_days - days_elapsed
            
            # Progress (with some randomness)
            expected_rate = days_elapsed / total_days
            actual_rate = np.clip(expected_rate + np.random.normal(0, 0.2), 0, 1)
            current = target * actual_rate
            
            # Features
            savings_potential = monthly_income - (daily_spending * 30)
            required_daily = (target - current) / days_remaining if days_remaining > 0 else 0
            
            monthly_allocation = np.random.uniform(0, savings_potential * 0.5)
            priority = np.random.randint(1, 11)
            is_mandatory = np.random.random() > 0.7
            
            features = {
                'completion_rate': actual_rate,
                'days_to_deadline': days_remaining,
                'days_elapsed': days_elapsed,
                'required_daily_savings': required_daily,
                'monthly_allocation': monthly_allocation,
                'priority_level': priority,
                'is_mandatory': int(is_mandatory),
                'avg_monthly_income': monthly_income,
                'avg_daily_spending': daily_spending,
                'income_stability': np.random.uniform(0.5, 1.0),
                'savings_rate': savings_potential / monthly_income,
                'goal_amount_relative': target / (monthly_income * 12),
                'on_track_indicator': int(actual_rate >= expected_rate),
                'savings_velocity': current / days_elapsed if days_elapsed > 0 else 0,
            }
            
            data.append(features)
            
            # Determine outcome (simplified logic)
            achievable_amount = savings_potential * (days_remaining / 30)
            can_afford = (target - current) <= achievable_amount * 1.2
            is_on_track = actual_rate >= expected_rate * 0.8
            
            # Probability of success
            p_success = 0.3
            if can_afford:
                p_success += 0.3
            if is_on_track:
                p_success += 0.2
            if is_mandatory:
                p_success += 0.1
            if priority >= 7:
                p_success += 0.1
            
            outcome = np.random.random() < p_success
            outcomes.append(int(outcome))
        
        df = pd.DataFrame(data)
        return self.train(df, pd.Series(outcomes))
    
    def predict(
        self,
        goal_data: Dict,
        income_data: Optional[Dict] = None,
        spending_data: Optional[Dict] = None
    ) -> Dict[str, any]:
        """
        Predict probability of achieving a goal.
        
        Args:
            goal_data: Goal information dict
            income_data: User's income stats (optional)
            spending_data: User's spending stats (optional)
            
        Returns:
            Dictionary with probability and insights
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        # Calculate features
        X = self._calculate_features(goal_data, income_data, spending_data)
        X_scaled = self.scaler.transform(X)
        
        # Get probability
        prob = self.model.predict_proba(X_scaled)[0, 1]
        
        # Risk factors
        risk_factors = self._identify_risk_factors(X[0], prob)
        
        # Recommendations
        recommendations = self._generate_recommendations(goal_data, X[0], prob)
        
        return {
            'probability': round(prob * 100, 1),  # As percentage
            'confidence_level': self._get_confidence_level(prob),
            'risk_factors': risk_factors,
            'recommendations': recommendations,
            'details': {
                'completion_rate': round(X[0][0] * 100, 1),
                'days_remaining': int(X[0][1]),
                'required_daily_savings': round(X[0][3], 2),
                'on_track': bool(X[0][12]),
            }
        }
    
    def _get_confidence_level(self, prob: float) -> str:
        """Convert probability to confidence level."""
        if prob >= 0.8:
            return "Very Likely"
        elif prob >= 0.6:
            return "Likely"
        elif prob >= 0.4:
            return "Uncertain"
        elif prob >= 0.2:
            return "Unlikely"
        else:
            return "Very Unlikely"
    
    def _identify_risk_factors(self, features: np.ndarray, prob: float) -> List[str]:
        """Identify factors putting goal at risk."""
        risks = []
        
        completion_rate = features[0]
        days_to_deadline = features[1]
        required_daily = features[3]
        monthly_income = features[7]
        daily_spending = features[8]
        on_track = features[12]
        
        # Check various risk conditions
        if on_track == 0:
            risks.append("Behind schedule on savings progress")
        
        if required_daily > (monthly_income / 30) * 0.3:
            risks.append("Required daily savings exceeds 30% of daily income")
        
        if days_to_deadline < 30 and completion_rate < 0.9:
            risks.append("Less than 30 days remaining with significant gap")
        
        savings_potential = (monthly_income - daily_spending * 30) / 30
        if required_daily > savings_potential:
            risks.append("Required savings exceeds current savings potential")
        
        if completion_rate < 0.25 and days_to_deadline < 90:
            risks.append("Low completion rate with limited time")
        
        return risks
    
    def _generate_recommendations(
        self,
        goal_data: Dict,
        features: np.ndarray,
        prob: float
    ) -> List[str]:
        """Generate actionable recommendations."""
        recommendations = []
        
        required_daily = features[3]
        monthly_allocation = features[4]
        daily_spending = features[8]
        savings_rate = features[10]
        
        if prob < 0.5:
            # Goal at risk
            if monthly_allocation < required_daily * 30:
                recommendations.append(
                    f"Increase monthly allocation to ${required_daily * 30:.2f} to stay on track"
                )
            
            if savings_rate < 0.2:
                recommendations.append(
                    "Consider reducing discretionary spending to increase savings rate"
                )
            
            if features[1] > 180:  # More than 6 months
                recommendations.append(
                    "Consider extending deadline to make goal more achievable"
                )
        
        elif prob < 0.8:
            # Goal achievable but needs attention
            recommendations.append("Maintain current savings discipline")
            
            if features[12] == 0:  # Not on track
                recommendations.append(
                    "Make up for missed contributions this month"
                )
        
        else:
            # Goal on track
            recommendations.append("Excellent progress! Keep it up")
            recommendations.append(
                "Consider increasing target or starting a new goal"
            )
        
        return recommendations
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Get probability predictions."""
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)
    
    def batch_score(
        self,
        goals: List[Dict],
        income_data: Optional[Dict] = None,
        spending_data: Optional[Dict] = None
    ) -> List[Dict]:
        """Score multiple goals at once."""
        return [
            self.predict(goal, income_data, spending_data)
            for goal in goals
        ]