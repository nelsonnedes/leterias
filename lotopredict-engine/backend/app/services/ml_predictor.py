import math
from typing import Dict, List, Tuple

import numpy as np


class MLPredictor:
    """
    Motor de Machine Learning leve em NumPy puro (zero dependências pesadas).
    Extrai 8 features por dezena ao longo da janela histórica e treina um
    Ensemble (Regressão Logística L2 + Ridge Regressor) para estimar a
    probabilidade de cada dezena no próximo sorteio.
    """

    @staticmethod
    def extract_step_features(
        history_window: List[List[int]],
        total_numbers: int,
    ) -> np.ndarray:
        """
        Extrai matriz (total_numbers, 8) de features para o estado atual do histórico:
          0: frequência global normalizada
          1: frequência recente (últimos 25 sorteios) normalizada
          2: momentum (recente - global)
          3: atraso atual normalizado
          4: z-score do atraso em relação ao intervalo médio de retorno da dezena
          5: progresso no ciclo de retorno (1.0 se ainda não saiu no ciclo atual, 0.0 se já saiu)
          6: probabilidade de transição de Markov a partir do último sorteio
          7: afinidade média (coocorrência) com as dezenas do último sorteio
        """
        n_draws = len(history_window)
        if n_draws == 0:
            return np.zeros((total_numbers, 8), dtype=np.float64)

        counts_all = np.zeros(total_numbers, dtype=np.float64)
        counts_recent = np.zeros(total_numbers, dtype=np.float64)
        last_seen = np.full(total_numbers, -1, dtype=np.int64)

        # Para intervalo médio de retorno e matriz de coocorrência/transição
        return_gaps_sum = np.zeros(total_numbers, dtype=np.float64)
        return_gaps_cnt = np.zeros(total_numbers, dtype=np.float64)
        cooccur = np.zeros((total_numbers, total_numbers), dtype=np.float64)
        markov = np.zeros((total_numbers, total_numbers), dtype=np.float64)

        recent_start = max(0, n_draws - 25)
        prev_draw: List[int] = []

        # Controle de ciclo: reseta quando todas as dezenas saem ao menos uma vez
        cycle_seen = set()

        for idx, draw in enumerate(history_window):
            valid_draw = [n - 1 for n in draw if 1 <= n <= total_numbers]
            for num_idx in valid_draw:
                counts_all[num_idx] += 1.0
                if idx >= recent_start:
                    counts_recent[num_idx] += 1.0
                if last_seen[num_idx] >= 0:
                    return_gaps_sum[num_idx] += (idx - last_seen[num_idx])
                    return_gaps_cnt[num_idx] += 1.0
                last_seen[num_idx] = idx

                cycle_seen.add(num_idx)

            if len(cycle_seen) >= total_numbers:
                cycle_seen.clear()

            # Coocorrência no mesmo concurso
            for i in range(len(valid_draw)):
                a = valid_draw[i]
                for j in range(i + 1, len(valid_draw)):
                    b = valid_draw[j]
                    cooccur[a, b] += 1.0
                    cooccur[b, a] += 1.0

            # Transição de Markov: prev_draw -> valid_draw
            if prev_draw:
                for p in prev_draw:
                    for c in valid_draw:
                        markov[p, c] += 1.0
            prev_draw = valid_draw

        # 0: frequência global
        max_all = counts_all.max() or 1.0
        f_global = counts_all / max_all

        # 1: frequência recente
        max_rec = counts_recent.max() or 1.0
        f_recent = counts_recent / max_rec

        # 2: momentum normalizado para [0, 1]
        total_all_sum = counts_all.sum() or 1.0
        total_rec_sum = counts_recent.sum() or 1.0
        mom_raw = (counts_recent / total_rec_sum) - (counts_all / total_all_sum)
        mom_span = (mom_raw.max() - mom_raw.min()) or 1.0
        f_momentum = (mom_raw - mom_raw.min()) / mom_span

        # 3: atraso atual
        delays = np.where(last_seen >= 0, (n_draws - 1) - last_seen, n_draws).astype(np.float64)
        max_delay = delays.max() or 1.0
        f_delay = delays / max_delay

        # 4: razão atraso atual / atraso médio histórico da dezena
        avg_gap = np.divide(
            return_gaps_sum,
            return_gaps_cnt,
            out=np.full(total_numbers, max_delay / 2.0, dtype=np.float64),
            where=return_gaps_cnt > 0,
        )
        avg_gap = np.maximum(avg_gap, 1.0)
        delay_ratio = np.clip(delays / avg_gap, 0.0, 3.0) / 3.0

        # 5: faltante no ciclo atual (1.0 se ainda não saiu no ciclo aberto)
        f_cycle = np.array([0.0 if i in cycle_seen else 1.0 for i in range(total_numbers)], dtype=np.float64)

        # 6 & 7: Markov e Coocorrência a partir do último sorteio
        last_draw_idx = [n - 1 for n in history_window[-1] if 1 <= n <= total_numbers]
        if last_draw_idx:
            m_vec = markov[last_draw_idx, :].mean(axis=0)
            c_vec = cooccur[last_draw_idx, :].mean(axis=0)
        else:
            m_vec = np.zeros(total_numbers, dtype=np.float64)
            c_vec = np.zeros(total_numbers, dtype=np.float64)

        f_markov = m_vec / (m_vec.max() or 1.0)
        f_cooccur = c_vec / (c_vec.max() or 1.0)

        return np.column_stack([
            f_global,
            f_recent,
            f_momentum,
            f_delay,
            delay_ratio,
            f_cycle,
            f_markov,
            f_cooccur,
        ])

    @staticmethod
    def _fit_logistic_l2(
        X: np.ndarray,
        y: np.ndarray,
        lr: float = 0.15,
        reg: float = 0.01,
        epochs: int = 80,
    ) -> Tuple[np.ndarray, float]:
        """Treina Regressão Logística com regularização L2 via gradiente descendente em NumPy."""
        n_samples, n_features = X.shape
        w = np.zeros(n_features, dtype=np.float64)
        b = 0.0

        for _ in range(epochs):
            z = np.clip(X @ w + b, -20.0, 20.0)
            preds = 1.0 / (1.0 + np.exp(-z))
            err = preds - y
            grad_w = (X.T @ err) / n_samples + reg * w
            grad_b = float(np.mean(err))
            w -= lr * grad_w
            b -= lr * grad_b

        return w, b

    @staticmethod
    def _fit_ridge(X: np.ndarray, y: np.ndarray, alpha: float = 1.0) -> Tuple[np.ndarray, float]:
        """Treina Ridge Regression em forma fechada (solução exata) com intercepto."""
        n_samples, n_features = X.shape
        X_mean = X.mean(axis=0)
        y_mean = float(y.mean())
        Xc = X - X_mean
        yc = y - y_mean
        gram = Xc.T @ Xc + alpha * np.eye(n_features)
        w = np.linalg.solve(gram, Xc.T @ yc)
        b = y_mean - float(X_mean @ w)
        return w, b

    @staticmethod
    def predict_number_probabilities(
        numbers_history: List[List[int]],
        total_numbers: int,
        train_window: int = 60,
    ) -> Dict[int, float]:
        """
        Treina o Ensemble (Regressão Logística L2 + Ridge) nas últimas `train_window`
        transições históricas e retorna o score preditivo normalizado [0, 1] por dezena.
        """
        n_draws = len(numbers_history)
        if n_draws < 30:
            # Histórico pequeno: usa média das 8 features sem ajuste supervisionado
            feats = MLPredictor.extract_step_features(numbers_history, total_numbers)
            raw = feats.mean(axis=1)
            span = (raw.max() - raw.min()) or 1.0
            norm = (raw - raw.min()) / span
            return {i + 1: float(norm[i]) for i in range(total_numbers)}

        # Constrói dataset supervisionado walk-forward usando os últimos `train_window` concursos
        # Limita o lookback de cada passo a 250 sorteios para manter latência < 100ms
        start_step = max(25, n_draws - train_window)
        step_stride = 3 if (n_draws - start_step) > 30 else 1

        X_rows = []
        y_rows = []
        for t in range(start_step, n_draws, step_stride):
            lookback_start = max(0, t - 250)
            feats_t = MLPredictor.extract_step_features(numbers_history[lookback_start:t], total_numbers)
            target_set = set(numbers_history[t])
            y_t = np.array([1.0 if (i + 1) in target_set else 0.0 for i in range(total_numbers)], dtype=np.float64)
            X_rows.append(feats_t)
            y_rows.append(y_t)

        X_train = np.vstack(X_rows)
        y_train = np.concatenate(y_rows)

        # Padronização z-score
        mean = X_train.mean(axis=0)
        std = X_train.std(axis=0)
        std = np.where(std < 1e-6, 1.0, std)
        X_norm = (X_train - mean) / std

        w_log, b_log = MLPredictor._fit_logistic_l2(X_norm, y_train)
        w_rid, b_rid = MLPredictor._fit_ridge(X_norm, y_train, alpha=5.0)

        # Inferência para o próximo concurso usando janela recente de até 300 sorteios
        feats_now = MLPredictor.extract_step_features(numbers_history[-300:], total_numbers)
        X_now = (feats_now - mean) / std

        z_log = np.clip(X_now @ w_log + b_log, -20.0, 20.0)
        p_log = 1.0 / (1.0 + np.exp(-z_log))
        p_rid = X_now @ w_rid + b_rid

        # Ensemble: 45% Logística + 35% Ridge + 20% heurística das 8 features
        p_heur = feats_now.mean(axis=1)
        combined = 0.45 * p_log + 0.35 * p_rid + 0.20 * p_heur

        span = (combined.max() - combined.min()) or 1.0
        scores = (combined - combined.min()) / span
        return {i + 1: float(scores[i]) for i in range(total_numbers)}
