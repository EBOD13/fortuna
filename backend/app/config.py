from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import os
from pydantic import validator
from dotenv import load_dotenv


class Settings(BaseSettings):
    """ Application Settings"""

    # Project info
    PROJECT_NAME: str = "Fortuna"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8081",  # React Native Metro
        "http://localhost:19000",  # Expo
        "http://localhost:19006",  # Expo web
    ]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    # AI Models
    MODEL_PATH: str = "app/ai_models/trained_models"
    RETRAIN_SCHEDULE: str = "weekly"

        # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # Email (optional, for notifications)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    
    # Tax API (optional, for automatic tax rates)
    TAX_API_KEY: str = ""

    # Database
    DB_USER: str = "ebod"
    DB_PASSWORD: str = Field(..., env="DB_PASSWORD")  # Load from .env
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "fortuna"

    @property
    def DATABASE_URL(self) -> str:
        # Use the loaded DB_PASSWORD
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
# Ensure model path exists
os.makedirs(settings.MODEL_PATH, exist_ok=True)