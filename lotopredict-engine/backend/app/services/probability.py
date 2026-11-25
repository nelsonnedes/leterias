import math
import random
from collections import Counter
from typing import Dict, FrozenSet, List, Optional, Set, Tuple

import numpy as np

from app.services.ml_predictor import MLPredictor

# Conjunto de números primos até 80 (cobre Mega-Sena, Lotofácil e Quina)
PRIMES_UP_TO_80: FrozenSet[int] = frozenset({
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37,
    41, 43, 47, 53, 59, 61, 67, 71, 73, 79,
})


class ProbabilityAlgorithms:
    """Algoritmos matemáticos, engenharia de features e filtros estatísticos para loterias."""

    @staticmethod
    def _normalize_lottery_name(lottery_name: str) -> str:
        return lottery_name.lower().replace("-", "").replace(" ", "")

    @staticmethod
    def frequency_analysis(numbers_history: List[int], total_numbers: int = 60) -> Dict[int, float]:
        """Calcula a frequência relativa de cada dezena no histórico."""
        if not numbers_history:
            return {i: 0.0 for i in range(1, total_numbers + 1)}

        counter = Counter(numbers_history)
        total_draws = sum(counter.values())

        return {
            num: (counter.get(num, 0) / total_draws if total_draws > 0 else 0.0)
            for num in range(1, total_numbers + 1)
        }

    @staticmethod
    def delay_analysis(numbers_history: List[List[int]], total_numbers: int = 60) -> Dict[int, int]:
        """
        Calcula o atraso (número de concursos sem sair) para cada dezena.
        Espera `numbers_history` em ordem cronológica (mais antigo -> mais recente).
        """
        if not numbers_history:
            return {i: 0 for i in range(1, total_numbers + 1)}

        delays = {num: 0 for num in range(1, total_numbers + 1)}
        drawn_set: Set[int] = set()

        # Percorre do mais recente (fim da lista) para o mais antigo (início)
        for idx, draw in enumerate(reversed(numbers_history)):
            for num in draw:
                if num not in drawn_set and 1 <= num <= total_numbers:
                    delays[num] = idx
                    drawn_set.add(num)
            if len(drawn_set) == total_numbers:
                break

        max_delay = len(numbers_history)
        for num in range(1, total_numbers + 1):
            if num not in drawn_set:
                delays[num] = max_delay

        return delays

    @staticmethod
    def pair_analysis(numbers_history: List[List[int]], total_numbers: int = 60) -> Dict[str, int]:
        """
        Análise de Pares: Calcula quantas vezes cada par de números apareceu junto.
        Retorna dict no formato 'num1-num2' -> contagem.
        """
        pair_counts: Dict[str, int] = {}
        for draw in numbers_history:
            sorted_draw = sorted(draw)
            length = len(sorted_draw)
            for i in range(length):
                n_i = sorted_draw[i]
                for j in range(i + 1, length):
                    pair_key = f"{n_i}-{sorted_draw[j]}"
                    pair_counts[pair_key] = pair_counts.get(pair_key, 0) + 1
        return pair_counts

    @staticmethod
    def terminators_analysis(numbers_history: List[int], total_numbers: int = 60) -> Dict[int, int]:
        """
        Análise de Terminadores (últimos dígitos): conta quantas vezes
        cada dígito final (0-9) apareceu nos sorteios.
        """
        term_counts: Dict[int, int] = {d: 0 for d in range(10)}
        for n in numbers_history:
            last_digit = n % 10
            term_counts[last_digit] = term_counts.get(last_digit, 0) + 1
        return term_counts

    @staticmethod
    def sliding_window_frequency(
        numbers_history: List[List[int]],
        total_numbers: int = 60,
        window_size: int = 25,
    ) -> Tuple[Dict[int, float], Dict[int, float]]:
        """
        Análise de Tendência por Janela Deslizante (ordem cronológica: antigo -> recente).
        Retorna (freq_janela_recente, freq_historico_total).
        """
        if not numbers_history:
            empty = {i: 0.0 for i in range(1, total_numbers + 1)}
            return empty, dict(empty)

        flat_all = [n for draw in numbers_history for n in draw]
        counter_all = Counter(flat_all)
        total_all = sum(counter_all.values()) or 1
        freq_all = {i: counter_all.get(i, 0) / total_all for i in range(1, total_numbers + 1)}

        recent = numbers_history[-window_size:] if len(numbers_history) > window_size else numbers_history
        flat_recent = [n for draw in recent for n in draw]
        counter_recent = Counter(flat_recent)
        total_recent = sum(counter_recent.values()) or 1
        freq_recent = {i: counter_recent.get(i, 0) / total_recent for i in range(1, total_numbers + 1)}

        return freq_recent, freq_all

    @staticmethod
    def compute_dynamic_sum_range(
        numbers_history: Optional[List[List[int]]],
        lottery_name: str,
        sigma_factor: float = 1.25,
    ) -> Tuple[float, float]:
        """
        Calcula a faixa ideal de soma dinamicamente (média ± sigma_factor * desvio padrão)
        a partir do histórico real quando há >= 30 concursos; caso contrário usa faixas padrão.
        """
        name = ProbabilityAlgorithms._normalize_lottery_name(lottery_name)
        fallback_ranges = {
            "megasena": (120.0, 225.0),
            "lotofacil": (165.0, 225.0),
            "quina": (140.0, 265.0),
        }

        if numbers_history and len(numbers_history) >= 30:
            sums = np.array([sum(draw) for draw in numbers_history if draw], dtype=float)
            if len(sums) >= 30:
                mean = float(np.mean(sums))
                std = float(np.std(sums))
                if std > 0:
                    return (mean - sigma_factor * std, mean + sigma_factor * std)

        return fallback_ranges.get(name, (0.0, float("inf")))

    # ==========================================
    # FILTROS ESTATÍSTICOS E REGRAS DE NEGÓCIO
    # ==========================================

    @staticmethod
    def is_parity_ok(numbers: List[int], lottery_name: str) -> bool:
        """Filtro de Paridade: Garante uma proporção equilibrada entre pares e ímpares."""
        name = ProbabilityAlgorithms._normalize_lottery_name(lottery_name)
        num_pares = sum(1 for n in numbers if n % 2 == 0)

        if name == "megasena":
            return num_pares in [2, 3, 4]
        elif name in ["lotofacil", "lotofácil"]:
            return num_pares in [6, 7, 8, 9]
        elif name == "quina":
            return num_pares in [2, 3]
        return True

    @staticmethod
    def is_sum_ok(
        numbers: List[int],
        lottery_name: str,
        sum_range: Optional[Tuple[float, float]] = None,
    ) -> bool:
        """Filtro de Somas: Restringe os jogos à faixa de soma histórica mais provável."""
        total_sum = sum(numbers)
        if sum_range is not None:
            low, high = sum_range
            return low <= total_sum <= high

        low, high = ProbabilityAlgorithms.compute_dynamic_sum_range(None, lottery_name)
        return low <= total_sum <= high

    @staticmethod
    def is_consecutive_ok(numbers: List[int], lottery_name: str) -> bool:
        """Filtro de Espaçamento: Evita aglomeração limitando sequências consecutivas."""
        name = ProbabilityAlgorithms._normalize_lottery_name(lottery_name)
        sorted_nums = sorted(numbers)

        max_seq = 1
        current_seq = 1

        for i in range(len(sorted_nums) - 1):
            if sorted_nums[i + 1] == sorted_nums[i] + 1:
                current_seq += 1
                if current_seq > max_seq:
                    max_seq = current_seq
            else:
                current_seq = 1

        if name == "megasena":
            return max_seq <= 2
        elif name in ["lotofacil", "lotofácil"]:
            return max_seq <= 4
        elif name == "quina":
            return max_seq <= 2
        return True

    @staticmethod
    def is_quadrant_ok(numbers: List[int], lottery_name: str) -> bool:
        """Filtro de Quadrantes: Evita a concentração física das dezenas no volante."""
        name = ProbabilityAlgorithms._normalize_lottery_name(lottery_name)

        if name == "megasena":
            quadrant_counts = {1: 0, 2: 0, 3: 0, 4: 0}
            for n in numbers:
                row = (n - 1) // 10
                col = (n - 1) % 10 + 1
                if row < 3:
                    quadrant_counts[1 if col <= 5 else 2] += 1
                else:
                    quadrant_counts[3 if col <= 5 else 4] += 1
            return all(count <= 4 for count in quadrant_counts.values())

        elif name in ["lotofacil", "lotofácil"]:
            # Volante Lotofácil: matriz 5x5 (1..25) — verifica distribuição por linhas e colunas
            row_counts = [0] * 5
            col_counts = [0] * 5
            for n in numbers:
                row_counts[(n - 1) // 5] += 1
                col_counts[(n - 1) % 5] += 1
            # Em 15 números, todas as 5 linhas e 5 colunas devem ter ao menos 1 número, e no máx 5
            return all(1 <= c <= 5 for c in row_counts) and all(1 <= c <= 5 for c in col_counts)

        elif name == "quina":
            quadrant_counts = {1: 0, 2: 0, 3: 0, 4: 0}
            for n in numbers:
                row = (n - 1) // 10
                col = (n - 1) % 10 + 1
                if row < 4:
                    quadrant_counts[1 if col <= 5 else 2] += 1
                else:
                    quadrant_counts[3 if col <= 5 else 4] += 1
            return all(count <= 3 for count in quadrant_counts.values())

        return True

    @staticmethod
    def is_primes_ok(numbers: List[int], lottery_name: str) -> bool:
        """Filtro de Primos: Garante equilíbrio realista de dezenas primas."""
        name = ProbabilityAlgorithms._normalize_lottery_name(lottery_name)
        prime_count = sum(1 for n in numbers if n in PRIMES_UP_TO_80)
        if name == "megasena":
            return 0 <= prime_count <= 4
        elif name in ["lotofacil", "lotofácil"]:
            return 3 <= prime_count <= 8
        elif name == "quina":
            return 0 <= prime_count <= 3
        return True

    @staticmethod
    def is_stupid_game(
        numbers: List[int],
        lottery_name: str,
        historical_draws: Optional[List[List[int]]] = None,
        historical_frozensets: Optional[Set[FrozenSet[int]]] = None,
    ) -> bool:
        """Filtro de 'Jogos Estúpidos': Descarta sequências óbvias, repetições de dígitos ou jogos já sorteados."""
        sorted_nums = sorted(numbers)

        # 1. Sequência contínua completa
        if sorted_nums == list(range(sorted_nums[0], sorted_nums[0] + len(sorted_nums))):
            return True

        # 2. Todos terminam com o mesmo dígito
        end_digits = {n % 10 for n in sorted_nums}
        if len(end_digits) == 1:
            return True

        # 3. Jogo já sorteado anteriormente (O(1) via frozenset quando pré-computado)
        current_fs = frozenset(sorted_nums)
        if historical_frozensets is not None:
            if current_fs in historical_frozensets:
                return True
        elif historical_draws:
            for d in historical_draws:
                if frozenset(d) == current_fs:
                    return True

        return False

    @staticmethod
    def validate_game(
        numbers: List[int],
        lottery_name: str,
        historical_draws: Optional[List[List[int]]] = None,
        historical_frozensets: Optional[Set[FrozenSet[int]]] = None,
        sum_range: Optional[Tuple[float, float]] = None,
    ) -> bool:
        """Aplica toda a esteira de filtros para validar se o jogo é estatisticamente viável."""
        if not ProbabilityAlgorithms.is_parity_ok(numbers, lottery_name):
            return False
        if not ProbabilityAlgorithms.is_sum_ok(numbers, lottery_name, sum_range=sum_range):
            return False
        if not ProbabilityAlgorithms.is_consecutive_ok(numbers, lottery_name):
            return False
        if not ProbabilityAlgorithms.is_quadrant_ok(numbers, lottery_name):
            return False
        if not ProbabilityAlgorithms.is_primes_ok(numbers, lottery_name):
            return False
        if ProbabilityAlgorithms.is_stupid_game(
            numbers,
            lottery_name,
            historical_draws=historical_draws,
            historical_frozensets=historical_frozensets,
        ):
            return False
        return True

    # ==========================================
    # SCORING DE CANDIDATOS & GERAÇÃO PREDITIVA
    # ==========================================

    @staticmethod
    def _compute_number_scores(
        numbers_history: List[List[int]],
        total_numbers: int,
        strategy: str,
    ) -> Tuple[Dict[int, float], Dict[Tuple[int, int], float], Dict[int, float]]:
        """
        Calcula o score individual por dezena integrando:
        - Frequência histórica global
        - Atraso (delay) corrigido em ordem cronológica
        - Momentum por janela deslizante (últimos 25 concursos vs histórico)
        Retorna também mapa normalizado de afinidade de pares e distribuição ideal de terminadores.
        """
        flat_history = [n for draw in numbers_history for n in draw]
        freq = ProbabilityAlgorithms.frequency_analysis(flat_history, total_numbers)
        delays = ProbabilityAlgorithms.delay_analysis(numbers_history, total_numbers)
        freq_recent, freq_all = ProbabilityAlgorithms.sliding_window_frequency(
            numbers_history, total_numbers, window_size=25
        )
        raw_pairs = ProbabilityAlgorithms.pair_analysis(numbers_history, total_numbers)
        term_counts = ProbabilityAlgorithms.terminators_analysis(flat_history, total_numbers)

        max_freq = max(freq.values()) or 1.0
        max_delay = max(delays.values()) or 1.0

        # Momentum: diferença entre frequência recente e histórica (normalizada para [0, 1])
        momentum_raw = {n: freq_recent[n] - freq_all[n] for n in range(1, total_numbers + 1)}
        min_mom = min(momentum_raw.values())
        max_mom = max(momentum_raw.values())
        mom_span = (max_mom - min_mom) or 1.0

        scores: Dict[int, float] = {}
        for n in range(1, total_numbers + 1):
            f_norm = freq[n] / max_freq
            d_norm = delays[n] / max_delay
            m_norm = (momentum_raw[n] - min_mom) / mom_span

            if strategy == "frequency":
                scores[n] = 0.75 * f_norm + 0.25 * m_norm
            elif strategy == "delay":
                scores[n] = 0.75 * d_norm + 0.25 * m_norm
            elif strategy == "ml_ensemble":
                # Será substituído pelos scores do MLPredictor abaixo
                scores[n] = 0.45 * f_norm + 0.30 * d_norm + 0.25 * m_norm
            else:  # combined / smart
                scores[n] = 0.45 * f_norm + 0.30 * d_norm + 0.25 * m_norm

        if strategy == "ml_ensemble":
            ml_scores = MLPredictor.predict_number_probabilities(
                numbers_history=numbers_history,
                total_numbers=total_numbers,
            )
            scores = {
                n: 0.75 * ml_scores.get(n, 0.5) + 0.25 * scores[n]
                for n in range(1, total_numbers + 1)
            }

        # Mapa de pares normalizado: (a, b) -> [0, 1]
        max_pair = max(raw_pairs.values()) if raw_pairs else 1
        pair_scores: Dict[Tuple[int, int], float] = {}
        for key, cnt in raw_pairs.items():
            a_str, b_str = key.split("-")
            pair_scores[(int(a_str), int(b_str))] = cnt / max_pair

        # Distribuição relativa de terminadores (0-9)
        total_terms = sum(term_counts.values()) or 1
        term_weights = {d: term_counts.get(d, 0) / total_terms for d in range(10)}

        return scores, pair_scores, term_weights

    @staticmethod
    def _score_candidate_game(
        game: List[int],
        number_scores: Dict[int, float],
        pair_scores: Dict[Tuple[int, int], float],
        term_weights: Dict[int, float],
    ) -> float:
        """Avalia um jogo candidato combinando score individual, afinidade de pares e equilíbrio de terminadores."""
        base_score = sum(number_scores.get(n, 0.0) for n in game) / len(game)

        # Afinidade média entre os pares presentes no jogo
        pair_sum = 0.0
        pair_count = 0
        for i in range(len(game)):
            for j in range(i + 1, len(game)):
                pair_sum += pair_scores.get((game[i], game[j]), 0.0)
                pair_count += 1
        pair_affinity = pair_sum / pair_count if pair_count > 0 else 0.0

        # Bônus de terminadores: favorece dígitos finais bem distribuídos e alinhados ao histórico
        game_terms = [n % 10 for n in game]
        diversity_ratio = len(set(game_terms)) / min(len(game), 10)
        term_hist_score = sum(term_weights.get(d, 0.1) for d in game_terms) / len(game)

        return 0.55 * base_score + 0.25 * pair_affinity + 0.15 * diversity_ratio + 0.05 * term_hist_score

    @staticmethod
    def _weighted_sample_without_replacement(
        population: List[int],
        weights: List[float],
        k: int,
    ) -> List[int]:
        """Amostragem ponderada sem reposição usando chaves exponenciais (Efraimidis-Spirakis)."""
        keyed = []
        for item, w in zip(population, weights):
            safe_w = max(w, 1e-6)
            u = max(random.random(), 1e-9)
            keyed.append((math.log(u) / safe_w, item))
        keyed.sort(reverse=True)
        return sorted(item for _, item in keyed[:k])

    @staticmethod
    def generate_prediction(
        numbers_history: List[List[int]],
        total_numbers: int = 60,
        numbers_to_draw: int = 6,
        strategy: str = "combined",
        lottery_name: str = "megasena",
        num_games: int = 1,
    ) -> List[List[int]]:
        """
        Gera previsões estatísticas integrando frequência, atraso, tendência recente (janela deslizante),
        afinidade de pares, terminadores e faixas dinâmicas de soma, passando pela esteira de validação.
        """
        if not numbers_history:
            games = []
            for idx in range(num_games):
                chosen = None
                for _ in range(500):
                    nums = sorted(random.sample(range(1, total_numbers + 1), numbers_to_draw))
                    if ProbabilityAlgorithms.validate_game(nums, lottery_name):
                        chosen = nums
                        break
                games.append(chosen or sorted(random.sample(range(1, total_numbers + 1), numbers_to_draw)))
            return games

        # Pré-computa frozensets e faixa dinâmica de soma uma única vez (O(N) -> O(1) por validação)
        historical_frozensets = {frozenset(d) for d in numbers_history}
        sum_range = ProbabilityAlgorithms.compute_dynamic_sum_range(numbers_history, lottery_name)

        number_scores, pair_scores, term_weights = ProbabilityAlgorithms._compute_number_scores(
            numbers_history, total_numbers, strategy
        )

        # Pool dinâmico: ~65% das melhores dezenas (ou no mínimo numbers_to_draw + 6)
        pool_size = min(total_numbers, max(numbers_to_draw + 6, int(total_numbers * 0.65)))
        sorted_scores = sorted(number_scores.items(), key=lambda x: x[1], reverse=True)
        best_numbers = [n for n, _ in sorted_scores[:pool_size]]
        best_weights = [max(number_scores[n], 0.05) + 0.15 for n in best_numbers]

        # Gera um conjunto maior de candidatos válidos e ranqueia pelo score composto + diversidade
        candidates_target = max(num_games * 8, 25)
        valid_candidates: Dict[Tuple[int, ...], float] = {}

        attempts = 0
        max_attempts = max(600, candidates_target * 30)
        while len(valid_candidates) < candidates_target and attempts < max_attempts:
            nums = ProbabilityAlgorithms._weighted_sample_without_replacement(
                best_numbers, best_weights, numbers_to_draw
            )
            key = tuple(nums)
            if key not in valid_candidates and ProbabilityAlgorithms.validate_game(
                nums,
                lottery_name,
                historical_frozensets=historical_frozensets,
                sum_range=sum_range,
            ):
                valid_candidates[key] = ProbabilityAlgorithms._score_candidate_game(
                    nums, number_scores, pair_scores, term_weights
                )
            attempts += 1

        # Fallback: abre para todo o universo se o pool restrito não produziu candidatos suficientes
        if len(valid_candidates) < num_games:
            all_nums = list(range(1, total_numbers + 1))
            all_weights = [max(number_scores[n], 0.05) + 0.15 for n in all_nums]
            fallback_attempts = 0
            while len(valid_candidates) < num_games and fallback_attempts < 500:
                nums = ProbabilityAlgorithms._weighted_sample_without_replacement(
                    all_nums, all_weights, numbers_to_draw
                )
                key = tuple(nums)
                if key not in valid_candidates and ProbabilityAlgorithms.validate_game(
                    nums,
                    lottery_name,
                    historical_frozensets=historical_frozensets,
                    sum_range=sum_range,
                ):
                    valid_candidates[key] = ProbabilityAlgorithms._score_candidate_game(
                        nums, number_scores, pair_scores, term_weights
                    )
                fallback_attempts += 1

        # Seleção gulosa com penalidade leve por sobreposição para garantir diversidade entre jogos
        ranked = sorted(valid_candidates.items(), key=lambda x: x[1], reverse=True)
        selected_games: List[List[int]] = []
        selected_sets: List[Set[int]] = []

        while ranked and len(selected_games) < num_games:
            best_idx = 0
            best_adjusted = -float("inf")
            for idx, (cand_tuple, raw_score) in enumerate(ranked):
                cand_set = set(cand_tuple)
                if selected_sets:
                    max_overlap = max(len(cand_set.intersection(s)) for s in selected_sets) / numbers_to_draw
                else:
                    max_overlap = 0.0
                adjusted_score = raw_score - 0.20 * max_overlap
                if adjusted_score > best_adjusted:
                    best_adjusted = adjusted_score
                    best_idx = idx

            chosen_tuple, _ = ranked.pop(best_idx)
            selected_games.append(list(chosen_tuple))
            selected_sets.append(set(chosen_tuple))

        # Segurança final caso ainda falte algum jogo
        while len(selected_games) < num_games:
            selected_games.append(sorted(random.sample(range(1, total_numbers + 1), numbers_to_draw)))

        return selected_games
