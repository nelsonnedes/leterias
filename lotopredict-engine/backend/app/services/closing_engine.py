import itertools
import random
import math
from typing import List, Set, Dict, Any, Tuple, Sequence


def _to_mask(numbers: Sequence[int], index: Dict[int, int]) -> int:
    """Converte uma combinação em bitmask para contagem de interseção rápida."""
    mask = 0
    for number in numbers:
        mask |= 1 << index[number]
    return mask


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
        # Elimina duplicados e ordena
        numbers = sorted(list(set(selected_numbers)))
        n_total = len(numbers)

        # Validações de integridade
        if n_total < game_size:
            return []
        if guarantee > game_size:
            return []
        if condition_hits > n_total:
            return []
            
        # 1/2. Bitmasks permitem contar interseções com bit_count() em vez de sets
        index = {number: idx for idx, number in enumerate(numbers)}
        all_possible_bets = [
            _to_mask(comb, index)
            for comb in itertools.combinations(numbers, game_size)
        ]
        all_draw_subsets = [
            _to_mask(comb, index)
            for comb in itertools.combinations(numbers, condition_hits)
        ]

        uncovered_subsets = set(range(len(all_draw_subsets)))

        # 3. Mapear para cada aposta quais subsets ela cobre (interseção >= guarantee)
        bet_cover_map = []
        for bet in all_possible_bets:
            covered_indices = {
                idx
                for idx, subset in enumerate(all_draw_subsets)
                if (bet & subset).bit_count() >= guarantee
            }
            bet_cover_map.append(covered_indices)
            
        chosen_bets = []
        
        # 4. Algoritmo de cobertura gananciosa (Greedy Cover)
        while uncovered_subsets:
            best_bet_idx = -1
            max_new_cover = 0
            
            for idx, covered_indices in enumerate(bet_cover_map):
                new_cover = len(covered_indices.intersection(uncovered_subsets))
                if new_cover > max_new_cover:
                    max_new_cover = new_cover
                    best_bet_idx = idx
                    
            # Se nenhuma aposta puder cobrir novos elementos, encerra
            if best_bet_idx == -1 or max_new_cover == 0:
                break
                
            best_mask = all_possible_bets[best_bet_idx]
            chosen_bets.append(
                [number for number in numbers if best_mask & (1 << index[number])]
            )
            # Remove da lista de descobertos os subsets cobertos por essa aposta selecionada
            uncovered_subsets.difference_update(bet_cover_map[best_bet_idx])
            
        return chosen_bets

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
        numbers = sorted(list(set(selected_numbers)))
        if len(numbers) < game_size:
            return []

        all_possible_bets = [set(comb) for comb in itertools.combinations(numbers, game_size)]
        all_draw_subsets = [set(comb) for comb in itertools.combinations(numbers, condition_hits)]
        total_subsets = len(all_draw_subsets)

        if total_subsets == 0:
            return []

        # Cobertura greedy incremental
        uncovered = set(range(total_subsets))
        bet_cover_map = []
        for bet in all_possible_bets:
            covered = set()
            for idx, subset in enumerate(all_draw_subsets):
                if len(bet.intersection(subset)) >= guarantee:
                    covered.add(idx)
            bet_cover_map.append(covered)

        curve = []
        cumulative_covered = set()
        remaining_bets = list(range(len(all_possible_bets)))

        while remaining_bets and len(cumulative_covered) < total_subsets:
            # Escolhe a aposta que cobre mais novos subsets
            best_idx = max(remaining_bets,
                          key=lambda i: len(bet_cover_map[i] - cumulative_covered))
            new_covered = bet_cover_map[best_idx] - cumulative_covered
            if not new_covered:
                break
            cumulative_covered.update(new_covered)
            remaining_bets.remove(best_idx)

            curve.append({
                "num_bets": len(curve) + 1,
                "coverage_pct": round(len(cumulative_covered) / total_subsets * 100, 1)
            })

        return curve
