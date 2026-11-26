"""Odds combinatórias — única fonte de probabilidades do sistema.

Sorteios são independentes: a chance de acertar todos os números com um jogo é
1 / C(N, k), constante. Nenhuma estratégia, modelo ou técnica quântica altera esse valor.
"""

from math import comb
from typing import Any, Dict

from app.core.constants import get_lottery_spec


def total_combinations(total_numbers: int, numbers_to_draw: int) -> int:
    """Quantidade de jogos possíveis C(N, k)."""
    if not (0 < numbers_to_draw <= total_numbers):
        raise ValueError("Parâmetros de loteria inválidos.")
    return comb(total_numbers, numbers_to_draw)


def hit_probability(total_numbers: int, numbers_to_draw: int, hits: int) -> float:
    """P(exatamente `hits` acertos) pela hipergeométrica."""
    if not 0 <= hits <= numbers_to_draw:
        return 0.0
    numerator = comb(numbers_to_draw, hits) * comb(
        total_numbers - numbers_to_draw, numbers_to_draw - hits
    )
    return numerator / total_combinations(total_numbers, numbers_to_draw)


def cumulative_hit_probability(
    total_numbers: int, numbers_to_draw: int, min_hits: int
) -> float:
    """P(pelo menos `min_hits` acertos)."""
    return sum(
        hit_probability(total_numbers, numbers_to_draw, hits)
        for hits in range(min_hits, numbers_to_draw + 1)
    )


def combinatorial_odds(lottery_name: str, num_games: int = 1) -> Dict[str, Any]:
    """Odds de uma modalidade, com denominadores exatos em inteiro Python."""
    spec = get_lottery_spec(lottery_name)
    total_numbers = spec["total_numbers"]
    numbers_to_draw = spec["numbers_to_draw"]
    games = max(1, int(num_games))
    total = total_combinations(total_numbers, numbers_to_draw)

    per_game = []
    for hits in range(numbers_to_draw, -1, -1):
        probability = hit_probability(total_numbers, numbers_to_draw, hits)
        per_game.append(
            {
                "hits": hits,
                "probability": probability,
                "denominator": round(1 / probability) if probability > 0 else None,
            }
        )

    return {
        "lottery": spec["display_name"],
        "lottery_key": lottery_name.lower(),
        "universe_size": total_numbers,
        "draw_size": numbers_to_draw,
        "total_combinations": total,
        "per_game": per_game,
        "all_hits": {
            "probability_per_game": 1 / total,
            "denominator_per_game": total,
            "probability_with_games": min(games / total, 1.0),
            "denominator_with_games": round(total / min(games, total)),
            "games": games,
            "formula": "m / C(N,k) para jogos distintos",
        },
        "notice": (
            "Cada concurso é independente. Nenhuma estratégia ou modelo aumenta "
            "a chance de acertar todos os números; apenas a quantidade de jogos distintos."
        ),
    }
