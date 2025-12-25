# backend/app/ai_models/analyzers/emotional_analyzer.py
"""
Emotional Pattern Analyzer
THE CORE FORTUNA FEATURE
Analyze emotional spending patterns and provide behavioral insights
"""

from typing import Dict, List, Optional, Tuple
from datetime import date, datetime, timedelta
from collections import defaultdict
import logging

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


class EmotionalPatternAnalyzer:
    """
    Analyze emotional spending patterns.
    
    Key insights:
    - Which emotions trigger spending
    - When emotional spending peaks
    - Which categories are emotion-driven
    - Personalized recommendations
    """
    
    # Emotion categories
    POSITIVE_EMOTIONS = {'happy', 'excited', 'celebratory'}
    NEGATIVE_EMOTIONS = {'stressed', 'anxious', 'frustrated', 'sad', 'guilty'}
    NEUTRAL_EMOTIONS = {'neutral', 'planned'}
    RISK_EMOTIONS = {'impulsive', 'bored', 'tired'}
    
    def __init__(self):
        self.patterns: Dict = {}
        self.is_analyzed = False
        self.cluster_model = None
        self.scaler = StandardScaler()
    
    def analyze(self, expenses_df: pd.DataFrame) -> Dict:
        """
        Perform comprehensive emotional spending analysis.
        
        Args:
            expenses_df: DataFrame with expenses and emotional data
            
        Returns:
            Dictionary with all analysis results
        """
        if expenses_df.empty:
            return self._empty_analysis()
        
        # Filter to expenses with emotional data
        emotional_df = expenses_df[expenses_df['primary_emotion'].notna()].copy()
        
        if emotional_df.empty:
            return self._empty_analysis()
        
        self.patterns = {
            'summary': self._analyze_summary(expenses_df, emotional_df),
            'by_emotion': self._analyze_by_emotion(emotional_df),
            'by_time': self._analyze_by_time(emotional_df),
            'by_category': self._analyze_by_category(emotional_df),
            'triggers': self._analyze_triggers(emotional_df),
            'regret_analysis': self._analyze_regret(emotional_df),
            'recommendations': [],  # Will be populated
            'risk_score': 0,  # Will be calculated
        }
        
        # Calculate overall risk score
        self.patterns['risk_score'] = self._calculate_risk_score(emotional_df)
        
        # Generate personalized recommendations
        self.patterns['recommendations'] = self._generate_recommendations()
        
        # Cluster analysis for spending personas
        if len(emotional_df) >= 20:
            self.patterns['spending_persona'] = self._identify_spending_persona(emotional_df)
        
        self.is_analyzed = True
        
        return self.patterns
    
    def _empty_analysis(self) -> Dict:
        """Return empty analysis structure."""
        return {
            'summary': {
                'total_emotional_spending': 0,
                'emotional_percentage': 0,
                'expenses_with_emotions': 0,
            },
            'by_emotion': {},
            'by_time': {},
            'by_category': {},
            'triggers': [],
            'regret_analysis': {},
            'recommendations': ['Start logging emotions with your expenses to unlock insights'],
            'risk_score': 0,
        }
    
    def _analyze_summary(self, all_df: pd.DataFrame, emotional_df: pd.DataFrame) -> Dict:
        """Calculate summary statistics."""
        total_spending = float(all_df['amount'].sum())
        emotional_spending = float(emotional_df['amount'].sum())
        
        # Non-necessary emotional spending
        unnecessary = emotional_df[emotional_df.get('was_necessary', True) == False]
        unnecessary_amount = float(unnecessary['amount'].sum()) if not unnecessary.empty else 0
        
        # Impulsive spending
        impulsive = emotional_df[
            emotional_df['primary_emotion'].isin(self.RISK_EMOTIONS) |
            (emotional_df.get('was_necessary', True) == False)
        ]
        impulsive_amount = float(impulsive['amount'].sum()) if not impulsive.empty else 0
        
        return {
            'total_spending': round(total_spending, 2),
            'total_emotional_spending': round(emotional_spending, 2),
            'emotional_percentage': round(emotional_spending / total_spending * 100, 1) if total_spending > 0 else 0,
            'expenses_with_emotions': len(emotional_df),
            'expenses_total': len(all_df),
            'emotion_capture_rate': round(len(emotional_df) / len(all_df) * 100, 1) if len(all_df) > 0 else 0,
            'unnecessary_spending': round(unnecessary_amount, 2),
            'impulsive_spending': round(impulsive_amount, 2),
            'impulsive_percentage': round(impulsive_amount / emotional_spending * 100, 1) if emotional_spending > 0 else 0,
        }
    
    def _analyze_by_emotion(self, df: pd.DataFrame) -> Dict:
        """Analyze spending by emotion type."""
        emotion_stats = {}
        
        for emotion in df['primary_emotion'].unique():
            emotion_df = df[df['primary_emotion'] == emotion]
            
            emotion_stats[emotion] = {
                'count': len(emotion_df),
                'total': round(float(emotion_df['amount'].sum()), 2),
                'average': round(float(emotion_df['amount'].mean()), 2),
                'max': round(float(emotion_df['amount'].max()), 2),
                'category': self._categorize_emotion(emotion),
                'avg_stress': round(float(emotion_df['stress_level'].mean()), 1) if 'stress_level' in emotion_df.columns else None,
            }
        
        # Sort by total spending
        emotion_stats = dict(sorted(
            emotion_stats.items(),
            key=lambda x: x[1]['total'],
            reverse=True
        ))
        
        # Identify highest-spending emotion
        if emotion_stats:
            highest = max(emotion_stats.items(), key=lambda x: x[1]['total'])
            emotion_stats['_highest_spending_emotion'] = highest[0]
            emotion_stats['_highest_spending_amount'] = highest[1]['total']
        
        return emotion_stats
    
    def _categorize_emotion(self, emotion: str) -> str:
        """Categorize emotion as positive, negative, neutral, or risk."""
        if emotion in self.POSITIVE_EMOTIONS:
            return 'positive'
        elif emotion in self.NEGATIVE_EMOTIONS:
            return 'negative'
        elif emotion in self.RISK_EMOTIONS:
            return 'risk'
        else:
            return 'neutral'
    
    def _analyze_by_time(self, df: pd.DataFrame) -> Dict:
        """Analyze emotional spending by time patterns."""
        time_stats = {
            'by_day_of_week': {},
            'by_time_of_day': {},
            'by_day_type': {},
        }
        
        # By day of week
        df_copy = df.copy()
        df_copy['dow'] = pd.to_datetime(df_copy['expense_date']).dt.dayofweek
        dow_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        for dow, name in enumerate(dow_names):
            dow_df = df_copy[df_copy['dow'] == dow]
            if not dow_df.empty:
                time_stats['by_day_of_week'][name] = {
                    'total': round(float(dow_df['amount'].sum()), 2),
                    'count': len(dow_df),
                    'avg_stress': round(float(dow_df['stress_level'].mean()), 1) if 'stress_level' in dow_df.columns else None,
                }
        
        # By time of day
        if 'time_of_day' in df.columns:
            for tod in df['time_of_day'].dropna().unique():
                tod_df = df[df['time_of_day'] == tod]
                time_stats['by_time_of_day'][tod] = {
                    'total': round(float(tod_df['amount'].sum()), 2),
                    'count': len(tod_df),
                    'dominant_emotion': tod_df['primary_emotion'].mode().iloc[0] if not tod_df.empty else None,
                }
        
        # By day type
        if 'day_type' in df.columns:
            for dt in df['day_type'].dropna().unique():
                dt_df = df[df['day_type'] == dt]
                time_stats['by_day_type'][dt] = {
                    'total': round(float(dt_df['amount'].sum()), 2),
                    'count': len(dt_df),
                    'avg_amount': round(float(dt_df['amount'].mean()), 2),
                }
        
        # Identify peak spending times
        if time_stats['by_day_of_week']:
            peak_day = max(time_stats['by_day_of_week'].items(), key=lambda x: x[1]['total'])
            time_stats['peak_day'] = peak_day[0]
        
        if time_stats['by_time_of_day']:
            peak_time = max(time_stats['by_time_of_day'].items(), key=lambda x: x[1]['total'])
            time_stats['peak_time'] = peak_time[0]
        
        return time_stats
    
    def _analyze_by_category(self, df: pd.DataFrame) -> Dict:
        """Analyze emotional spending by category."""
        if 'category_name' not in df.columns:
            return {}
        
        category_stats = {}
        
        for cat in df['category_name'].unique():
            cat_df = df[df['category_name'] == cat]
            
            # Most common emotion for this category
            dominant_emotion = cat_df['primary_emotion'].mode().iloc[0] if not cat_df.empty else None
            
            # Percentage that was unnecessary
            unnecessary_pct = 0
            if 'was_necessary' in cat_df.columns:
                unnecessary_pct = (cat_df['was_necessary'] == False).mean() * 100
            
            category_stats[cat] = {
                'total': round(float(cat_df['amount'].sum()), 2),
                'count': len(cat_df),
                'dominant_emotion': dominant_emotion,
                'unnecessary_percentage': round(unnecessary_pct, 1),
                'avg_stress': round(float(cat_df['stress_level'].mean()), 1) if 'stress_level' in cat_df.columns else None,
            }
        
        # Sort by total
        return dict(sorted(category_stats.items(), key=lambda x: x[1]['total'], reverse=True))
    
    def _analyze_triggers(self, df: pd.DataFrame) -> List[Dict]:
        """Identify spending triggers."""
        triggers = []
        
        if 'trigger_event' in df.columns:
            trigger_counts = df['trigger_event'].dropna().value_counts()
            trigger_amounts = df.groupby('trigger_event')['amount'].sum()
            
            for trigger in trigger_counts.head(10).index:
                triggers.append({
                    'trigger': trigger,
                    'occurrences': int(trigger_counts[trigger]),
                    'total_spending': round(float(trigger_amounts.get(trigger, 0)), 2),
                })
        
        # Also identify emotion-based triggers
        stress_spending = df[df['stress_level'] >= 7] if 'stress_level' in df.columns else pd.DataFrame()
        if not stress_spending.empty:
            triggers.append({
                'trigger': 'High stress (7+)',
                'occurrences': len(stress_spending),
                'total_spending': round(float(stress_spending['amount'].sum()), 2),
                'type': 'emotional_state',
            })
        
        # Boredom trigger
        bored_spending = df[df['primary_emotion'] == 'bored']
        if not bored_spending.empty:
            triggers.append({
                'trigger': 'Boredom',
                'occurrences': len(bored_spending),
                'total_spending': round(float(bored_spending['amount'].sum()), 2),
                'type': 'emotional_state',
            })
        
        return sorted(triggers, key=lambda x: x['total_spending'], reverse=True)
    
    def _analyze_regret(self, df: pd.DataFrame) -> Dict:
        """Analyze purchases with regret."""
        if 'regret_level' not in df.columns:
            return {'has_data': False}
        
        regret_df = df[df['regret_level'].notna()]
        
        if regret_df.empty:
            return {'has_data': False}
        
        high_regret = regret_df[regret_df['regret_level'] >= 7]
        joy_purchases = regret_df[regret_df.get('brought_joy', False) == True]
        would_rebuy = regret_df[regret_df.get('would_buy_again', False) == True]
        
        return {
            'has_data': True,
            'total_reflected': len(regret_df),
            'average_regret': round(float(regret_df['regret_level'].mean()), 1),
            'high_regret_count': len(high_regret),
            'high_regret_amount': round(float(high_regret['amount'].sum()), 2),
            'brought_joy_count': len(joy_purchases),
            'brought_joy_amount': round(float(joy_purchases['amount'].sum()), 2),
            'would_rebuy_percentage': round(len(would_rebuy) / len(regret_df) * 100, 1) if len(regret_df) > 0 else 0,
            'most_regretted_category': high_regret['category_name'].mode().iloc[0] if not high_regret.empty and 'category_name' in high_regret.columns else None,
            'most_regretted_emotion': high_regret['primary_emotion'].mode().iloc[0] if not high_regret.empty else None,
        }
    
    def _calculate_risk_score(self, df: pd.DataFrame) -> int:
        """
        Calculate overall emotional spending risk score (0-100).
        Higher = more at risk for problematic spending patterns.
        """
        score = 0
        
        # Factor 1: Impulsive spending percentage (max 25 points)
        impulsive = df[df['primary_emotion'].isin(self.RISK_EMOTIONS)]
        impulsive_pct = len(impulsive) / len(df) if len(df) > 0 else 0
        score += min(25, impulsive_pct * 100)
        
        # Factor 2: Unnecessary spending percentage (max 25 points)
        if 'was_necessary' in df.columns:
            unnecessary_pct = (df['was_necessary'] == False).mean()
            score += min(25, unnecessary_pct * 50)
        
        # Factor 3: High stress spending (max 20 points)
        if 'stress_level' in df.columns:
            high_stress = df[df['stress_level'] >= 7]
            high_stress_pct = len(high_stress) / len(df) if len(df) > 0 else 0
            score += min(20, high_stress_pct * 50)
        
        # Factor 4: Negative emotion dominance (max 15 points)
        negative = df[df['primary_emotion'].isin(self.NEGATIVE_EMOTIONS)]
        negative_pct = len(negative) / len(df) if len(df) > 0 else 0
        score += min(15, negative_pct * 30)
        
        # Factor 5: High regret rate (max 15 points)
        if 'regret_level' in df.columns:
            high_regret = df[df['regret_level'] >= 7]
            regret_pct = len(high_regret) / len(df) if len(df) > 0 else 0
            score += min(15, regret_pct * 50)
        
        return min(100, round(score))
    
    def _generate_recommendations(self) -> List[str]:
        """Generate personalized recommendations based on analysis."""
        recommendations = []
        
        if not self.patterns:
            return recommendations
        
        summary = self.patterns.get('summary', {})
        by_emotion = self.patterns.get('by_emotion', {})
        triggers = self.patterns.get('triggers', [])
        regret = self.patterns.get('regret_analysis', {})
        risk_score = self.patterns.get('risk_score', 0)
        
        # Risk-based recommendations
        if risk_score >= 60:
            recommendations.append(
                "🚨 Your emotional spending risk is high. Consider implementing a 24-hour wait rule for non-essential purchases over $50."
            )
        elif risk_score >= 40:
            recommendations.append(
                "⚠️ Monitor your emotional spending closely. Try to identify patterns before they become habits."
            )
        
        # Trigger-based recommendations
        if triggers:
            top_trigger = triggers[0]
            if top_trigger['total_spending'] > 100:
                recommendations.append(
                    f"📍 '{top_trigger['trigger']}' is your biggest spending trigger (${top_trigger['total_spending']:.2f}). "
                    f"Create a specific strategy for this situation."
                )
        
        # Emotion-based recommendations
        highest_emotion = by_emotion.get('_highest_spending_emotion')
        if highest_emotion:
            if highest_emotion in self.NEGATIVE_EMOTIONS:
                recommendations.append(
                    f"💭 You spend most when feeling {highest_emotion}. "
                    f"Consider healthier coping strategies like walking, calling a friend, or journaling."
                )
            elif highest_emotion == 'bored':
                recommendations.append(
                    "🎯 Boredom-driven spending is common. Keep a list of free activities for when boredom strikes."
                )
            elif highest_emotion == 'impulsive':
                recommendations.append(
                    "⏰ Try the 10-10-10 rule: Will this matter in 10 minutes? 10 hours? 10 days?"
                )
        
        # Regret-based recommendations
        if regret.get('has_data') and regret.get('high_regret_count', 0) > 3:
            recommendations.append(
                f"💡 You've regretted {regret['high_regret_count']} purchases totaling ${regret['high_regret_amount']:.2f}. "
                f"Review these before your next similar purchase."
            )
        
        # Time-based recommendations
        by_time = self.patterns.get('by_time', {})
        peak_time = by_time.get('peak_time')
        if peak_time == 'late_night':
            recommendations.append(
                "🌙 Late-night spending is risky. Consider removing saved payment methods from apps."
            )
        
        # Positive reinforcement
        if summary.get('emotion_capture_rate', 0) >= 80:
            recommendations.append(
                "🌟 Great job tracking emotions with your spending! This awareness is the first step to change."
            )
        elif summary.get('emotion_capture_rate', 0) < 50:
            recommendations.append(
                "📝 Try to log emotions with more purchases. Better data = better insights!"
            )
        
        return recommendations[:5]  # Return top 5 recommendations
    
    def _identify_spending_persona(self, df: pd.DataFrame) -> Dict:
        """Identify user's spending persona using clustering."""
        # Create persona features
        features = []
        
        # Emotion distribution
        for emotion in ['stressed', 'happy', 'bored', 'impulsive', 'planned']:
            pct = (df['primary_emotion'] == emotion).mean()
            features.append(pct)
        
        # Spending behavior
        features.append((df.get('was_necessary', True) == False).mean())  # Unnecessary rate
        features.append(df['stress_level'].mean() / 10 if 'stress_level' in df.columns else 0.5)  # Avg stress
        
        # Define personas based on patterns
        features = np.array(features).reshape(1, -1)
        
        # Simple rule-based persona assignment
        stressed_pct = features[0][0]
        impulsive_pct = features[0][3]
        planned_pct = features[0][4]
        unnecessary_rate = features[0][5]
        
        if planned_pct > 0.5:
            persona = "The Planner"
            description = "You think before you spend. Keep up the great work!"
        elif stressed_pct > 0.3:
            persona = "The Stress Spender"
            description = "Stress triggers your spending. Focus on stress management techniques."
        elif impulsive_pct > 0.2:
            persona = "The Impulse Buyer"
            description = "Spontaneity drives your purchases. Implement cooling-off periods."
        elif unnecessary_rate > 0.4:
            persona = "The Treat-Yourself Type"
            description = "You like to indulge. Budget for treats so they don't derail your goals."
        else:
            persona = "The Balanced Spender"
            description = "Your spending is fairly balanced. Stay mindful to maintain this."
        
        return {
            'persona': persona,
            'description': description,
            'traits': {
                'stress_driven': round(stressed_pct * 100, 1),
                'impulsive': round(impulsive_pct * 100, 1),
                'planned': round(planned_pct * 100, 1),
                'unnecessary_rate': round(unnecessary_rate * 100, 1),
            }
        }
    
    def get_monthly_report(self, df: pd.DataFrame, year: int, month: int) -> Dict:
        """Generate a monthly emotional spending report."""
        # Filter to month
        df_copy = df.copy()
        df_copy['expense_date'] = pd.to_datetime(df_copy['expense_date'])
        monthly = df_copy[
            (df_copy['expense_date'].dt.year == year) &
            (df_copy['expense_date'].dt.month == month)
        ]
        
        analysis = self.analyze(monthly)
        
        # Add month-specific insights
        analysis['month'] = f"{year}-{month:02d}"
        analysis['total_transactions'] = len(monthly)
        
        return analysis