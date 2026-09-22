import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "HackEngine App"
    ENVIRONMENT: str = "development"
    # Motivated by Sentinel: Postgres is required by default, never SQLite
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app_db"
    GROQ_API_KEY: str = ""
    # Motivated by Aloorithm & Orcheon: Feature flag for 3rd-party integration circuit breaking
    ENABLE_EXTERNAL_API: bool = True
    JWT_SECRET: str = "hackathon-secret-key-replace-in-prod-min-32-chars"
    JWT_ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
