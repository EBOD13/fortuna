# backend/app/ai_models/predictors/spending_predictor.py
"""
Spending Predictor
Predict future daily/weekly/monthly spending based on historical patterns
Uses ensemble of models for robust predictions
"""

from typing import Dict, List, Optional, Tuple, Union
from datetime import date, datetime, timedelta
import logging

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.ai_models.utils.base_model import BasePredictor
from app.ai_models.utils.feature_engineering import FeatureEngineer

logger = logging.getLogger(__name__)


class SpendingPredictor(BasePredictor):
    """
    Predict future spending amounts.
    
    Uses an ensemble approach combining:
    - Gradient Boosting for capturing complex patterns
    - Random Forest for robustness
    - Ridge Regression for baseline stability
    
    Features used:
    - Time features (day of week, month, etc.)
    - Rolling averages (7, 14, 30 days)
    - Spending velocity and volatility
    - Seasonal patterns
    """
    
    def __init__(self, version: str = "1.0.0"):
        super().__init__("spending_predictor", version)
        
        # Ensemble of models
        self.models = {
            'gbm': GradientBoostingRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42
            ),
            'rf': RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            ),
            'ridge': Ridge(alpha=1.0)
        }
        
        self.model_weights = {'gbm': 0.4, 'rf': 0.4, 'ridge': 0.2}
        self.scaler = StandardScaler()
        
        self.feature_names = [
            'day_of_week', 'day_of_month', 'month', 'is_weekend',
            'is_month_start', 'is_month_end', 'is_payday',
            'rolling_7d_avg', 'rolling_14d_avg', 'rolling_30d_avg',
            'spending_velocity', 'spending_volatility',
            'lag_1', 'lag_7', 'lag_14', 'lag_30'
        ]
    
    def _create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create all features for the model."""
        df = df.copy()
        
        # Time features
        df = FeatureEngineer.create_time_features(df, 'date')
        
        # Lag features
        df['lag_1'] = df['total_spent'].shift(1).fillna(0)
        df['lag_7'] = df['total_spent'].shift(7).fillna(0)
        df['lag_14'] = df['total_spent'].shift(14).fillna(0)
        df['lag_30'] = df['total_spent'].shift(30).fillna(0)
        
        # Rolling features
        df['rolling_7d_avg'] = df['total_spent'].rolling(7, min_periods=1).mean()
        df['rolling_14d_avg'] = df['total_spent'].rolling(14, min_periods=1).mean()
        df['rolling_30d_avg'] = df['total_spent'].rolling(30, min_periods=1).mean()
        
        # Velocity and volatility
        df['spending_velocity'] = df['total_spent'].diff().fillna(0)
        df['spending_volatility'] = df['total_spent'].rolling(14, min_periods=1).std().fillna(0)
        
        return df
    
    def train(
        self,
        daily_spending_df: pd.DataFrame,
        target_col: str = 'total_spent'
    ) -> Dict[str, float]:
        """
        Train the spending predictor.
        
        Args:
            daily_spending_df: DataFrame with columns ['date', 'total_spent', ...]
            target_col: Name of target column
            
        Returns:
            Dictionary of training metrics
        """
        logger.info("Training spending predictor...")
        
        # Create features
        df = self._create_features(daily_spending_df)
        
        # Drop rows with NaN (from lag features)
        df = df.dropna()
        
        if len(df) < 60:
            raise ValueError("Need at least 60 days of data for training")
        
        # Prepare X and y
        X = df[self.feature_names].values
        y = df[target_col].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Time series cross-validation
        tscv = TimeSeriesSplit(n_splits=5)
        
        all_metrics = {}
        
        for name, model in self.models.items():
            # Cross-validation scores
            cv_scores = cross_val_score(
                model, X_scaled, y,
                cv=tscv,
                scoring='neg_mean_absolute_error'
            )
            
            # Train on full data
            model.fit(X_scaled, y)
            
            # Get predictions for metrics
            y_pred = model.predict(X_scaled)
            
            all_metrics[f'{name}_mae'] = mean_absolute_error(y, y_pred)
            all_metrics[f'{name}_rmse'] = np.sqrt(mean_squared_error(y, y_pred))
            all_metrics[f'{name}_r2'] = r2_score(y, y_pred)
            all_metrics[f'{name}_cv_mae'] = -cv_scores.mean()
        
        # Ensemble metrics
        y_ensemble = self._ensemble_predict(X_scaled)
        all_metrics['ensemble_mae'] = mean_absolute_error(y, y_ensemble)
        all_metrics['ensemble_rmse'] = np.sqrt(mean_squared_error(y, y_ensemble))
        all_metrics['ensemble_r2'] = r2_score(y, y_ensemble)
        
        self.metrics = all_metrics
        self.is_trained = True
        self.training_date = datetime.now()
        self.metadata['training_samples'] = len(df)
        self.metadata['date_range'] = {
            'start': str(df['date'].min()),
            'end': str(df['date'].max())
        }
        
        logger.info(f"Training complete. Ensemble MAE: ${all_metrics['ensemble_mae']:.2f}")
        
        return all_metrics
    
    def _ensemble_predict(self, X: np.ndarray) -> np.ndarray:
        """Make ensemble prediction."""
        predictions = {}
        
        for name, model in self.models.items():
            predictions[name] = model.predict(X)
        
        # Weighted average
        ensemble = np.zeros(len(X))
        for name, weight in self.model_weights.items():
            ensemble += weight * predictions[name]
        
        return ensemble
    
    def predict(
        self,
        recent_spending_df: pd.DataFrame,
        days_ahead: int = 7
    ) -> Dict[str, any]:
        """
        Predict spending for upcoming days.
        
        Args:
            recent_spending_df: Recent daily spending data (at least 30 days)
            days_ahead: Number of days to predict
            
        Returns:
            Dictionary with predictions and confidence intervals
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        # Create features from recent data
        df = self._create_features(recent_spending_df)
        
        predictions = []
        pred_dates = []
        lower_bounds = []
        upper_bounds = []
        
        # Predict day by day
        current_df = df.copy()
        last_date = pd.to_datetime(current_df['date'].max())
        
        for i in range(days_ahead):
            # Get features for prediction
            last_row = current_df.iloc[-1:].copy()
            
            X = last_row[self.feature_names].values
            X_scaled = self.scaler.transform(X)
            
            # Get individual model predictions for confidence
            model_preds = []
            for name, model in self.models.items():
                model_preds.append(model.predict(X_scaled)[0])
            
            # Ensemble prediction
            pred = sum(p * self.model_weights[name] 
                      for name, p in zip(self.models.keys(), model_preds))
            
            # Confidence interval from model variance
            pred_std = np.std(model_preds)
            lower = max(0, pred - 1.96 * pred_std)
            upper = pred + 1.96 * pred_std
            
            pred_date = last_date + timedelta(days=i+1)
            
            predictions.append(round(pred, 2))
            pred_dates.append(pred_date.strftime('%Y-%m-%d'))
            lower_bounds.append(round(lower, 2))
            upper_bounds.append(round(upper, 2))
            
            # Add prediction to df for next iteration
            new_row = self._create_next_day_row(current_df, pred_date, pred)
            current_df = pd.concat([current_df, new_row], ignore_index=True)
        
        return {
            'dates': pred_dates,
            'predictions': predictions,
            'lower_bounds': lower_bounds,
            'upper_bounds': upper_bounds,
            'total_predicted': round(sum(predictions), 2),
            'average_daily': round(np.mean(predictions), 2),
        }
    
    def _create_next_day_row(
        self,
        df: pd.DataFrame,
        next_date: datetime,
        predicted_amount: float
    ) -> pd.DataFrame:
        """Create a row for the next day with predicted values."""
        new_row = pd.DataFrame([{
            'date': next_date,
            'total_spent': predicted_amount,
            'user_id': df['user_id'].iloc[0] if 'user_id' in df.columns else None
        }])
        
        # Add time features
        new_row = FeatureEngineer.create_time_features(new_row, 'date')
        
        # Update rolling features using the extended dataframe
        extended = pd.concat([df[['date', 'total_spent']], new_row[['date', 'total_spent']]])
        
        new_row['lag_1'] = df['total_spent'].iloc[-1]
        new_row['lag_7'] = df['total_spent'].iloc[-7] if len(df) >= 7 else df['total_spent'].mean()
        new_row['lag_14'] = df['total_spent'].iloc[-14] if len(df) >= 14 else df['total_spent'].mean()
        new_row['lag_30'] = df['total_spent'].iloc[-30] if len(df) >= 30 else df['total_spent'].mean()
        
        new_row['rolling_7d_avg'] = extended['total_spent'].tail(7).mean()
        new_row['rolling_14d_avg'] = extended['total_spent'].tail(14).mean()
        new_row['rolling_30d_avg'] = extended['total_spent'].tail(30).mean()
        
        new_row['spending_velocity'] = predicted_amount - df['total_spent'].iloc[-1]
        new_row['spending_volatility'] = df['total_spent'].tail(14).std()
        
        return new_row
    
    def predict_weekly(self, recent_spending_df: pd.DataFrame) -> Dict[str, float]:
        """Predict total spending for next week."""
        result = self.predict(recent_spending_df, days_ahead=7)
        
        return {
            'predicted_weekly_total': result['total_predicted'],
            'daily_breakdown': dict(zip(result['dates'], result['predictions'])),
            'confidence_range': {
                'lower': sum(result['lower_bounds']),
                'upper': sum(result['upper_bounds'])
            }
        }
    
    def predict_monthly(self, recent_spending_df: pd.DataFrame) -> Dict[str, float]:
        """Predict total spending for next 30 days."""
        result = self.predict(recent_spending_df, days_ahead=30)
        
        # Group by week
        weekly_totals = []
        for i in range(4):
            start = i * 7
            end = min((i + 1) * 7, len(result['predictions']))
            weekly_totals.append(sum(result['predictions'][start:end]))
        
        return {
            'predicted_monthly_total': result['total_predicted'],
            'weekly_breakdown': weekly_totals,
            'average_daily': result['average_daily'],
            'confidence_range': {
                'lower': sum(result['lower_bounds']),
                'upper': sum(result['upper_bounds'])
            }
        }
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from tree-based models."""
        if not self.is_trained:
            return {}
        
        importance = {}
        
        # Average importance across tree models
        for name in ['gbm', 'rf']:
            model = self.models[name]
            for feat, imp in zip(self.feature_names, model.feature_importances_):
                importance[feat] = importance.get(feat, 0) + imp / 2
        
        # Sort by importance
        return dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
    
    def save(self, path: str) -> str:
        """Save model and scaler."""
        import pickle
        import os
        
        os.makedirs(path, exist_ok=True)
        
        # Save models
        for name, model in self.models.items():
            model_path = os.path.join(path, f"{self.model_name}_{name}_v{self.version}.pkl")
            with open(model_path, 'wb') as f:
                pickle.dump(model, f)
        
        # Save scaler
        scaler_path = os.path.join(path, f"{self.model_name}_scaler_v{self.version}.pkl")
        with open(scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)
        
        # Save metadata via parent
        return super().save(path)
    
    def load(self, path: str) -> None:
        """Load model and scaler."""
        import pickle
        import os
        
        # Load models
        for name in self.models.keys():
            model_path = os.path.join(path, f"{self.model_name}_{name}_v{self.version}.pkl")
            with open(model_path, 'rb') as f:
                self.models[name] = pickle.load(f)
        
        # Load scaler
        scaler_path = os.path.join(path, f"{self.model_name}_scaler_v{self.version}.pkl")
        with open(scaler_path, 'rb') as f:
            self.scaler = pickle.load(f)
        
        # Load metadata via parent
        super().load(path)