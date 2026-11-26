"""Diversidade de carteira — otimização combinatória legítima (não preditiva).

Reduzir a sobreposição entre jogos evita redundância. Isso NÃO aumenta a chance
combinatória de acertar todos os números; o limite continua sendo m/C(N,k).
"""

import itertools
from typing import Dict, List, Sequence, Tuple


def pair_coverage(games: Sequence[Sequence[int]]) -> Tuple[int, float]:
    """Quantos pares distintos aparecem na carteira e qual fração do total possível."""
    pairs = set()
    universe_sizes = set()
    for game in games:
        for pair in itertools.combinations(sorted(game), 2):
            pairs.add(pair)
    if not games:
        return 0, 0.0
    # Estima o universo pelo maior número visto (apenas para referência relativa)
    max_number = max(max(game) for game in games)
    total_possible = max_number * (max_number - 1) // 2
    return len(pairs), len(pairs) / total_possible if total_possible else 0.0


def select_diverse_games(
    candidates: Sequence[Sequence[int]],
    num_games: int,
    *,
    max_overlap: int | None = None,
) -> List[List[int]]:
    """Seleção gulosa maximin: escolhe o jogo mais distante dos já selecionados.

    `max_overlap` limita a interseção máxima com qualquer jogo já escolhido.
    """
    if num_games <= 0 or not candidates:
        return []

    seen = {tuple(sorted(game)) for game in candidates}
    pool = [list(game) for game in seen]
    selected: List[List[int]] = []

    while pool and len(selected) < num_games:
        best_idx = None
        best_score = -float("inf")
        for idx, candidate in enumerate(pool):
            cand_set = set(candidate)
            if selected:
                overlaps = [len(cand_set & set(chosen)) for chosen in selected]
                worst = max(overlaps)
                if max_overlap is not None and worst > max_overlap:
                    continue
                score = -worst
            else:
                score = 0.0
            if score > best_score:
                best_score = score
                best_idx = idx
        if best_idx is None:
            break
        selected.append(pool.pop(best_idx))

    return selected
