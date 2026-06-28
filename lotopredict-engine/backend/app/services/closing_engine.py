import itertools
from typing import List, Set, Dict, Any

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
