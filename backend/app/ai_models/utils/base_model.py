# backend/app/ai_models/utils/base_model.py
"""
Base Model Class
Abstract base class for all Fortuna AI models
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
import pickle
import json
import os
import logging

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class BasePredictor(ABC):
    """
    Abstract base class for all prediction models.
    Provides common functionality for training, prediction, and persistence.
    """
    
    def __init__(self, model_name: str, version: str = "1.0.0"):
        self.model_name = model_name
        self.version = version
        self.model = None
        self.is_trained = False
        self.training_date: Optional[datetime] = None
        self.metadata: Dict[str, Any] = {}
        self.feature_names: List[str] = []
        
        # Model performance metrics
        self.metrics: Dict[str, float] = {}
    
    @abstractmethod
    def train(self, X: Union[pd.DataFrame, np.ndarray], y: Union[pd.Series, np.ndarray]) -> Dict[str, float]:
        """
        Train the model on provided data.
        
        Args:
            X: Feature matrix
            y: Target values
            
        Returns:
            Dictionary of training metrics
        """
        pass
    
    @abstractmethod
    def predict(self, X: Union[pd.DataFrame, np.ndarray]) -> np.ndarray:
        """
        Make predictions on new data.
        
        Args:
            X: Feature matrix
            
        Returns:
            Array of predictions
        """
        pass
    
    def predict_proba(self, X: Union[pd.DataFrame, np.ndarray]) -> Optional[np.ndarray]:
        """
        Get prediction probabilities (for classifiers).
        Override in subclass if applicable.
        """
        return None
    
    def save(self, path: str) -> str:
        """
        Save model to disk.
        
        Args:
            path: Directory to save model
            
        Returns:
            Full path to saved model
        """
        if not self.is_trained:
            raise ValueError("Cannot save untrained model")
        
        os.makedirs(path, exist_ok=True)
        
        # Save model
        model_path = os.path.join(path, f"{self.model_name}_v{self.version}.pkl")
        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        # Save metadata
        metadata = {
            "model_name": self.model_name,
            "version": self.version,
            "training_date": self.training_date.isoformat() if self.training_date else None,
            "metrics": self.metrics,
            "feature_names": self.feature_names,
            "metadata": self.metadata
        }
        
        metadata_path = os.path.join(path, f"{self.model_name}_v{self.version}_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Model saved to {model_path}")
        return model_path
    
    def load(self, path: str) -> None:
        """
        Load model from disk.
        
        Args:
            path: Directory containing saved model
        """
        model_path = os.path.join(path, f"{self.model_name}_v{self.version}.pkl")
        metadata_path = os.path.join(path, f"{self.model_name}_v{self.version}_metadata.json")
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        # Load model
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
        
        # Load metadata
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
                self.metrics = metadata.get("metrics", {})
                self.feature_names = metadata.get("feature_names", [])
                self.metadata = metadata.get("metadata", {})
                if metadata.get("training_date"):
                    self.training_date = datetime.fromisoformat(metadata["training_date"])
        
        self.is_trained = True
        logger.info(f"Model loaded from {model_path}")
    
    def get_feature_importance(self) -> Optional[Dict[str, float]]:
        """
        Get feature importance scores if available.
        Override in subclass if applicable.
        """
        return None
    
    def validate_input(self, X: Union[pd.DataFrame, np.ndarray]) -> bool:
        """
        Validate input data has expected features.
        """
        if isinstance(X, pd.DataFrame) and self.feature_names:
            missing = set(self.feature_names) - set(X.columns)
            if missing:
                raise ValueError(f"Missing features: {missing}")
        return True
    
    def __repr__(self) -> str:
        status = "trained" if self.is_trained else "untrained"
        return f"{self.__class__.__name__}(name='{self.model_name}', version='{self.version}', status='{status}')"
