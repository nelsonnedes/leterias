import itertools
import random
import math
from collections import defaultdict
from typing import List, Set, Dict, Any, Tuple, Sequence

# Acima deste número de relações, usamos o modo heurístico (amostragem) em vez do índice exato
MAX_COVER_RELATIONS = 8_000_000


def _to_mask(numbers: Sequence[int], index: Dict[int, int]) -> int:
    """Converte uma combinação em bitmask para contagem de interseção rápida."""
    mask = 0
    for number in numbers:
        mask |= 1 << index[number]
    return mask


def _build_cover_index(
    numbers: List[int], game_size: int, guarantee: int, condition_hits: int
):
    """Índice de cobertura: para cada aposta, quais subsets ela cobre.

    Em vez de comparar cada aposta contra todos os subsets (O(B*S)), enumeramos
    diretamente os subsets que uma aposta cobre: escolhemos quais dezenas da
    aposta são trocadas por dezenas de fora. Para 20 dezenas / 15 sorteadas /
    garantia 14, isso cai de ~240 milhões de comparações para ~1,2 milhão.
    """
    n, k, c, g = len(numbers), game_size, condition_hits, guarantee
    if n < k or k <= 0 or g > k or c > n or g > c:
        return None

    bets = list(itertools.combinations(range(n), k))
    subsets = list(itertools.combinations(range(n), c))
    if not bets or not subsets:
        return None

    relations_per_bet = 0
    for common in range(g, min(k, c) + 1):
        excluded = k - common
        added = c - common
        if excluded < 0 or added < 0 or added > n - k:
            continue
        relations_per_bet += math.comb(k, excluded) * math.comb(n - k, added)
    subset_index = {subset: idx for idx, subset in enumerate(subsets)}
    covered_by: List[List[int]] = [[] for _ in subsets]
    cover_masks: List[int] = []

    for bet in bets:
        bet_set = set(bet)
        outside = [i for i in range(n) if i not in bet_set]
        covered = set()
        for common in range(g, min(k, c) + 1):
            excluded = k - common
            added = c - common
            if excluded < 0 or added < 0 or added > len(outside):
                continue
            for removed in itertools.combinations(bet, excluded):
                base = bet_set - set(removed)
                for inserted in itertools.combinations(outside, added):
                    subset = tuple(sorted(base | set(inserted)))
                    idx = subset_index.get(subset)
                    if idx is not None:
                        covered.add(idx)
        bet_position = len(cover_masks)
        for idx in covered:
            covered_by[idx].append(bet_position)
        mask = 0
        for idx in covered:
            mask |= 1 << idx
        cover_masks.append(mask)

    return bets, covered_by, cover_masks, len(subsets)


def _greedy_cover(covered_by: List[List[int]], cover_masks: List[int]):
    """Greedy com filas de contagem: atualiza só as apostas afetadas."""
    counts = [mask.bit_count() for mask in cover_masks]
    buckets: Dict[int, Set[int]] = defaultdict(set)
    for bet, count in enumerate(counts):
        if count > 0:
            buckets[count].add(bet)

    uncovered = (1 << len(covered_by)) - 1
    chosen: List[int] = []
    cumulative_coverage: List[int] = []
    covered_total = 0

    while uncovered and buckets:
        max_count = max(buckets)
        bucket = buckets[max_count]
        bet = bucket.pop()
        if not bucket:
            del buckets[max_count]
        if counts[bet] != max_count:
            continue

        newly = cover_masks[bet] & uncovered
        if not newly:
            continue

        chosen.append(bet)
        remaining = newly
        while remaining:
            lowest = remaining & -remaining
            subset_idx = lowest.bit_length() - 1
            remaining ^= lowest
            for other in covered_by[subset_idx]:
                old = counts[other]
                if old > 0:
                    old_bucket = buckets.get(old)
                    if old_bucket is not None:
                        old_bucket.discard(other)
                        if not old_bucket:
                            del buckets[old]
                    counts[other] = old - 1
                    if old - 1 > 0:
                        buckets[old - 1].add(other)

        uncovered &= ~newly
        covered_total += newly.bit_count()
        cumulative_coverage.append(covered_total)

    return chosen, cumulative_coverage


def _estimated_relations(n: int, k: int, c: int, g: int, num_bets: int) -> int:
    """Estima quantas relações aposta⊂subset seriam enumeradas no modo exato."""
    per_bet = 0
    for common in range(g, min(k, c) + 1):
        excluded = k - common
        added = c - common
        if excluded < 0 or added < 0 or added > n - k:
            continue
        per_bet += math.comb(k, excluded) * math.comb(n - k, added)
    return per_bet * num_bets


def _heavy_cover(
    numbers: List[int],
    game_size: int,
    guarantee: int,
    condition_hits: int,
    seed: int = 0,
):
    """Cobertura heurística para combinações muito pesadas no modo exato.

    Avalia candidatos contra uma amostra dos subsets descobertos e, a cada
    escolha, remove todos os subsets que aquela aposta cobre. O resultado
    continua sendo uma cobertura integral (100%) — apenas não é mínima.
    """
    n = len(numbers)
    index = {number: idx for idx, number in enumerate(numbers)}
    bets = list(itertools.combinations(range(n), game_size))
    subsets = list(itertools.combinations(range(n), condition_hits))
    # bets/subsets são tuplas de ÍNDICES (0..n-1), não valores de dezena
    bet_masks = [sum(1 << i for i in bet) for bet in bets]
    subset_masks = [sum(1 << i for i in subset) for subset in subsets]

    uncovered = set(range(len(subsets)))
    used: Set[int] = set()
    chosen: List[int] = []
    cumulative: List[int] = []
    rng = random.Random(seed)

    while uncovered:
        available = [i for i in range(len(bets)) if i not in used]
        if not available:
            break
        sample = rng.sample(tuple(uncovered), min(100, len(uncovered)))

        def score(bet_index: int) -> int:
            mask = bet_masks[bet_index]
            return sum(
                1 for subset_idx in sample
                if (mask & subset_masks[subset_idx]).bit_count() >= guarantee
            )

        pool = rng.sample(available, min(600, len(available)))
        best = max(pool, key=score)
        if score(best) == 0:
            best = max(available, key=score)

        newly = {
            subset_idx for subset_idx in uncovered
            if (bet_masks[best] & subset_masks[subset_idx]).bit_count() >= guarantee
        }
        if not newly:
            break
        uncovered -= newly
        used.add(best)
        chosen.append(best)
        cumulative.append(len(subsets) - len(uncovered))

    return bets, chosen, cumulative


class ClosingEngine:

    @staticmethod
    def compute_coverage(
        selected_numbers: List[int],
        game_size: int,
        guarantee: int,
        condition_hits: int,
        games: List[List[int]],
    ) -> Dict[str, Any]:
        """Cobertura real de um conjunto de apostas (após filtros, por exemplo)."""
        numbers = sorted(set(selected_numbers))
        if len(numbers) < game_size or guarantee > condition_hits or condition_hits > min(game_size, len(numbers)):
            return {"covered_subsets": 0, "total_subsets": 0, "coverage_pct": 0.0}

        index = {number: idx for idx, number in enumerate(numbers)}
        subsets = [
            _to_mask(comb, index)
            for comb in itertools.combinations(numbers, condition_hits)
        ]
        bet_masks = [
            _to_mask(game, index)
            for game in games
            if set(game).issubset(index)
        ]

        covered = 0
        for subset in subsets:
            if any((bet & subset).bit_count() >= guarantee for bet in bet_masks):
                covered += 1

        total = len(subsets)
        return {
            "covered_subsets": covered,
            "total_subsets": total,
            "coverage_pct": round(covered / total * 100, 1) if total else 0.0,
        }

    @staticmethod
    def generate_desdobramento(
        selected_numbers: List[int], 
        game_size: int, 
        guarantee: int, 
        condition_hits: int
    ) -> List[List[int]]:
        """
        Gera o desdobramento combinatório ótimo (Fechamento) utilizando o algoritmo Greedy Cover.
        Garante que, se condition_hits números sorteados estiverem entre as selected_numbers,
        pelo menos um jogo gerado terá no mínimo guarantee acertos.
        """
        numbers = sorted(set(selected_numbers))
        n = len(numbers)
        if n < game_size or guarantee > game_size or condition_hits > n or guarantee > condition_hits:
            return []

        num_bets = math.comb(n, game_size)
        if _estimated_relations(n, game_size, condition_hits, guarantee, num_bets) > MAX_COVER_RELATIONS:
            bets, chosen, _ = _heavy_cover(numbers, game_size, guarantee, condition_hits)
            return [[numbers[i] for i in bets[bet]] for bet in chosen]

        cover_index = _build_cover_index(numbers, game_size, guarantee, condition_hits)
        if cover_index is None:
            return []
        bets, covered_by, cover_masks, _ = cover_index
        chosen, _ = _greedy_cover(covered_by, cover_masks)
        return [[numbers[i] for i in bets[bet]] for bet in chosen]

    @staticmethod
    def refine_with_simulated_annealing(
        selected_numbers: List[int],
        game_size: int,
        guarantee: int,
        condition_hits: int,
        initial_solution: List[List[int]],
        max_iterations: int = 1000,
        initial_temp: float = 1.0,
        cooling_rate: float = 0.995
    ) -> Tuple[List[List[int]], List[float]]:
        """
        Refina um fechamento usando Simulated Annealing para reduzir o número
        de apostas enquanto mantém a garantia.
        
        Retorna (solucao_otimizada, historico_de_custo).
        """
        numbers = sorted(set(selected_numbers))
        if len(numbers) < game_size or guarantee > condition_hits or condition_hits > min(game_size, len(numbers)):
            return [list(b) for b in initial_solution], [len(initial_solution)]

        index = {number: idx for idx, number in enumerate(numbers)}
        bet_masks = [
            _to_mask(comb, index)
            for comb in itertools.combinations(numbers, game_size)
        ]
        subset_masks = [
            _to_mask(comb, index)
            for comb in itertools.combinations(numbers, condition_hits)
        ]
        total_subsets = len(subset_masks)

        def compute_coverage(masks: List[int]) -> int:
            return sum(
                1 for subset in subset_masks
                if any((bet & subset).bit_count() >= guarantee for bet in masks)
            )

        def to_numbers(mask: int) -> List[int]:
            return [number for number in numbers if mask & (1 << index[number])]

        current = [
            _to_mask(bet, index) for bet in initial_solution if set(bet).issubset(index)
        ]
        current_coverage = compute_coverage(current)
        best = list(current)
        best_coverage = current_coverage
        cost_history = [len(current)]

        temp = initial_temp
        for _ in range(max_iterations):
            candidate = list(current)
            # Com cobertura incompleta, tenta adicionar uma aposta nova; caso contrário, tenta remover.
            if current_coverage < total_subsets:
                existing = set(candidate)
                available = [mask for mask in bet_masks if mask not in existing]
                if available:
                    candidate.append(random.choice(available))
            elif len(candidate) > 1:
                candidate.pop(random.randrange(len(candidate)))

            candidate_coverage = compute_coverage(candidate)
            # Nunca aceita perder cobertura quando já se tem cobertura integral.
            if current_coverage == total_subsets and candidate_coverage < total_subsets:
                temp *= cooling_rate
                continue

            delta = (len(current) - len(candidate)) + (
                candidate_coverage - current_coverage
            ) * 0.1
            if delta > 0 or random.random() < math.exp(delta / max(temp, 0.001)):
                current = candidate
                current_coverage = candidate_coverage
                if current_coverage > best_coverage or (
                    current_coverage == best_coverage and len(current) < len(best)
                ):
                    best = list(current)
                    best_coverage = current_coverage

            temp *= cooling_rate
            cost_history.append(len(current))

        return [to_numbers(mask) for mask in best], cost_history

    @staticmethod
    def get_coverage_curve(
        selected_numbers: List[int],
        game_size: int,
        guarantee: int,
        condition_hits: int
    ) -> List[Dict[str, Any]]:
        """
        Gera a Curva de Otimização: para cada número de apostas possível,
        calcula quantos subsets de sorteio estão cobertos.
        Retorna lista de {num_bets, coverage_pct} para plotagem.
        """
        numbers = sorted(set(selected_numbers))
        n = len(numbers)
        if n < game_size or guarantee > game_size or condition_hits > n or guarantee > condition_hits:
            return []

        num_bets = math.comb(n, game_size)
        if _estimated_relations(n, game_size, condition_hits, guarantee, num_bets) > MAX_COVER_RELATIONS:
            _, _, cumulative = _heavy_cover(numbers, game_size, guarantee, condition_hits)
            total_subsets = math.comb(n, condition_hits)
        else:
            cover_index = _build_cover_index(numbers, game_size, guarantee, condition_hits)
            if cover_index is None:
                return []
            _, covered_by, cover_masks, total_subsets = cover_index
            _, cumulative = _greedy_cover(covered_by, cover_masks)
        return [
            {
                "num_bets": position + 1,
                "coverage_pct": round(covered / total_subsets * 100, 1),
            }
            for position, covered in enumerate(cumulative)
        ]
