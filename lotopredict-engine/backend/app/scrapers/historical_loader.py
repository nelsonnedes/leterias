import asyncio
import httpx
import os
import sys
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

# Ajusta o path do Python para poder rodar o script diretamente da raiz do backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database.session import SessionLocal
from app.database.models import LotteryResult
from app.core.config import settings

# Mapeamento oficial
LOTTERIES = {
    "megasena": {"db_name": "Megasena", "endpoint": "megasena"},
    "lotofacil": {"db_name": "Lotofacil", "endpoint": "lotofacil"},
    "quina":     {"db_name": "Quina",     "endpoint": "quina"}
}

# Cabeçalhos padrão para emular navegador e evitar bloqueios
HEADERS = {
    "User-Agent": settings.SCRAPER_USER_AGENT,
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
}

async def fetch_draw(
    client: httpx.AsyncClient,
    lottery_endpoint: str,
    concurso: int,
    sem: asyncio.Semaphore,
    db_name: str
) -> dict | None:
    """Busca um sorteio específico pela API oficial da Caixa utilizando semáforo."""
    url = f"https://servicebus2.caixa.gov.br/portaldeloterias/api/{lottery_endpoint}/{concurso}"
    async with sem:
        for attempt in range(3):
            try:
                # Espaçamento: 250ms entre chamadas — conservador para evitar ban da Caixa
                await asyncio.sleep(0.25)

                res = await client.get(url, headers=HEADERS, timeout=12.0)
                if res.status_code == 200:
                    data = res.json()
                    draw_date_str = data.get("dataApuracao")
                    if not draw_date_str:
                        return None

                    # Converte data DD/MM/YYYY → date Python
                    draw_date = datetime.strptime(draw_date_str, "%d/%m/%Y").date()

                    # Extrai as dezenas ordenadas
                    raw_numbers = data.get("listaDezenas", [])
                    numbers = sorted([int(n) for n in raw_numbers if str(n).isdigit()])

                    if not numbers:
                        return None

                    return {
                        "lottery_name": db_name,
                        "concurso": int(data.get("numero", concurso)),
                        "draw_date": draw_date,
                        "numbers": numbers,
                        "source_url": url,
                        "source_reference": f"Concurso {data.get('numero', concurso)}"
                    }

                elif res.status_code in (400, 404):
                    # Concurso inexistente — normal para extremos do range
                    return None

                elif res.status_code == 429:
                    # Rate limit — espera progressiva mais agressiva
                    wait_time = 15.0 * (attempt + 1)
                    print(f"  [WARN] Rate limit ({lottery_endpoint} #{concurso}). Aguardando {wait_time:.0f}s...")
                    await asyncio.sleep(wait_time)

            except Exception as e:
                if attempt == 2:
                    print(f"  [ERR] Falha em {lottery_endpoint} #{concurso}: {e}")
                else:
                    await asyncio.sleep(1.0 * (attempt + 1))

    return None


def upsert_draw(session, draw_data: dict) -> bool:
    """
    Insere um sorteio no banco ignorando duplicatas (por draw_date + lottery_name).
    Retorna True se inserido, False se já existia.
    """
    # Verifica existência primeiro (mais rápido que capturar IntegrityError)
    exists = session.query(LotteryResult).filter_by(
        draw_date=draw_data["draw_date"],
        lottery_name=draw_data["lottery_name"]
    ).first()

    if exists:
        return False  # Já existe — pula

    obj = LotteryResult(
        lottery_name=draw_data["lottery_name"],
        draw_date=draw_data["draw_date"],
        numbers=draw_data["numbers"],
        source_url=draw_data["source_url"],
        source_reference=draw_data["source_reference"]
    )
    try:
        session.add(obj)
        session.commit()
        return True
    except IntegrityError:
        session.rollback()
        return False  # Race condition — ok ignorar


async def load_historical_data(force_lotteries: list[str] | None = None):
    """
    Inicia a rotina de carga em lote (Bulk Insert) de todo o histórico oficial.
    - force_lotteries: lista opcional para restringir a quais loterias processar
      ex: ['quina'] para reprocessar apenas a Quina
    """
    print("=== LotoPredict Engine - Carga Histórica Completa ===")

    targets = {k: v for k, v in LOTTERIES.items() if not force_lotteries or k in force_lotteries}

    async with httpx.AsyncClient(verify=False) as client:
        # 1. Obter o último concurso online de cada loteria
        latest_concursos: dict[str, int] = {}
        FALLBACKS = {"megasena": 2800, "lotofacil": 3140, "quina": 6470}

        for key, spec in targets.items():
            url = f"https://servicebus2.caixa.gov.br/portaldeloterias/api/{spec['endpoint']}"
            try:
                res = await client.get(url, headers=HEADERS, timeout=15.0)
                if res.status_code == 200:
                    data = res.json()
                    latest_concursos[key] = int(data.get("numero", FALLBACKS[key]))
                    print(f"Último concurso online do {spec['db_name']}: {latest_concursos[key]}")
                else:
                    latest_concursos[key] = FALLBACKS[key]
                    print(f"[WARN] Fallback para {spec['db_name']}: {FALLBACKS[key]}")
            except Exception as e:
                latest_concursos[key] = FALLBACKS[key]
                print(f"[WARN] Erro ao buscar último concurso de {key}: {e}. Usando fallback {FALLBACKS[key]}.")

        # 2. Conectar ao banco
        session = SessionLocal()

        # Semáforo: 5 chamadas concorrentes (conservador — evita ban temporário da API Caixa)
        sem = asyncio.Semaphore(5)

        for key, spec in targets.items():
            db_name = spec["db_name"]
            endpoint = spec["endpoint"]
            max_draw = latest_concursos.get(key, FALLBACKS[key])

            # Busca os concursos já gravados no banco via source_reference
            existing_rows = (
                session.query(LotteryResult.source_reference)
                .filter(LotteryResult.lottery_name == db_name)
                .all()
            )

            existing_draws: set[int] = set()
            for (ref,) in existing_rows:
                if ref and ref.startswith("Concurso "):
                    parts = ref.split()
                    if len(parts) >= 2:
                        try:
                            existing_draws.add(int(''.join(filter(str.isdigit, parts[1]))))
                        except ValueError:
                            pass

            missing_draws = [c for c in range(1, max_draw + 1) if c not in existing_draws]

            if not missing_draws:
                print(f"[{db_name}] [OK] 100% atualizado ({len(existing_draws)} sorteios no banco).")
                continue

            print(f"\n[{db_name}] >> {len(existing_draws)} no banco. Faltam {len(missing_draws)} concursos (1 a {max_draw})...")

            # 3. Processar em lotes de 100 (menor para detectar problemas mais cedo)
            chunk_size = 100
            total_inserted = 0
            total_skipped = 0

            for i in range(0, len(missing_draws), chunk_size):
                chunk = missing_draws[i:i + chunk_size]
                lote_num = (i // chunk_size) + 1
                total_lotes = (len(missing_draws) + chunk_size - 1) // chunk_size

                tasks = [fetch_draw(client, endpoint, c, sem, db_name) for c in chunk]
                results = await asyncio.gather(*tasks)

                valid_draws = [r for r in results if r is not None]
                inserted = 0
                skipped = 0

                # Inserção INDIVIDUAL com tratamento de duplicata por registro
                for draw in valid_draws:
                    if upsert_draw(session, draw):
                        inserted += 1
                    else:
                        skipped += 1

                total_inserted += inserted
                total_skipped += skipped

                # Se o lote inteiro retornou 0 resultados (possível ban de IP), pausa longa
                if len(valid_draws) == 0 and len(chunk) > 10:
                    print(f"  [WARN] Lote {lote_num} sem resultados validos. Aguardando 30s para reset do rate limit...")
                    await asyncio.sleep(30.0)

                print(
                    f"  [{db_name}] Lote {lote_num}/{total_lotes} "
                    f"(concursos {chunk[0]}-{chunk[-1]}): "
                    f"[+{inserted} inseridos] [{skipped} ignorados]"
                )

            print(f"\n[{db_name}] [DONE] Concluido: {total_inserted} inseridos, {total_skipped} ja existiam.")

        session.close()
        print("\n=== [OK] Carga Historica Finalizada com Sucesso ===")


if __name__ == "__main__":
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    import argparse
    parser = argparse.ArgumentParser(description="LotoPredict — Carga Histórica de Sorteios")
    parser.add_argument(
        "--lottery", "-l",
        choices=["megasena", "lotofacil", "quina"],
        nargs="+",
        default=None,
        help="Restringir a loteria(s) a processar (padrão: todas)"
    )
    args = parser.parse_args()

    asyncio.run(load_historical_data(force_lotteries=args.lottery))
