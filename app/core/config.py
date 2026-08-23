from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
    APP_NAME: str = "Unfold"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    # Storage settings (Zero-config local JSON file storage)
    DATA_DIR: str = "data"
    
    # Optional MongoDB settings (if ever needed)
    MONGODB_URI: Optional[str] = "local_json"
    MONGODB_DB_NAME: str = "unfold_db"
    MONGODB_MAX_POOL_SIZE: int = 100
    MONGODB_MIN_POOL_SIZE: int = 10
    
    # Groq LLM settings
    GROQ_API_KEY: str = "gsk_placeholder_key"
    GROQ_MODEL_NAME: str = "llama-3.3-70b-versatile"
    
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=(_ENV_PATH, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
