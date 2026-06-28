import itertools
import random
import math
from typing import List, Set, Dict, Any, Tuple

class ClosingEngine:
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
            
        # 1. Gerar todas as apostas possíveis (combinações de tamanho game_size)
        all_possible_bets = [set(comb) for comb in itertools.combinations(numbers, game_size)]
        
        # 2. Gerar todos os subconjuntos de sorteio a cobrir (combinações de tamanho condition_hits)
        all_draw_subsets = [set(comb) for comb in itertools.combinations(numbers, condition_hits)]
        
        uncovered_subsets = set(range(len(all_draw_subsets)))
        
        # 3. Mapear para cada aposta candidata quais índices de sorteio ela cobre (interseção >= guarantee)
        bet_cover_map = []
        for bet in all_possible_bets:
            covered_indices = set()
            for idx, subset in enumerate(all_draw_subsets):
                if len(bet.intersection(subset)) >= guarantee:
                    covered_indices.add(idx)
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
                
            chosen_bets.append(sorted(list(all_possible_bets[best_bet_idx])))
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
        numbers = sorted(list(set(selected_numbers)))
        all_possible_bets = [set(comb) for comb in itertools.combinations(numbers, game_size)]
        all_draw_subsets = [set(comb) for comb in itertools.combinations(numbers, condition_hits)]

        def compute_coverage(bets: List[List[int]]) -> int:
            """Calcula quantos subsets de sorteio estão cobertos."""
            covered = set()
            for bet in bets:
                bet_set = set(bet)
                for idx, subset in enumerate(all_draw_subsets):
                    if idx in covered:
                        continue
                    if len(bet_set.intersection(subset)) >= guarantee:
                        covered.add(idx)
            return len(covered)

        total_subsets = len(all_draw_subsets)
        current = [list(b) for b in initial_solution]
        current_coverage = compute_coverage(current)
        best = [list(b) for b in current]
        best_coverage = current_coverage
        cost_history = [len(current)]

        temp = initial_temp
        for iteration in range(max_iterations):
            if current_coverage >= total_subsets:
                break

            # Tenta remover uma aposta
            if len(current) > 1:
                idx_to_remove = random.randrange(len(current))
                candidate = [list(b) for b in current]
                candidate.pop(idx_to_remove)
            else:
                candidate = [list(b) for b in current]

            # Tenta adicionar uma aposta diferente
            existing_sets = [set(b) for b in candidate]
            available_bets = [b for b in all_possible_bets if b not in existing_sets]
            if available_bets:
                bet_to_add = random.choice(available_bets)
                candidate.append(sorted(bet_to_add))

            candidate_coverage = compute_coverage(candidate)

            # Função de custo: minimizar número de apostas, maximizar cobertura
            delta = (len(current) - len(candidate)) + (candidate_coverage - current_coverage) * 0.1

            if delta > 0 or random.random() < math.exp(delta / max(temp, 0.001)):
                current = candidate
                current_coverage = candidate_coverage

                if current_coverage > best_coverage or (
                    current_coverage == best_coverage and len(current) < len(best)
                ):
                    best = [list(b) for b in current]
                    best_coverage = current_coverage

            temp *= cooling_rate
            cost_history.append(len(current))

        return best, cost_history

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
