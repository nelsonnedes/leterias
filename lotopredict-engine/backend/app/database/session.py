from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Obtém a URL computada dinamicamente
db_url = settings.REAL_DATABASE_URL

# Configurações dinâmicas de engine baseadas no dialeto
if "sqlite" in db_url:
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )
else:
    # Dialeto PostgreSQL com pooling ativo
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()