import os
from typing import Optional, List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RailPulse India"
    APP_NAME: str = "RailPulse India"
    VERSION: str = "1.0.0"
    APP_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: List[str] = ["*"]

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://railpulse:railpulse_pass@localhost:5432/railpulse_db")

    # Redis Caching
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CACHE_DEFAULT_TTL: int = 60  # Live status TTL in seconds (60s)
    CACHE_METADATA_TTL: int = 86400  # Static metadata TTL in seconds (24h)

    # RailRadar Live API Integration
    RAILRADAR_API_KEY: Optional[str] = os.getenv("RAILRADAR_API_KEY", None)
    RAILRADAR_BASE_URL: str = os.getenv("RAILRADAR_BASE_URL", "https://railradar.in/api/v1")
    RAILRADAR_TIMEOUT: float = 5.0  # HTTP request timeout in seconds

    class Config:
        case_sensitive = True

settings = Settings()
