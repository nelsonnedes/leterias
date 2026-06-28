import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "LotoPredict Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str = "sqlite:///./loterias.db"
    
    CAIXA_BASE_URL: str = "https://loterias.caixa.gov.br"
    
    SCRAPER_TIMEOUT: int = 30
    SCRAPER_USER_AGENT: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()