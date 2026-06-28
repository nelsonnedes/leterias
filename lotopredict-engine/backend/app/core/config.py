import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "LotoPredict Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # URL padrão local
    DATABASE_URL: str = "sqlite:///./loterias.db"
    
    CAIXA_BASE_URL: str = "https://loterias.caixa.gov.br"
    
    SCRAPER_TIMEOUT: int = 30
    SCRAPER_USER_AGENT: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    
    @property
    def REAL_DATABASE_URL(self) -> str:
        # Tenta obter a URL do Postgres da Vercel ou DATABASE_URL de envs
        url = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL") or self.DATABASE_URL
        
        # Converte para postgresql+psycopg2 exigido pelo SQLAlchemy
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+psycopg2://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
            
        return url

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()