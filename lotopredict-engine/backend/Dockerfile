# =========================================================
# Dockerfile — LotoPredict Engine Backend (FastAPI)
# Deploy: Render.com / Railway / qualquer host com Docker
# =========================================================

FROM python:3.11-slim

# Variáveis de ambiente para Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Diretório de trabalho dentro do container
WORKDIR /app

# Instala dependências do sistema necessárias para psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala as dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

# Porta exposta
EXPOSE $PORT

# Comando de inicialização (usa a variável PORT do ambiente)
CMD ["sh", "-c", "uvicorn app.api.api:app --host 0.0.0.0 --port ${PORT:-8000}"]
