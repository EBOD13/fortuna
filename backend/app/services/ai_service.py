# backend/app/services/ai_service.py
"""
AI Service
Integration layer for all AI models
Provides unified interface for predictions and insights
"""

from typing import Dict, List, Optional, Any
from datetime import date, datetime, timedelta
from uuid import UUID
import logging
import os

from sqlalchemy.orm import Session

from app.ai_models.predictors.spending_predictor import SpendingPredictor
from app.ai_models.predictors.goal_scorer import GoalAchievementScorer
from app.ai_models.analyzers.anomaly_detector import AnomalyDetector
from app.ai_models.analyzers.emotional_analyzer import EmotionalPatternAnalyzer
from app.ai_models.utils.data_preprocessor import DataPreprocessor
from app.config import settings

logger = logging.getLogger(__name__)


class AIService:
    """
    Main AI service for Fortuna.
    Orchestrates all AI models and provides insights.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.preprocessor = DataPreprocessor(db)
        
        # Initialize models
        self.spending_predictor = SpendingPredictor()
        self.goal_scorer = GoalAchievementScorer()
        self.anomaly_detector = AnomalyDetector()
        self.emotional_analyzer = EmotionalPatternAnalyzer()
        
        # Model paths
        self.models_path = settings.AI_MODELS_PATH
        
        # Try to load pre-trained models
        self._load_models()
    
    def _load_models(self) -> None:
        """Load pre-trained models if available."""
        try:
            spending_path = os.path.join(self.models_path, 'spending_predictor')
            if os.path.exists(spending_path):
                self.spending_predictor.load(spending_path)
                logger.info("Loaded spending predictor model")
        except Exception as e:
            logger.warning(f"Could not load spending predictor: {e}")
        
        try:
            goal_path = os.path.join(self.models_path, 'goal_scorer')
            if os.path.exists(goal_path):
                self.goal_scorer.load(goal_path)
                logger.info("Loaded goal scorer model")
        except Exception as e:
            logger.warning(f"Could not load goal scorer: {e}")
    
    # ============================================
    # SPENDING PREDICTIONS
    # ============================================
    
    def predict_spending(
        self,
        user_id: UUID,
        days_ahead: int = 7
    ) -> Dict[str, Any]:
        """
        Predict user's spending for upcoming days.
        
        Args:
            user_id: User ID
            days_ahead: Number of days to predict
            
        Returns:
            Dictionary with predictions and insights
        """
        # Get user's spending history
        daily_df = self.preprocessor.get_daily_spending_summary(user_id, days_back=90)
        
        if daily_df.empty or len(daily_df) < 30:
            return {
                'status': 'insufficient_data',
                'message': 'Need at least 30 days of spending history for predictions',
                'days_available': len(daily_df) if not daily_df.empty else 0,
            }
        
        # Train model on user data if not already trained
        if not self.spending_predictor.is_trained:
            try:
                self.spending_predictor.train(daily_df)
            except Exception as e:
                logger.error(f"Error training spending predictor: {e}")
                return {'status': 'error', 'message': str(e)}
        
        # Make predictions
        try:
            predictions = self.spending_predictor.predict(daily_df, days_ahead)
            predictions['status'] = 'success'
            
            # Add context
            avg_spending = float(daily_df['total_spent'].tail(30).mean())
            predictions['context'] = {
                'recent_daily_average': round(avg_spending, 2),
                'predicted_vs_average': round(predictions['average_daily'] - avg_spending, 2),
                'trend': 'increasing' if predictions['average_daily'] > avg_spending else 'decreasing',
            }
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error predicting spending: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def predict_weekly_spending(self, user_id: UUID) -> Dict[str, Any]:
        """Predict next week's spending."""
        return self.predict_spending(user_id, days_ahead=7)
    
    def predict_monthly_spending(self, user_id: UUID) -> Dict[str, Any]:
        """Predict next month's spending."""
        result = self.predict_spending(user_id, days_ahead=30)
        
        if result.get('status') == 'success':
            # Add monthly breakdown
            predictions = result['predictions']
            weekly_totals = []
            for i in range(4):
                start = i * 7
                end = min((i + 1) * 7, len(predictions))
                weekly_totals.append(round(sum(predictions[start:end]), 2))
            result['weekly_breakdown'] = weekly_totals
        
        return result
    
    # ============================================
    # GOAL SCORING
    # ============================================
    
    def score_goal(
        self,
        user_id: UUID,
        goal_data: Dict
    ) -> Dict[str, Any]:
        """
        Score probability of achieving a goal.
        
        Args:
            user_id: User ID
            goal_data: Goal information
            
        Returns:
            Dictionary with probability and recommendations
        """
        # Get user context
        income_data = self._get_income_context(user_id)
        spending_data = self._get_spending_context(user_id)
        
        # Ensure model is trained
        if not self.goal_scorer.is_trained:
            try:
                self.goal_scorer.train_with_synthetic()
            except Exception as e:
                logger.error(f"Error training goal scorer: {e}")
                return {'status': 'error', 'message': str(e)}
        
        # Score goal
        try:
            result = self.goal_scorer.predict(goal_data, income_data, spending_data)
            result['status'] = 'success'
            return result
        except Exception as e:
            logger.error(f"Error scoring goal: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def score_all_goals(self, user_id: UUID) -> List[Dict[str, Any]]:
        """Score all user's active goals."""
        goals_df = self.preprocessor.get_user_goals(user_id)
        
        if goals_df.empty:
            return []
        
        # Filter to active goals
        active_goals = goals_df[goals_df['status'] == 'active']
        
        results = []
        for _, goal in active_goals.iterrows():
            goal_data = goal.to_dict()
            score = self.score_goal(user_id, goal_data)
            score['goal_id'] = goal_data.get('goal_id')
            score['goal_name'] = goal_data.get('goal_name')
            results.append(score)
        
        return results
    
    def _get_income_context(self, user_id: UUID) -> Dict:
        """Get user's income context for scoring."""
        income_df = self.preprocessor.get_user_income(user_id, days_back=90)
        
        if income_df.empty:
            return {}
        
        monthly = income_df.groupby(
            income_df['payment_date'].apply(lambda x: x.strftime('%Y-%m'))
        )['net_amount'].sum()
        
        return {
            'avg_monthly': float(monthly.mean()) if len(monthly) > 0 else 0,
            'stability': 1 - (float(monthly.std()) / float(monthly.mean())) if len(monthly) > 1 and monthly.mean() > 0 else 0.8,
        }
    
    def _get_spending_context(self, user_id: UUID) -> Dict:
        """Get user's spending context for scoring."""
        daily_df = self.preprocessor.get_daily_spending_summary(user_id, days_back=90)
        
        if daily_df.empty:
            return {}
        
        return {
            'avg_daily': float(daily_df['total_spent'].mean()),
        }
    
    # ============================================
    # ANOMALY DETECTION
    # ============================================
    
    def detect_anomalies(
        self,
        user_id: UUID,
        days_back: int = 30
    ) -> Dict[str, Any]:
        """
        Detect spending anomalies for a user.
        
        Args:
            user_id: User ID
            days_back: Days to analyze
            
        Returns:
            Dictionary with anomaly summary and details
        """
        # Get user's expenses
        expenses_df = self.preprocessor.get_user_expenses(user_id, days_back)
        
        if expenses_df.empty:
            return {
                'status': 'no_data',
                'message': 'No expense data available',
            }
        
        # Fit detector on recent data
        self.anomaly_detector.fit(expenses_df)
        
        # Get anomaly summary
        summary = self.anomaly_detector.get_anomaly_summary(expenses_df)
        summary['status'] = 'success'
        
        return summary
    
    def check_daily_anomaly(
        self,
        user_id: UUID,
        daily_total: float,
        expense_date: date
    ) -> Dict[str, Any]:
        """Quick check if today's spending is anomalous."""
        # Ensure detector is fitted
        expenses_df = self.preprocessor.get_user_expenses(user_id, days_back=90)
        
        if expenses_df.empty:
            return {'is_anomaly': False, 'reason': 'No baseline data'}
        
        self.anomaly_detector.fit(expenses_df)
        return self.anomaly_detector.detect_daily_anomaly(daily_total, expense_date)
    
    # ============================================
    # EMOTIONAL ANALYSIS
    # ============================================
    
    def analyze_emotional_patterns(
        self,
        user_id: UUID,
        days_back: int = 90
    ) -> Dict[str, Any]:
        """
        Analyze user's emotional spending patterns.
        
        Args:
            user_id: User ID
            days_back: Days to analyze
            
        Returns:
            Dictionary with emotional insights
        """
        expenses_df = self.preprocessor.get_user_expenses(user_id, days_back, include_emotions=True)
        
        if expenses_df.empty:
            return {
                'status': 'no_data',
                'message': 'No expense data available',
                'recommendations': ['Start logging expenses to get insights'],
            }
        
        analysis = self.emotional_analyzer.analyze(expenses_df)
        analysis['status'] = 'success'
        analysis['period_days'] = days_back
        
        return analysis
    
    def get_monthly_emotional_report(
        self,
        user_id: UUID,
        year: int,
        month: int
    ) -> Dict[str, Any]:
        """Get emotional spending report for a specific month."""
        expenses_df = self.preprocessor.get_user_expenses(user_id, days_back=365, include_emotions=True)
        
        if expenses_df.empty:
            return {'status': 'no_data'}
        
        report = self.emotional_analyzer.get_monthly_report(expenses_df, year, month)
        report['status'] = 'success'
        
        return report
    
    # ============================================
    # COMPREHENSIVE INSIGHTS
    # ============================================
    
    def get_dashboard_insights(self, user_id: UUID) -> Dict[str, Any]:
        """
        Get all insights for the user dashboard.
        Combines all AI analyses into a single response.
        """
        insights = {
            'generated_at': datetime.now().isoformat(),
            'spending_prediction': None,
            'goal_scores': None,
            'anomalies': None,
            'emotional_analysis': None,
            'alerts': [],
            'quick_stats': {},
        }
        
        # Spending prediction
        try:
            insights['spending_prediction'] = self.predict_weekly_spending(user_id)
        except Exception as e:
            logger.error(f"Dashboard spending prediction error: {e}")
        
        # Goal scores
        try:
            insights['goal_scores'] = self.score_all_goals(user_id)
        except Exception as e:
            logger.error(f"Dashboard goal scoring error: {e}")
        
        # Anomalies
        try:
            insights['anomalies'] = self.detect_anomalies(user_id, days_back=7)
        except Exception as e:
            logger.error(f"Dashboard anomaly detection error: {e}")
        
        # Emotional analysis
        try:
            insights['emotional_analysis'] = self.analyze_emotional_patterns(user_id, days_back=30)
        except Exception as e:
            logger.error(f"Dashboard emotional analysis error: {e}")
        
        # Generate alerts
        insights['alerts'] = self._generate_alerts(insights)
        
        # Quick stats
        insights['quick_stats'] = self._generate_quick_stats(user_id, insights)
        
        return insights
    
    def _generate_alerts(self, insights: Dict) -> List[Dict]:
        """Generate alerts from insights."""
        alerts = []
        
        # Spending alert
        spending = insights.get('spending_prediction', {})
        if spending and spending.get('status') == 'success':
            context = spending.get('context', {})
            if context.get('trend') == 'increasing' and context.get('predicted_vs_average', 0) > 20:
                alerts.append({
                    'type': 'warning',
                    'category': 'spending',
                    'message': f"Predicted spending is ${context['predicted_vs_average']:.2f} higher than your average",
                    'action': 'Review upcoming expenses',
                })
        
        # Goal alerts
        goals = insights.get('goal_scores', [])
        for goal in (goals or []):
            if goal.get('probability', 100) < 40:
                alerts.append({
                    'type': 'alert',
                    'category': 'goal',
                    'message': f"Goal '{goal.get('goal_name')}' needs attention ({goal.get('probability')}% on track)",
                    'action': goal.get('recommendations', ['Review goal'])[0] if goal.get('recommendations') else 'Review goal',
                })
        
        # Anomaly alerts
        anomalies = insights.get('anomalies', {})
        if anomalies and anomalies.get('total_anomalies', 0) > 0:
            alerts.append({
                'type': 'info',
                'category': 'anomaly',
                'message': f"{anomalies['total_anomalies']} unusual transactions detected this week",
                'action': 'Review flagged transactions',
            })
        
        # Emotional alerts
        emotional = insights.get('emotional_analysis', {})
        if emotional and emotional.get('risk_score', 0) >= 60:
            alerts.append({
                'type': 'warning',
                'category': 'emotional',
                'message': 'Your emotional spending risk is elevated',
                'action': emotional.get('recommendations', ['Review spending patterns'])[0] if emotional.get('recommendations') else 'Review spending patterns',
            })
        
        return alerts
    
    def _generate_quick_stats(self, user_id: UUID, insights: Dict) -> Dict:
        """Generate quick stats for dashboard."""
        stats = {}
        
        # From emotional analysis
        emotional = insights.get('emotional_analysis', {})
        if emotional:
            summary = emotional.get('summary', {})
            stats['emotion_capture_rate'] = summary.get('emotion_capture_rate', 0)
            stats['emotional_risk_score'] = emotional.get('risk_score', 0)
        
        # From spending prediction
        spending = insights.get('spending_prediction', {})
        if spending and spending.get('status') == 'success':
            stats['predicted_weekly'] = spending.get('total_predicted', 0)
        
        # Goal health
        goals = insights.get('goal_scores', [])
        if goals:
            avg_probability = sum(g.get('probability', 0) for g in goals) / len(goals)
            stats['avg_goal_health'] = round(avg_probability, 1)
            stats['goals_at_risk'] = sum(1 for g in goals if g.get('probability', 100) < 50)
        
        return stats