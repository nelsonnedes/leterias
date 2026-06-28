import numpy as np
from collections import Counter
from typing import List, Dict, Tuple, Set, Optional
import random

class ProbabilityAlgorithms:
    """Algoritmos matemáticos e filtros estatísticos avançados para previsão de loterias."""

    @staticmethod
    def frequency_analysis(numbers_history: List[int], total_numbers: int = 60) -> Dict[int, float]:
        """Calcula a frequência relativa de cada dezena no histórico."""
        if not numbers_history:
            return {i: 0.0 for i in range(1, total_numbers + 1)}
        
        counter = Counter(numbers_history)
        total_draws = sum(counter.values())
        
        frequencies = {}
        for num in range(1, total_numbers + 1):
            frequencies[num] = counter.get(num, 0) / total_draws if total_draws > 0 else 0.0
        
        return frequencies

    @staticmethod
    def delay_analysis(numbers_history: List[List[int]], total_numbers: int = 60) -> Dict[int, int]:
        """Calcula o atraso (número de concursos sem sair) para cada dezena."""
        if not numbers_history:
            return {i: 0 for i in range(1, total_numbers + 1)}
        
        delays = {num: 0 for num in range(1, total_numbers + 1)}
        drawn_set = set()
        
        # Percorre do mais recente ao mais antigo
        for idx, draw in enumerate(numbers_history):
            for num in draw:
                if num not in drawn_set and 1 <= num <= total_numbers:
                    delays[num] = idx
                    drawn_set.add(num)
        
        # Para números que nunca saíram no histórico analisado, definimos o atraso máximo
        for num in range(1, total_numbers + 1):
            if num not in drawn_set:
                delays[num] = len(numbers_history)
                
        return delays

    # ==========================================
    # FILTROS ESTATÍSTICOS E REGRAS DE NEGÓCIO
    # ==========================================

    @staticmethod
    def is_parity_ok(numbers: List[int], lottery_name: str) -> bool:
        """Filtro de Paridade: Garante uma proporção equilibrada entre pares e ímpares."""
        name = lottery_name.lower()
        num_pares = sum(1 for n in numbers if n % 2 == 0)
        
        if name in ["megasena", "mega-sena"]:
            # Em 6 números, o ideal estatístico (soma mais de 80% dos sorteios) são: 2, 3 ou 4 pares.
            # Evita extremos: 0, 1, 5 ou 6 pares.
            return num_pares in [2, 3, 4]
        
        elif name in ["lotofacil", "lotofácil"]:
            # Em 15 números, a paridade ideal histórica é entre 6 e 9 pares (concentrado em 7 ou 8).
            return num_pares in [6, 7, 8, 9]
            
        elif name == "quina":
            # Em 5 números, a paridade ideal é de 2 ou 3 pares.
            return num_pares in [2, 3]
            
        return True

    @staticmethod
    def is_sum_ok(numbers: List[int], lottery_name: str) -> bool:
        """Filtro de Somas: Restringe os jogos à faixa de soma histórica mais provável (Curva Normal)."""
        name = lottery_name.lower()
        total_sum = sum(numbers)
        
        if name in ["megasena", "mega-sena"]:
            # Faixa ideal histórica para Mega-Sena: soma entre 120 e 220.
            return 120 <= total_sum <= 220
            
        elif name in ["lotofacil", "lotofácil"]:
            # Faixa ideal histórica para Lotofácil: soma entre 160 e 230.
            return 160 <= total_sum <= 230
            
        elif name == "quina":
            # Faixa ideal histórica para Quina: soma entre 150 e 250.
            return 150 <= total_sum <= 250
            
        return True

    @staticmethod
    def is_consecutive_ok(numbers: List[int], lottery_name: str) -> bool:
        """Filtro de Espaçamento: Evita aglomeração limitando sequências consecutivas."""
        name = lottery_name.lower()
        sorted_nums = sorted(numbers)
        
        max_seq = 1
        current_seq = 1
        
        for i in range(len(sorted_nums) - 1):
            if sorted_nums[i+1] == sorted_nums[i] + 1:
                current_seq += 1
                max_seq = max(max_seq, current_seq)
            else:
                current_seq = 1
        
        if name in ["megasena", "mega-sena"]:
            # Mega-Sena: Max 2 dezenas consecutivas (Ex: [14, 15] ok, [14, 15, 16] bloqueado).
            return max_seq <= 2
            
        elif name in ["lotofacil", "lotofácil"]:
            # Lotofácil: Max 3 dezenas consecutivas (Ex: [10, 11, 12] ok, [10, 11, 12, 13] bloqueado).
            return max_seq <= 3
            
        elif name == "quina":
            # Quina: Max 2 dezenas consecutivas.
            return max_seq <= 2
            
        return True

    @staticmethod
    def is_quadrant_ok(numbers: List[int], lottery_name: str) -> bool:
        """Filtro de Quadrantes: Evita a concentração física das dezenas em uma única área do volante."""
        name = lottery_name.lower()
        
        if name in ["megasena", "mega-sena"]:
            # Divisão padrão da Mega-Sena (60 dezenas, matriz 6x10):
            # Q1 (Sup-Esq): 1-5, 11-15, 21-25
            # Q2 (Sup-Dir): 6-10, 16-20, 26-30
            # Q3 (Inf-Esq): 31-35, 41-45, 51-55
            # Q4 (Inf-Dir): 36-40, 46-50, 56-60
            quadrant_counts = {1: 0, 2: 0, 3: 0, 4: 0}
            
            for n in numbers:
                # Determina linha (0 a 5) e coluna (1 a 10)
                row = (n - 1) // 10
                col = (n - 1) % 10 + 1
                
                if row < 3: # Linhas 1, 2, 3
                    if col <= 5:
                        quadrant_counts[1] += 1
                    else:
                        quadrant_counts[2] += 1
                else: # Linhas 4, 5, 6
                    if col <= 5:
                        quadrant_counts[3] += 1
                    else:
                        quadrant_counts[4] += 1
                        
            # Evita concentrar 5 ou 6 dezenas no mesmo quadrante
            return all(count <= 4 for count in quadrant_counts.values())
            
        elif name == "quina":
            # Quina (80 dezenas, matriz 8x10): Quadrantes de 20 números
            # Q1: 1-5..31-35 | Q2: 6-10..36-40 | Q3: 41-45..71-75 | Q4: 46-50..76-80
            quadrant_counts = {1: 0, 2: 0, 3: 0, 4: 0}
            for n in numbers:
                row = (n - 1) // 10
                col = (n - 1) % 10 + 1
                if row < 4:
                    if col <= 5:
                        quadrant_counts[1] += 1
                    else:
                        quadrant_counts[2] += 1
                else:
                    if col <= 5:
                        quadrant_counts[3] += 1
                    else:
                        quadrant_counts[4] += 1
            return all(count <= 3 for count in quadrant_counts.values())
            
        return True

    @staticmethod
    def is_stupid_game(numbers: List[int], lottery_name: str, historical_draws: Optional[List[List[int]]] = None) -> bool:
        """Filtro de 'Jogos Estúpidos': Descarta sequências óbvias, repetições de dígitos ou jogos já sorteados."""
        sorted_nums = sorted(numbers)
        
        # 1. Bloquear sequências óbvias desde o começo do volante
        if sorted_nums == list(range(sorted_nums[0], sorted_nums[0] + len(sorted_nums))):
            return True
            
        # 2. Bloquear jogos onde todos os números terminam com o mesmo dígito (Ex: 2, 12, 22, 32, 42, 52)
        end_digits = [n % 10 for n in sorted_nums]
        if len(set(end_digits)) == 1:
            return True
            
        # 3. Bloquear jogos que já saíram anteriormente no histórico de sorteios (se fornecido)
        if historical_draws:
            historical_sets = [set(d) for d in historical_draws]
            current_set = set(sorted_nums)
            if current_set in historical_sets:
                return True
                
        return False

    @staticmethod
    def validate_game(numbers: List[int], lottery_name: str, historical_draws: Optional[List[List[int]]] = None) -> bool:
        """Aplica toda a esteira de filtros para validar se o jogo é estatisticamente viável."""
        if not ProbabilityAlgorithms.is_parity_ok(numbers, lottery_name):
            return False
        if not ProbabilityAlgorithms.is_sum_ok(numbers, lottery_name):
            return False
        if not ProbabilityAlgorithms.is_consecutive_ok(numbers, lottery_name):
            return False
        if not ProbabilityAlgorithms.is_quadrant_ok(numbers, lottery_name):
            return False
        if ProbabilityAlgorithms.is_stupid_game(numbers, lottery_name, historical_draws):
            return False
        return True

    # ==========================================
    # GERAÇÃO PREDITIVA
    # ==========================================

    @staticmethod
    def generate_prediction(
        numbers_history: List[List[int]],
        total_numbers: int = 60,
        numbers_to_draw: int = 6,
        strategy: str = "combined",
        lottery_name: str = "megasena",
        num_games: int = 1
    ) -> List[List[int]]:
        """
        Gera previsões estatísticas baseadas na estratégia escolhida, 
        passando-as pela esteira de validação antes do retorno.
        """
        if not numbers_history:
            # Sem histórico, gera de forma aleatória que passe nos filtros
            games = []
            for _ in range(num_games):
                attempts = 0
                while attempts < 1000:
                    nums = sorted(random.sample(range(1, total_numbers + 1), numbers_to_draw))
                    if ProbabilityAlgorithms.validate_game(nums, lottery_name):
                        games.append(nums)
                        break
                    attempts += 1
                if len(games) < _ + 1:
                    games.append(sorted(random.sample(range(1, total_numbers + 1), numbers_to_draw)))
            return games

        # Análises básicas
        flat_history = [n for draw in numbers_history for n in draw]
        freq = ProbabilityAlgorithms.frequency_analysis(flat_history, total_numbers)
        delays = ProbabilityAlgorithms.delay_analysis(numbers_history, total_numbers)
        
        # Pontuação combinada por dezena
        # Quanto maior a frequência e maior o atraso (fria mas estatisticamente próxima de sair), melhor a pontuação.
        # Normalizamos os valores para somá-los
        max_freq = max(freq.values()) if freq.values() else 1.0
        max_delay = max(delays.values()) if delays.values() else 1.0
        
        scores = {}
        for n in range(1, total_numbers + 1):
            f_norm = freq[n] / max_freq if max_freq > 0 else 0.0
            d_norm = delays[n] / max_delay if max_delay > 0 else 0.0
            
            if strategy == "frequency":
                scores[n] = f_norm
            elif strategy == "delay":
                scores[n] = d_norm
            else:  # combined/hibrida
                # Pesos: 60% peso da frequência histórica, 40% peso do tempo em atraso (tendência média)
                scores[n] = (f_norm * 0.6) + (d_norm * 0.4)

        # Selecionamos o grupo das melhores dezenas (pool restrito)
        # Ex: Para Mega-Sena (60 números), selecionamos os 30 melhores. Para Quina (80), os 40. Para Lotofácil, 20 dezenas.
        pool_size = max(numbers_to_draw + 5, int(total_numbers * 0.5))
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        best_numbers = [n for n, _ in sorted_scores[:pool_size]]

        generated_games = []
        
        for _ in range(num_games):
            game_ok = False
            attempts = 0
            
            # Tenta combinar do pool das melhores dezenas primeiro
            while not game_ok and attempts < 1000:
                # Escolhe aleatoriamente do pool de melhores dezenas
                nums = sorted(random.sample(best_numbers, numbers_to_draw))
                if ProbabilityAlgorithms.validate_game(nums, lottery_name, numbers_history):
                    generated_games.append(nums)
                    game_ok = True
                attempts += 1
            
            # Se não conseguiu dentro do pool restrito (muito raro), abre a busca para todas as dezenas
            if not game_ok:
                attempts = 0
                while not game_ok and attempts < 1000:
                    nums = sorted(random.sample(range(1, total_numbers + 1), numbers_to_draw))
                    if ProbabilityAlgorithms.validate_game(nums, lottery_name, numbers_history):
                        generated_games.append(nums)
                        game_ok = True
                    attempts += 1
            
            # Fallback seguro: se falhar em todos os filtros, retorna uma aposta aleatória para evitar travamentos
            if not game_ok:
                generated_games.append(sorted(random.sample(range(1, total_numbers + 1), numbers_to_draw)))

        return generated_games