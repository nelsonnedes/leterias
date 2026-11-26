from datetime import date, datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.models import LotteryResult
from app.database.session import get_db
from app.core.constants import get_lottery_spec
from app.services.probability import ProbabilityAlgorithms

router = APIRouter()


def _get_lottery_spec(lottery_name: str) -> dict:
    return get_lottery_spec(lottery_name, strict=True)


@router.get("/lottery/results", response_model=List[dict])
async def get_latest_results(
    limit: int = Query(default=10, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Retorna os últimos resultados das loterias."""
    results = (
        db.query(LotteryResult)
        .order_by(LotteryResult.draw_date.desc(), LotteryResult.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "lottery_name": r.lottery_name,
            "draw_date": r.draw_date.isoformat() if r.draw_date else None,
            "numbers": r.numbers,
            "source_url": r.source_url,
        }
        for r in results
    ]


async def _fetch_latest_from_caixa(spec: dict) -> dict | None:
    """Consulta o último concurso diretamente na API oficial da Caixa."""
    endpoint = spec["db_name"].lower()
    url = f"https://servicebus2.caixa.gov.br/portaldeloterias/api/{endpoint}"
    async with httpx.AsyncClient(timeout=25.0, follow_redirects=True) as client:
        response = await client.get(url, headers={"User-Agent": "LotoPredict/2.0"})
        response.raise_for_status()
        data = response.json()

    raw_numbers = data.get("listaDezenas") or []
    numbers = sorted(int(n) for n in raw_numbers if str(n).isdigit())
    expected = spec["numbers_to_draw"]
    if len(numbers) != expected or len(set(numbers)) != expected:
        return None
    if not all(1 <= n <= spec["total_numbers"] for n in numbers):
        return None

    draw_date = datetime.strptime(data["dataApuracao"], "%d/%m/%Y").date()
    contest = data.get("numero")
    return {
        "lottery_name": spec["display_name"],
        "reference": f"Concurso {contest}" if contest else f"Sorteio de {draw_date.strftime('%d/%m/%Y')}",
        "draw_date": draw_date.isoformat(),
        "numbers": numbers,
        "source_url": url,
        "source": "caixa-live",
    }


@router.get("/lottery/{lottery_name}/latest", response_model=dict)
async def get_latest_draw(lottery_name: str, db: Session = Depends(get_db)):
    """Último concurso real — ao vivo da Caixa quando o banco local estiver atrasado."""
    spec = _get_lottery_spec(lottery_name)
    result = (
        db.query(LotteryResult)
        .filter(LotteryResult.lottery_name == spec["db_name"])
        .order_by(LotteryResult.draw_date.desc())
        .first()
    )

    stale = result is None or result.draw_date < date.today()
    if stale:
        try:
            live = await _fetch_latest_from_caixa(spec)
            if live and (result is None or live["draw_date"] > result.draw_date.isoformat()):
                return live
        except Exception:
            pass  # mantém o último registro local se a Caixa não responder

    if result is None:
        raise HTTPException(status_code=404, detail="Nenhum resultado encontrado para esta loteria.")

    payload = {
        "lottery_name": spec["display_name"],
        "reference": result.source_reference or f"Sorteio de {result.draw_date.strftime('%d/%m/%Y')}",
        "draw_date": result.draw_date.isoformat(),
        "numbers": result.numbers,
        "source_url": result.source_url,
        "source": "database",
        "stale": stale,
    }
    if stale:
        payload["notice"] = (
            "A Caixa não respondeu; usando o último concurso disponível no banco local "
            f"({result.draw_date.strftime('%d/%m/%Y')}), que pode estar desatualizado."
        )
    return payload


@router.get("/lottery/{lottery_name}/stats", response_model=dict)
async def get_lottery_stats(lottery_name: str, limit: int = 100, db: Session = Depends(get_db)):
    """Retorna estatísticas básicas de uma loteria específica."""
    spec = _get_lottery_spec(lottery_name)
    db_name = spec["db_name"]
    
    results = (
        db.query(LotteryResult)
        .filter(LotteryResult.lottery_name == db_name)
        .order_by(LotteryResult.draw_date.desc())
        .limit(limit)
        .all()
    )
    
    if not results:
        return {"message": "Nenhum resultado encontrado"}
    
    # Ordena do mais antigo para o mais recente (para análises)
    draws_asc = list(reversed(results))
    numbers_history = [r.numbers for r in draws_asc if r.numbers]
    
    # flatten para frequência
    all_numbers = [num for r in results for num in r.numbers]
    
    # --- NOVAS ANÁLISES ---
    # Análise de Pares
    pairs = ProbabilityAlgorithms.pair_analysis(
        numbers_history, spec["total_numbers"]
    )
    # Top 15 pares mais frequentes
    top_pairs = sorted(pairs.items(), key=lambda x: x[1], reverse=True)[:15]
    
    # Análise de Terminadores
    terminators = ProbabilityAlgorithms.terminators_analysis(
        all_numbers, spec["total_numbers"]
    )
    terminators_sorted = sorted(terminators.items(), key=lambda x: x[0])
    
    # Janela Deslizante (últimos 25 sorteios vs total)
    freq_recent, freq_all = ProbabilityAlgorithms.sliding_window_frequency(
        numbers_history, spec["total_numbers"], window_size=25
    )
    
    # Números que mais subiram (tendência de alta)
    trending_up = []
    for n in range(1, spec["total_numbers"] + 1):
        diff = freq_recent.get(n, 0) - freq_all.get(n, 0)
        if diff > 0:
            trending_up.append((n, round(diff * 100, 2)))
    trending_up.sort(key=lambda x: x[1], reverse=True)
    
    return {
        "lottery_name": lottery_name,
        "total_results": len(results),
        "date_range": {
            "start": min(r.draw_date for r in results).isoformat(),
            "end": max(r.draw_date for r in results).isoformat()
        },
        "most_common_numbers": sorted(
            [(num, all_numbers.count(num)) for num in set(all_numbers)],
            key=lambda x: x[1],
            reverse=True
        )[:10],
        "least_common_numbers": sorted(
            [(num, all_numbers.count(num)) for num in set(all_numbers)],
            key=lambda x: x[1]
        )[:10],
        "top_pairs": top_pairs,
        "terminators": terminators_sorted,
        "trending_up": trending_up[:10],
        "all_frequencies": {
            str(n): freq_all.get(n, 0) for n in range(1, spec["total_numbers"] + 1)
        }
    }