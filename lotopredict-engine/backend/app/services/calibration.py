"""Ferramentas estatísticas puras para validação honesta do gerador.

Nenhuma função aqui cria sinal previsível: elas medem desvio de distribuições,
intervalos de confiança e significância de diferenças pareadas.
"""

import math
import random
from typing import Any, Dict, List, Sequence, Tuple

from app.services.odds import hit_probability


def wilson_interval(successes: int, trials: int, z: float = 1.96) -> Tuple[float, float]:
    """Intervalo de Wilson para uma proporção (robusto para p pequeno)."""
    if trials <= 0:
        return (0.0, 0.0)
    p = successes / trials
    denom = 1 + z * z / trials
    center = (p + z * z / (2 * trials)) / denom
    half = z * math.sqrt(p * (1 - p) / trials + z * z / (4 * trials * trials)) / denom
    return (max(0.0, center - half), min(1.0, center + half))


def observed_vs_expected(
    hits_distribution: Dict[str, int],
    total_numbers: int,
    draw_size: int,
    num_games_simulated: int,
    confidence: float = 0.95,
) -> Dict[str, Any]:
    """Compara a distribuição observada com a hipergeométrica teórica."""
    if num_games_simulated <= 0:
        return {"rows": [], "chi_square": 0.0, "kl_divergence": 0.0}

    z = 1.96 if confidence == 0.95 else 2.576 if confidence == 0.99 else 1.645
    rows = []
    chi_square = 0.0
    kl = 0.0

    for hits in range(draw_size + 1):
        observed = int(hits_distribution.get(str(hits), hits_distribution.get(hits, 0)))
        probability = hit_probability(total_numbers, draw_size, hits)
        expected = probability * num_games_simulated
        if expected > 0:
            chi_square += (observed - expected) ** 2 / expected
            p_obs = observed / num_games_simulated
            if p_obs > 0:
                kl += p_obs * math.log(p_obs / probability)
        low, high = wilson_interval(observed, num_games_simulated, z=z)
        rows.append({
            "hits": hits,
            "observed": observed,
            "expected": round(expected, 2),
            "observed_rate": observed / num_games_simulated,
            "expected_rate": probability,
            "ci_low": round(low, 5),
            "ci_high": round(high, 5),
        })

    return {
        "rows": rows,
        "chi_square": round(chi_square, 3),
        "kl_divergence": round(kl, 6),
        "note": "Desvios dentro do esperado pelo acaso não indicam habilidade preditiva.",
    }


def paired_bootstrap_ci(
    differences: Sequence[float],
    n_boot: int = 10000,
    alpha: float = 0.05,
    seed: int = 0,
) -> Tuple[float, float]:
    """IC bootstrap percentil para a média de diferenças pareadas."""
    values = [float(x) for x in differences]
    if not values:
        return (0.0, 0.0)
    rng = random.Random(seed)
    n = len(values)
    means = []
    for _ in range(n_boot):
        sample = [values[rng.randrange(n)] for _ in range(n)]
        means.append(sum(sample) / n)
    means.sort()
    lo_idx = int(alpha / 2 * n_boot)
    hi_idx = min(n_boot - 1, int((1 - alpha / 2) * n_boot))
    return (means[lo_idx], means[hi_idx])


def sign_flip_p_value(
    differences: Sequence[float],
    n_perm: int = 10000,
    seed: int = 0,
) -> float:
    """Teste de permutação por sinal (two-sided) para média pareada."""
    values = [float(x) for x in differences]
    if not values:
        return 1.0
    observed_mean = sum(values) / len(values)
    rng = random.Random(seed)
    extreme = 0
    for _ in range(n_perm):
        perm_mean = sum(v if rng.getrandbits(1) else -v for v in values) / len(values)
        if abs(perm_mean) >= abs(observed_mean) - 1e-12:
            extreme += 1
    return (extreme + 1) / (n_perm + 1)
