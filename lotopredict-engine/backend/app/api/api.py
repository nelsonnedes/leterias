from fastapi import FastAPI
from app.core.config import settings
from app.api.routes import routes as api_routes

from fastapi.middleware.cors import CORSMiddleware
from app.database.session import engine
from app.database.models import Base

def create_app() -> FastAPI:
    # Garante que todas as tabelas estejam criadas no banco de dados SQLite no startup
    Base.metadata.create_all(bind=engine)
    
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    # Configuração de CORS para permitir requisições do frontend local
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    async def root():
        return {"message": "LotoPredict Engine API", "version": settings.VERSION}

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    # Register API routes under version prefix
    for router in api_routes:
        app.include_router(router, prefix=f"{settings.API_V1_STR}")

    return app

app = create_app()