import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.api import app
from app.core.constants import get_display_name_by_db_name, get_lottery_spec
from app.database.models import LotteryResult
from app.database.session import SessionLocal
from app.services.closing_engine import ClosingEngine
from app.services.probability import ProbabilityAlgorithms


class TestLotoPredictEngine(unittest.TestCase):
    def test_constants_lookup(self):
        self.assertEqual(get_lottery_spec("mega-sena")["db_name"], "Megasena")
        self.assertEqual(get_lottery_spec("lotofácil")["total_numbers"], 25)
        self.assertEqual(get_lottery_spec("quina")["numbers_to_draw"], 5)
        self.assertEqual(get_display_name_by_db_name("Lotofacil"), "Lotofácil")

    def test_delay_analysis_chronological_order(self):
        history = [
            [1, 2, 3, 4, 5, 6],
            [7, 8, 9, 10, 11, 12],
            [1, 13, 14, 15, 16, 17],
        ]
        delays = ProbabilityAlgorithms.delay_analysis(history, total_numbers=20)
        self.assertEqual(delays[1], 0)
        self.assertEqual(delays[7], 1)
        self.assertEqual(delays[2], 2)
        self.assertEqual(delays[20], 3)

    def test_dynamic_sum_range_and_filters(self):
        history = [[10, 20, 30, 40, 45, 50] for _ in range(35)]
        low, high = ProbabilityAlgorithms.compute_dynamic_sum_range(history, "megasena")
        self.assertLess(low, high)

        self.assertTrue(ProbabilityAlgorithms.validate_game([4, 15, 23, 34, 42, 55], "megasena"))
        self.assertFalse(ProbabilityAlgorithms.validate_game([1, 2, 3, 4, 5, 6], "megasena"))
        self.assertFalse(ProbabilityAlgorithms.validate_game([2, 12, 22, 32, 42, 52], "megasena"))

    def test_lotofacil_quadrant_5x5_filter(self):
        balanced = [1, 2, 3, 6, 7, 10, 11, 13, 14, 17, 19, 20, 22, 24, 25]
        self.assertTrue(ProbabilityAlgorithms.is_quadrant_ok(balanced, "lotofacil"))
        concentrated = list(range(1, 16))
        self.assertFalse(ProbabilityAlgorithms.is_quadrant_ok(concentrated, "lotofacil"))

    def test_generate_prediction_with_history(self):
        history = [
            [3, 12, 25, 33, 44, 58],
            [5, 14, 22, 38, 49, 55],
            [2, 11, 27, 35, 41, 60],
            [7, 19, 24, 31, 46, 52],
        ]
        games = ProbabilityAlgorithms.generate_prediction(
            numbers_history=history,
            total_numbers=60,
            numbers_to_draw=6,
            strategy="combined",
            lottery_name="megasena",
            num_games=3,
        )
        self.assertEqual(len(games), 3)
        for g in games:
            self.assertEqual(len(g), 6)
            self.assertEqual(g, sorted(set(g)))

    def test_ml_ensemble_strategy(self):
        clean_history = [
            sorted([((i * 3 + j * 7) % 60) + 1 for j in range(6)])
            for i in range(40)
        ]
        clean_history = [d for d in clean_history if len(set(d)) == 6]
        games = ProbabilityAlgorithms.generate_prediction(
            numbers_history=clean_history,
            total_numbers=60,
            numbers_to_draw=6,
            strategy="ml_ensemble",
            lottery_name="megasena",
            num_games=2,
        )
        self.assertEqual(len(games), 2)
        for g in games:
            self.assertEqual(len(g), 6)
            self.assertEqual(g, sorted(set(g)))

    def test_closing_engine_and_db_integration(self):
        routes = {getattr(r, "path", None) for r in app.routes}
        self.assertIn("/health", routes)

        db = SessionLocal()
        try:
            rows = (
                db.query(LotteryResult)
                .filter(LotteryResult.lottery_name == "Megasena")
                .order_by(LotteryResult.draw_date.asc())
                .all()
            )
            self.assertGreater(len(rows), 100)
            history = [r.numbers for r in rows if r.numbers]
            games = ProbabilityAlgorithms.generate_prediction(
                numbers_history=history,
                total_numbers=60,
                numbers_to_draw=6,
                strategy="ml_ensemble",
                lottery_name="Megasena",
                num_games=3,
            )
            self.assertEqual(len(games), 3)
        finally:
            db.close()

        closed = ClosingEngine.generate_desdobramento(
            selected_numbers=[1, 2, 3, 4, 5, 6, 7, 8],
            game_size=6,
            guarantee=4,
            condition_hits=6,
        )
        self.assertGreater(len(closed), 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
