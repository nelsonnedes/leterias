import asyncio
import httpx
import os
import sys
from datetime import datetime
from sqlalchemy import func

# Ajusta o path do Python para poder rodar o script diretamente da raiz do backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database.session import SessionLocal
from app.database.models import LotteryResult
from app.core.config import settings

# Mapeamento oficial
LOTTERIES = {
    "megasena": {"db_name": "Megasena", "endpoint": "megasena"},
    "lotofacil": {"db_name": "Lotofacil", "endpoint": "lotofacil"},
    "quina": {"db_name": "Quina", "endpoint": "quina"}
}

# Cabeçalhos padrão para emular navegador e evitar bloqueios
HEADERS = {
    "User-Agent": settings.SCRAPER_USER_AGENT,
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
}

async def fetch_draw(client: httpx.AsyncClient, lottery_endpoint: str, concurso: int, sem: asyncio.Semaphore) -> dict:
    """Busca um sorteio específico pela API oficial da Caixa utilizando semáforo."""
    url = f"https://servicebus2.caixa.gov.br/portaldeloterias/api/{lottery_endpoint}/{concurso}"
    async with sem:
        for attempt in range(3):
            try:
                # Espaçamento entre chamadas concorrentes para preservar o IP
                await asyncio.sleep(0.12)
                
                res = await client.get(url, headers=HEADERS, timeout=10.0)
                if res.status_code == 200:
                    data = res.json()
                    # Converte para o nosso modelo
                    draw_date_str = data.get("dataApuracao")
                    if not draw_date_str:
                        return None
                    
                    # Converte data DD/MM/YYYY para objeto date do Python
                    draw_date = datetime.strptime(draw_date_str, "%d/%m/%Y").date()
                    
                    # Extrai as dezenas ordenadas
                    raw_numbers = data.get("listaDezenas", [])
                    numbers = sorted([int(n) for n in raw_numbers if n.isdigit()])
                    
                    if not numbers:
                        return None

                    return {
                        "lottery_name": LOTTERIES[lottery_endpoint]["db_name"],
                        "concurso": data.get("numero"),
                        "draw_date": draw_date,
                        "numbers": numbers,
                        "source_url": url,
                        "source_reference": f"Concurso {data.get('numero')}"
                    }
                elif res.status_code == 400 or res.status_code == 404:
                    # Concurso pode não existir ainda
                    return None
            except Exception as e:
                if attempt == 2:
                    print(f"Erro ao buscar {lottery_endpoint} concurso {concurso}: {str(e)}")
        return None

async def load_historical_data():
    """Inicia a rotina de carga em lote (Bulk Insert) de todo o histórico oficial."""
    print("=== LotoPredict Engine - Carga Histórica Completa ===")
    
    async with httpx.AsyncClient(verify=False) as client:
        # 1. Obter o último concurso online de cada loteria para saber o limite de repetição
        latest_concursos = {}
        for key, spec in LOTTERIES.items():
            url = f"https://servicebus2.caixa.gov.br/portaldeloterias/api/{spec['endpoint']}"
            try:
                res = await client.get(url, headers=HEADERS, timeout=10.0)
                if res.status_code == 200:
                    data = res.json()
                    latest_concursos[key] = data.get("numero")
                    print(f"Último concurso online do {spec['db_name']}: {latest_concursos[key]}")
                else:
                    latest_concursos[key] = 2800 # Fallback se falhar
            except Exception as e:
                print(f"Erro ao buscar último concurso de {key}: {str(e)}")
                latest_concursos[key] = 2800

        # Conectar ao banco de dados SQLite/Postgres
        session = SessionLocal()
        
        # Limite de 10 chamadas assíncronas concorrentes por segundo para evitar WAF/Rate limit
        sem = asyncio.Semaphore(10)

        for key, spec in LOTTERIES.items():
            db_name = spec["db_name"]
            endpoint = spec["endpoint"]
            max_draw = latest_concursos[key]

            # Busca referências existentes no banco para extrair o número do concurso
            existing_rows = (
                session.query(LotteryResult.source_reference)
                .filter(LotteryResult.lottery_name == db_name)
                .all()
            )
            
            existing_draws = set()
            for r in existing_rows:
                ref = r[0]
                if ref and ref.startswith("Concurso "):
                    parts = ref.split()
                    if len(parts) >= 2:
                        try:
                            # Extrai os dígitos do número do concurso
                            num = int(''.join(filter(str.isdigit, parts[1])))
                            existing_draws.add(num)
                        except ValueError:
                            pass

            missing_draws = [c for c in range(1, max_draw + 1) if c not in existing_draws]
            
            if not missing_draws:
                print(f"[{db_name}] Já está 100% atualizado com {len(existing_draws)} sorteios.")
                continue

            print(f"[{db_name}] Encontrado {len(existing_draws)} no banco. Baixando {len(missing_draws)} sorteios faltantes...")

            # Divide os faltantes em lotes de 100 para comitar em partes
            chunk_size = 100
            for i in range(0, len(missing_draws), chunk_size):
                chunk = missing_draws[i:i+chunk_size]
                
                # Agenda as tarefas concorrentes do lote
                tasks = [fetch_draw(client, endpoint, c, sem) for c in chunk]
                results = await asyncio.gather(*tasks)
                
                # Filtra os resultados válidos
                valid_draws = [r for r in results if r is not None]
                
                if valid_draws:
                    # Executa o Bulk Insert no SQLAlchemy
                    db_objects = [
                        LotteryResult(
                            lottery_name=d["lottery_name"],
                            draw_date=d["draw_date"],
                            numbers=d["numbers"],
                            source_url=d["source_url"],
                            source_reference=d["source_reference"]
                        )
                        for d in valid_draws
                    ]
                    
                    try:
                        session.add_all(db_objects)
                        session.commit()
                        print(f"[{db_name}] Lote comitado com sucesso. Gravado {len(db_objects)} novos sorteios. ({chunk[0]} a {chunk[-1]})")
                    except Exception as e:
                        session.rollback()
                        print(f"[{db_name}] Erro ao comitar lote: {str(e)}")
                
        session.close()
        print("=== Carga Histórica Finalizada com Sucesso ===")

if __name__ == "__main__":
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    asyncio.run(load_historical_data())
