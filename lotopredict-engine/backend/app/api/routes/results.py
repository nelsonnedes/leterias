from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.models import LotteryResult
from app.database.session import get_db
from app.services.probability import ProbabilityAlgorithms

router = APIRouter()

LOTTERY_SPECS = {
    "megasena": {"total_numbers": 60, "numbers_to_draw": 6, "db_name": "Megasena", "display_name": "Mega-Sena"},
    "lotofacil": {"total_numbers": 25, "numbers_to_draw": 15, "db_name": "Lotofacil", "display_name": "Lotofácil"},
    "quina": {"total_numbers": 80, "numbers_to_draw": 5, "db_name": "Quina", "display_name": "Quina"},
}


def _get_lottery_spec(lottery_name: str) -> dict:
    name = lottery_name.lower().replace("-", "").replace(" ", "")
    return LOTTERY_SPECS.get(name, LOTTERY_SPECS["megasena"])


@router.get("/lottery/results", response_model=List[dict])
async def get_latest_results(limit: int = 10, db: Session = Depends(get_db)):
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


@router.get("/lottery/{lottery_name}/stats", response_model=dict)
async def get_lottery_stats(lottery_name: str, limit: int = 100, db: Session = Depends(get_db)):
    """Retorna estatísticas básicas de uma loteria específica."""
    spec = _get_lottery_spec(lottery_name)
    db_name = spec["db_name"]
    
    results = (
        db.query(LotteryResult)
        .filter(LotteryResult.lottery_name.ilike(db_name))
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