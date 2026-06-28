from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.models import LotteryResult
from app.database.session import get_db

router = APIRouter()


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
    results = (
        db.query(LotteryResult)
        .filter(LotteryResult.lottery_name.ilike(lottery_name))
        .order_by(LotteryResult.draw_date.desc())
        .limit(limit)
        .all()
    )
    
    if not results:
        return {"message": "Nenhum resultado encontrado"}
    
    # flatten numbers
    all_numbers = [num for r in results for num in r.numbers]
    
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
        )[:10]
    }