import gzip
import json
from datetime import date
from pathlib import Path
from typing import Dict, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.models import LotteryResult
from app.database.session import SessionLocal

SEED_PATH = Path(__file__).resolve().parent.parent / "data" / "historical_seed.json.gz"
EXPECTED_LOTTERIES = ("Megasena", "Lotofacil", "Quina")
BATCH_SIZE = 500


def _load_seed_draws() -> List[list]:
    if not SEED_PATH.exists():
        return []
    with gzip.open(SEED_PATH, "rt", encoding="utf-8") as fh:
        payload = json.load(fh)
    return payload.get("draws", [])


def seed_historical_data() -> Dict[str, int]:
    """
    Popula o banco com o acervo histórico empacotado quando ainda não há dados.
    Idempotente: nunca duplica concursos já presentes (mesma chave draw_date + lottery_name).
    """
    session: Session = SessionLocal()
    result = {name: 0 for name in EXPECTED_LOTTERIES}
    try:
        existing = {
            (row.lottery_name, row.draw_date)
            for row in session.query(LotteryResult.lottery_name, LotteryResult.draw_date).all()
        }

        inserted = 0
        for lottery_name, draw_date_str, numbers, source_reference in _load_seed_draws():
            key = (lottery_name, date.fromisoformat(draw_date_str))
            if key in existing:
                continue
            session.add(
                LotteryResult(
                    lottery_name=lottery_name,
                    draw_date=key[1],
                    numbers=numbers,
                    source_reference=source_reference or None,
                )
            )
            existing.add(key)
            inserted += 1
            if inserted % BATCH_SIZE == 0:
                session.commit()

        session.commit()

        counts = dict(
            session.query(LotteryResult.lottery_name, func.count(LotteryResult.id))
            .group_by(LotteryResult.lottery_name)
            .all()
        )
        for name in EXPECTED_LOTTERIES:
            result[name] = int(counts.get(name, 0))
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

    return result
