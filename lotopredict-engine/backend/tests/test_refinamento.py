import math
import os
import random
import sys
import unittest
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from app.api.api import app
from app.services.closing_engine import ClosingEngine
from app.services.odds import (
    combinatorial_odds,
    cumulative_hit_probability,
    hit_probability,
    total_combinations,
)
from app.services.probability import ProbabilityAlgorithms

client = TestClient(app)


class TestOdds(unittest.TestCase):
    def test_total_combinations(self):
        self.assertEqual(total_combinations(60, 6), 50_063_860)
        self.assertEqual(total_combinations(25, 15), 3_268_760)
        self.assertEqual(total_combinations(80, 5), 24_040_016)

    def test_hypergeometric_distribution_sums_to_one(self):
        for total, draw in [(60, 6), (25, 15), (80, 5)]:
            soma = sum(hit_probability(total, draw, hits) for hits in range(draw + 1))
            self.assertAlmostEqual(soma, 1.0, places=10)

    def test_cumulative_megasena(self):
        self.assertAlmostEqual(cumulative_hit_probability(60, 6, 4), 1 / 2297.5612666360717, places=12)
        self.assertAlmostEqual(cumulative_hit_probability(60, 6, 5), 1 / 154042.64615384614, places=10)

    def test_odds_endpoint(self):
        response = client.get("/api/v1/lottery/megasena/odds?num_games=5")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_combinations"], 50_063_860)
        self.assertEqual(data["all_hits"]["denominator_per_game"], 50_063_860)
        self.assertEqual(data["all_hits"]["games"], 5)
        self.assertEqual(data["all_hits"]["denominator_with_games"], 10_012_772)


class TestUniformGeneration(unittest.TestCase):
    def test_uniform_is_reproducible_and_distinct(self):
        args = dict(total_numbers=60, numbers_to_draw=6, num_games=25, seed=42)
        a = ProbabilityAlgorithms.generate_uniform_games(**args)
        b = ProbabilityAlgorithms.generate_uniform_games(**args)
        self.assertEqual(a, b)
        self.assertEqual(len({tuple(g) for g in a}), 25)
        self.assertTrue(all(len(g) == 6 and g == sorted(set(g)) for g in a))
        self.assertTrue(all(1 <= n <= 60 for g in a for n in g))

    def test_uniform_marginal_compatible_with_chi_square(self):
        games = ProbabilityAlgorithms.generate_uniform_games(60, 6, 3000, seed=2026)
        counts = Counter(n for game in games for n in game)
        expected = len(games) * 6 / 60
        chi2 = sum((counts.get(n, 0) - expected) ** 2 / expected for n in range(1, 61))
        self.assertLess(chi2, 100.0)  # crítico χ²(0,05; 59) ≈ 77,93

    def test_predict_endpoint_defaults_to_uniform_and_exposes_odds(self):
        response = client.get("/api/v1/lottery/megasena/predict?num_games=3&seed=7")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["strategy_used"], "uniform")
        self.assertEqual(data["mode"], "uniform")
        self.assertEqual(data["distinct_games"], 3)
        self.assertEqual(data["odds"]["denominator_per_game"], 50_063_860)

    def test_unknown_strategy_is_rejected(self):
        response = client.get("/api/v1/lottery/megasena/predict?strategy=quantum-ia")
        self.assertEqual(response.status_code, 400)


class TestFechamentoRefinado(unittest.TestCase):
    def test_lotofacil_accent_is_normalized(self):
        response = client.post(
            "/api/v1/fechamento",
            json={
                "lottery_name": "Lotofácil",
                "selected_numbers": list(range(1, 16)),
                "guarantee": 14,
                "condition_hits": 15,
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["lottery"], "Lotofácil")

    def test_heavy_fechamento_uses_heuristic(self):
        response = client.post(
            "/api/v1/fechamento",
            json={
                "lottery_name": "Lotofácil",
                "selected_numbers": list(range(1, 21)),
                "guarantee": 11,
                "condition_hits": 15,
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertGreater(len(data["games"]), 0)
        coverage = client.post(
            "/api/v1/fechamento/coverage",
            json={
                "lottery_name": "Lotofácil",
                "selected_numbers": list(range(1, 21)),
                "guarantee": 11,
                "condition_hits": 15,
                "games": data["games"],
            },
        ).json()
        self.assertEqual(coverage["coverage_pct"], 100.0)

    def test_invalid_guarantee_is_rejected(self):
        response = client.post(
            "/api/v1/fechamento",
            json={
                "lottery_name": "Lotofácil",
                "selected_numbers": list(range(1, 16)),
                "guarantee": 14,
                "condition_hits": 2,
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_coverage_drops_when_games_are_removed(self):
        params = dict(
            selected_numbers=list(range(1, 13)),
            game_size=6,
            guarantee=5,
            condition_hits=6,
        )
        full = ClosingEngine.generate_desdobramento(**params)
        coverage_full = ClosingEngine.compute_coverage(**params, games=full)
        coverage_empty = ClosingEngine.compute_coverage(**params, games=[])
        self.assertEqual(coverage_full["coverage_pct"], 100.0)
        self.assertEqual(coverage_empty["coverage_pct"], 0.0)


class TestCalibracaoEDiversidade(unittest.TestCase):
    def test_wilson_interval(self):
        from app.services.calibration import wilson_interval
        low, high = wilson_interval(5, 100)
        self.assertLess(low, 0.05)
        self.assertGreater(high, 0.05)

    def test_observed_vs_expected_uniform(self):
        from app.services.calibration import observed_vs_expected
        result = observed_vs_expected({"0": 0, "1": 0, "2": 100}, 60, 6, 100)
        # 100 jogos com 2 acertos é extremamente improvável: chi² deve ser alto
        self.assertGreater(result["chi_square"], 100)

    def test_paired_statistics(self):
        from app.services.calibration import paired_bootstrap_ci, sign_flip_p_value
        zeros = [0.0] * 20
        low, high = paired_bootstrap_ci(zeros, n_boot=500, seed=1)
        self.assertLessEqual(low, 0)
        self.assertGreaterEqual(high, 0)
        self.assertGreater(sign_flip_p_value(zeros, n_perm=500, seed=1), 0.1)
        positive = [1.0] * 20
        low, high = paired_bootstrap_ci(positive, n_boot=500, seed=1)
        self.assertGreater(low, 0)
        self.assertLess(sign_flip_p_value(positive, n_perm=500, seed=1), 0.05)

    def test_diverse_games_limit_overlap(self):
        from app.services.diversity import select_diverse_games
        candidates = [
            [1, 2, 3, 4, 5, 6],
            [1, 2, 3, 4, 7, 8],
            [10, 11, 12, 13, 14, 15],
        ]
        chosen = select_diverse_games(candidates, 3, max_overlap=1)
        self.assertEqual(len(chosen), 2)  # terceiro exige 2 de sobreposição com o primeiro
        self.assertEqual(len({tuple(g) for g in chosen}), 2)

    def test_predict_diversify_flag(self):
        response = client.get("/api/v1/lottery/megasena/predict?num_games=3&diversify=true&seed=9")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["diversified"])
        self.assertEqual(data["distinct_games"], 3)

    def test_backtest_comparison(self):
        response = client.post(
            "/api/v1/lottery/megasena/backtest?num_draws=20&num_games_per_draw=3&compare=true&seed=5"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsNotNone(data["comparison"])
        self.assertEqual(data["comparison"]["baseline"], "uniform")
        self.assertIn("p_value", data["comparison"])

    def test_cors_rejects_random_vercel_origin(self):
        response = client.get(
            "/api/v1/lottery/megasena/odds",
            headers={"Origin": "https://qualquer-coisa.vercel.app"},
        )
        self.assertNotEqual(response.headers.get("access-control-allow-origin"), "https://qualquer-coisa.vercel.app")

    def test_rate_limit_on_expensive_route(self):
        # Cliente com IP dedicado para não afetar os demais testes
        limited_client = TestClient(app, client=("10.99.99.99", 1234))
        statuses = []
        for _ in range(13):
            response = limited_client.post(
                "/api/v1/fechamento",
                json={"lottery_name": "Mega-Sena", "selected_numbers": [], "guarantee": 5, "condition_hits": 6},
            )
            statuses.append(response.status_code)
        self.assertIn(429, statuses)


if __name__ == "__main__":
    unittest.main()
