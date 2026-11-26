import os
import time
from collections import defaultdict, deque

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import func
from app.core.config import settings
from app.api.routes import routes as api_routes

from fastapi.middleware.cors import CORSMiddleware
from app.database.session import engine
from app.database.models import Base
from app.database.seed import seed_historical_data
from app.database.models import LotteryResult


def create_app() -> FastAPI:
    # Garante que todas as tabelas estejam criadas no banco de dados SQLite no startup
    Base.metadata.create_all(bind=engine)

    # Carrega o acervo histórico empacotado quando o banco estiver vazio (idempotente)
    try:
        seed_historical_data()
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("Falha ao semear histórico: %s", exc)
    
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    # CORS: apenas origens explícitas. Nunca usar regex solto com credenciais.
    _vercel_origin = os.getenv("FRONTEND_URL", "https://frontend-delta-six-13.vercel.app")
    _extra_origins = [o.strip() for o in os.getenv("CORS_EXTRA_ORIGINS", "").split(",") if o.strip()]
    _allowed_origins = list(dict.fromkeys([
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        _vercel_origin,
        *_extra_origins,
    ]))

    app.add_middleware(
        CORSMiddleware,
        allow_origins=_allowed_origins,
        allow_credentials=False,  # não há autenticação baseada em cookies
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Accept"],
    )

    # Limite simples por IP nas rotas computacionalmente caras (protege Render free tier)
    _rate_window = 60.0
    _rate_max = 12
    _requests: defaultdict[str, deque] = defaultdict(deque)
    _limited_paths = ("/backtest", "/fechamento")

    @app.middleware("http")
    async def rate_limit_expensive_routes(request: Request, call_next):
        if request.method in ("POST", "GET") and any(p in request.url.path for p in _limited_paths):
            client_ip = request.client.host if request.client else "unknown"
            now = time.monotonic()
            history = _requests[client_ip]
            while history and now - history[0] > _rate_window:
                history.popleft()
            if len(history) >= _rate_max:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Muitas requisições. Tente novamente em instantes."},
                )
            history.append(now)
        return await call_next(request)

    @app.get("/")
    async def root():
        return {"message": "LotoPredict Engine API", "version": settings.VERSION}

    @app.get("/health")
    async def health_check():
        from app.database.session import SessionLocal
        db = SessionLocal()
        try:
            counts = dict(
                db.query(LotteryResult.lottery_name, func.count(LotteryResult.id))
                .group_by(LotteryResult.lottery_name)
                .all()
            )
        finally:
            db.close()
        return {"status": "healthy", "draws_by_lottery": counts}

    # Register API routes under version prefix
    for router in api_routes:
        app.include_router(router, prefix=f"{settings.API_V1_STR}")

    return app

app = create_app()