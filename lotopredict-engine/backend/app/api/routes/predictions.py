import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Tuple
from pydantic import BaseModel, Field
from app.database.models import LotteryResult
from app.database.session import get_db
from app.core.constants import get_lottery_spec, normalize_lottery_key
from app.services.probability import ProbabilityAlgorithms
from app.services.closing_engine import ClosingEngine
from app.services.odds import combinatorial_odds, hit_probability
from app.services.calibration import observed_vs_expected, paired_bootstrap_ci, sign_flip_p_value
from app.services.diversity import pair_coverage, select_diverse_games

router = APIRouter()

VALID_STRATEGIES = {"uniform", "combined", "frequency", "delay", "ml_ensemble"}


def _validate_strategy(strategy: str) -> str:
    """Rejeita estratégias desconhecidas em vez de cair silenciosamente em `combined`."""
    key = normalize_lottery_key(strategy) or strategy.lower()
    if key not in VALID_STRATEGIES:
        raise HTTPException(
            status_code=400,
            detail=f"Estratégia inválida: {strategy}. Use uma de: {', '.join(sorted(VALID_STRATEGIES))}.",
        )
    return key


@router.get("/lottery/{lottery_name}/odds", response_model=Dict[str, Any])
async def get_odds(lottery_name: str, num_games: int = Query(default=1, ge=1, le=500)):
    """Odds combinatórias exatas da modalidade (fonte única de probabilidade do sistema)."""
    return combinatorial_odds(normalize_lottery_key(lottery_name) or lottery_name, num_games)


@router.get("/lottery/{lottery_name}/predict", response_model=Dict[str, Any])
@router.post("/lottery/{lottery_name}/predict", response_model=Dict[str, Any])
async def get_predictions(
    lottery_name: str,
    num_games: int = Query(default=5, ge=1, le=50, description="Quantidade de jogos a serem gerados"),
    strategy: str = Query(default="uniform", description="uniform (padrão, sem viés) ou modo ilustrativo: combined, frequency, delay, ml_ensemble"),
    seed: int | None = Query(default=None, description="Seed para reproduzibilidade"),
    diversify: bool = Query(default=False, description="Reduz a sobreposição entre jogos (não altera a chance combinatória)"),
    db: Session = Depends(get_db)
):
    """
    Gera previsões de jogos baseando-se no histórico de sorteios e aplicando os filtros matemáticos.
    """
    strategy = _validate_strategy(strategy)
    spec = get_lottery_spec(lottery_name)
    db_name = spec["db_name"]
    display_name = spec["display_name"]

    # Busca histórico do banco usando db_name
    results = (
        db.query(LotteryResult)
        .filter(LotteryResult.lottery_name == db_name)
        .order_by(LotteryResult.draw_date.desc())
        .all()
    )

    # Sanitiza o histórico: dezenas distintas, inteiras e dentro do universo da loteria
    universe = set(range(1, spec["total_numbers"] + 1))
    numbers_history = []
    for result in results:
        if not result.numbers:
            continue
        draw = sorted({int(n) for n in result.numbers if isinstance(n, int) and n in universe})
        if len(draw) == spec["numbers_to_draw"]:
            numbers_history.append(draw)

    # Inverte para ter do mais antigo ao mais recente para o gerador
    numbers_history.reverse()

    predicted_games = ProbabilityAlgorithms.generate_prediction(
        numbers_history=numbers_history,
        total_numbers=spec["total_numbers"],
        numbers_to_draw=spec["numbers_to_draw"],
        strategy=strategy,
        lottery_name=db_name,
        num_games=num_games,
        seed=seed,
    )

    if diversify:
        predicted_games = select_diverse_games(predicted_games, num_games)

    odds = combinatorial_odds(normalize_lottery_key(lottery_name) or lottery_name, num_games)
    distinct_pairs, pair_ratio = pair_coverage(predicted_games)
    return {
        "lottery": display_name,
        "strategy_used": strategy,
        "mode": "uniform" if strategy == "uniform" else "illustrative",
        "seed": seed,
        "total_historical_draws_analyzed": len(numbers_history),
        "games": predicted_games,
        "distinct_games": len({tuple(game) for game in predicted_games}),
        "diversified": diversify,
        "distinct_pairs": distinct_pairs,
        "pair_coverage_ratio": round(pair_ratio, 4),
        "odds": odds["all_hits"],
        "notice": odds["notice"] + " Diversidade evita redundância; não altera essa probabilidade.",
    }

@router.post("/lottery/{lottery_name}/backtest", response_model=Dict[str, Any])
async def run_backtest(
    lottery_name: str,
    num_draws: int = Query(default=100, ge=5, le=500, description="Quantidade de concursos históricos para o teste"),
    num_games_per_draw: int = Query(default=5, ge=1, le=50, description="Quantidade de jogos simulados por concurso"),
    strategy: str = Query(default="uniform", description="uniform (padrão) ou modo ilustrativo: combined, frequency, delay, ml_ensemble"),
    from_start: bool = Query(default=False, description="Simular desde o concurso mais antigo do banco"),
    seed: int | None = Query(default=None, description="Seed para reproduzibilidade"),
    compare: bool = Query(default=False, description="Compara o braço escolhido com o gerador uniforme pareado"),
    db: Session = Depends(get_db)
):
    """
    Simulação histórica com comparação contra a expectativa hipergeométrica.

    Não há "meta de acertos": gerar jogos até acertar é viés de seleção e não
    constitui evidência de capacidade preditiva.
    """
    strategy = _validate_strategy(strategy)
    spec = get_lottery_spec(lottery_name)
    db_name = spec["db_name"]
    display_name = spec["display_name"]
    
    # Busca sorteios do banco de dados (do mais antigo ao mais recente) usando db_name
    draws = (
        db.query(LotteryResult)
        .filter(LotteryResult.lottery_name == db_name)
        .order_by(LotteryResult.draw_date.asc())
        .all()
    )
    
    total_db_draws = len(draws)
    if total_db_draws < 20:
        raise HTTPException(
            status_code=400,
            detail=f"Histórico insuficiente no banco de dados para rodar o backtest (necessário pelo menos 20 sorteios, atual: {total_db_draws})."
        )
        
    # Ajusta o número de sorteios de teste com base na quantidade real disponível
    # Deixamos no mínimo 15 sorteios iniciais como "base de treinamento" para o motor preditivo
    max_testable = total_db_draws - 15
    test_draws_count = min(num_draws, max_testable)
    
    # Sorteios separados para o loop de backtest (sem "busca até acertar")
    start_test_idx = 15 if from_start else total_db_draws - test_draws_count
    test_draws_count = min(test_draws_count, total_db_draws - start_test_idx)

    hits_distribution: Dict[int, int] = {}
    total_games_simulated = 0
    results_detail = []
    hits_by_draw = []
    all_games_with_hits: List[Tuple[List[int], int, int, List[int]]] = []

    # Loop de simulação
    for i in range(start_test_idx, start_test_idx + test_draws_count):
        # 1. Histórico de "treino" (sorteios anteriores ao sorteio de teste i)
        history = [d.numbers for d in draws[0:i]]
        
        # 2. Concurso real de teste
        real_draw = draws[i]
        real_numbers_set = set(real_draw.numbers)
        
        # 3. Gerar previsões com base no histórico passado
        predicted_games = ProbabilityAlgorithms.generate_prediction(
            numbers_history=history,
            total_numbers=spec["total_numbers"],
            numbers_to_draw=spec["numbers_to_draw"],
            strategy=strategy,
            lottery_name=db_name,
            num_games=num_games_per_draw,
            seed=(seed + i) if seed is not None else None,
        )
        
        ref = real_draw.source_reference or f"Concurso em {real_draw.draw_date.strftime('%d/%m/%Y')}"
        concurso_match = re.search(r"\d+", ref)
        concurso_num = int(concurso_match.group()) if concurso_match else 0

        draw_hits = []
        for game in predicted_games:
            game_set = set(game)
            hits = len(game_set.intersection(real_numbers_set))
            draw_hits.append(hits)
            
            # Atualiza distribuição de acertos
            hits_distribution[hits] = hits_distribution.get(hits, 0) + 1
            total_games_simulated += 1
            all_games_with_hits.append((list(game), hits, concurso_num, sorted(game_set & real_numbers_set)))

        # Resumo compacto com apenas a quantidade de acertos por concurso
        hits_by_draw.append({
            "concurso": concurso_num,
            "reference": ref,
            "max_hits": max(draw_hits) if draw_hits else 0,
        })

        # Armazena detalhes do concurso simulado
        results_detail.append({
            "reference": ref,
            "real_numbers": real_draw.numbers,
            "max_hits_achieved": max(draw_hits) if draw_hits else 0,
            "games_simulated": [
                {"game": g, "hits": h}
                for g, h in zip(predicted_games, draw_hits)
            ]
        })
        
    # Comparação pareada contra o braço uniforme (mesma seed por concurso)
    comparison = None
    if compare:
        uniform_max_by_draw: List[int] = []
        for offset, i in enumerate(range(start_test_idx, start_test_idx + test_draws_count)):
            history = [d.numbers for d in draws[0:i]]
            real_set = set(draws[i].numbers)
            baseline = ProbabilityAlgorithms.generate_prediction(
                numbers_history=history,
                total_numbers=spec["total_numbers"],
                numbers_to_draw=spec["numbers_to_draw"],
                strategy="uniform",
                lottery_name=db_name,
                num_games=num_games_per_draw,
                seed=(seed + i) if seed is not None else None,
            )
            uniform_max_by_draw.append(
                max((len(set(game) & real_set) for game in baseline), default=0)
            )

        strategy_max_by_draw = [item["max_hits"] for item in hits_by_draw]
        differences = [s - u for s, u in zip(strategy_max_by_draw, uniform_max_by_draw)]
        ci_low, ci_high = paired_bootstrap_ci(differences, seed=seed or 0)
        comparison = {
            "baseline": "uniform",
            "paired_draws": len(differences),
            "mean_difference": round(sum(differences) / len(differences), 4) if differences else 0.0,
            "ci95": [round(ci_low, 4), round(ci_high, 4)],
            "p_value": round(sign_flip_p_value(differences, seed=seed or 0), 4),
            "significant": False,  # preenchido abaixo
            "note": "Diferença estatisticamente significativa indicaria viés ou bug, não habilidade preditiva.",
        }
        comparison["significant"] = not (ci_low <= 0 <= ci_high) and comparison["p_value"] < 0.05

    # Agrupamentos de premiações de acordo com a loteria
    reward_metrics = {}
    if db_name == "Megasena":
        reward_metrics = {
            "quadras (4 acertos)": hits_distribution.get(4, 0),
            "quinas (5 acertos)": hits_distribution.get(5, 0),
            "senas (6 acertos)": hits_distribution.get(6, 0),
        }
    elif db_name == "Lotofacil":
        reward_metrics = {
            "11 acertos": hits_distribution.get(11, 0),
            "12 acertos": hits_distribution.get(12, 0),
            "13 acertos": hits_distribution.get(13, 0),
            "14 acertos": hits_distribution.get(14, 0),
            "15 acertos": hits_distribution.get(15, 0),
        }
    elif db_name == "Quina":
        reward_metrics = {
            "duques (2 acertos)": hits_distribution.get(2, 0),
            "ternos (3 acertos)": hits_distribution.get(3, 0),
            "quadras (4 acertos)": hits_distribution.get(4, 0),
            "quinas (5 acertos)": hits_distribution.get(5, 0),
        }

    # Jogos mais pontuados (únicos) para o usuário selecionar e salvar
    seen_games = set()
    top_games = []
    for game, hits, concurso_num, hit_numbers in sorted(all_games_with_hits, key=lambda x: x[1], reverse=True):
        key = tuple(game)
        if key in seen_games:
            continue
        seen_games.add(key)
        top_games.append({
            "game": game,
            "hits": hits,
            "concurso": concurso_num,
            "hit_numbers": hit_numbers,
        })
        if len(top_games) >= 50:
            break

    # Expectativa teórica (hipergeométrica) por aposta, para comparação honesta
    calibration = observed_vs_expected(
        hits_distribution,
        spec["total_numbers"],
        spec["numbers_to_draw"],
        total_games_simulated,
    )
    expected_distribution = {
        str(row["hits"]): row["expected"] for row in calibration["rows"]
    }

    return {
        "lottery": display_name,
        "strategy_tested": strategy,
        "mode": "uniform" if strategy == "uniform" else "illustrative",
        "seed": seed,
        "concursos_simulados": test_draws_count,
        "total_apostas_simuladas": total_games_simulated,
        "hits_distribution": hits_distribution,
        "expected_distribution": expected_distribution,
        "calibration": calibration,
        "comparison": comparison,
        "rewards_summary": reward_metrics,
        "hits_by_draw": hits_by_draw,
        "top_games": top_games,
        "from_start": from_start,
        "notice": (
            "Distribuição observada versus expectativa teórica por acaso. "
            "Jogos com mais acertos foram selecionados depois de conhecido o resultado: "
            "não são evidência de previsão."
        ),
        "simulations_detail": results_detail[:15]  # Detalhes dos primeiros 15 concursos para manter o payload leve
    }


class FechamentoRequest(BaseModel):
    lottery_name: str = Field(..., description="Nome da loteria (Mega-Sena, Lotofácil ou Quina)")
    selected_numbers: List[int] = Field(..., description="Lista de números escolhidos pelo usuário para desdobrar")
    guarantee: int = Field(..., ge=2, description="Garantia mínima de acertos, ex: 14 para Lotofácil")
    condition_hits: int = Field(..., ge=2, description="Quantidade de acertos necessários dentro do conjunto para ativar a garantia")


@router.post("/fechamento", response_model=Dict[str, Any])
async def post_fechamento(data: FechamentoRequest):
    """
    Gera combinações ótimas (desdobramentos) baseadas nas dezenas selecionadas e regras de garantia.
    """
    spec = get_lottery_spec(data.lottery_name)
    game_size = spec["numbers_to_draw"]
    display_name = spec["display_name"]
    # Chave canônica: normalize_lottery_key remove acentos ("Lotofácil" -> "lotofacil")
    lot_key = normalize_lottery_key(data.lottery_name) or ""

    # Limitações de dezenas para evitar timeout / estouro de RAM no serverless
    limits = {
        "megasena": 12,
        "lotofacil": 20,
        "quina": 10
    }

    max_allowed = limits.get(lot_key, 12)
    clean_numbers = sorted(list(set(data.selected_numbers)))
    
    if len(clean_numbers) > max_allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Para a loteria {display_name}, o limite de dezenas selecionadas é de {max_allowed} números (você enviou {len(clean_numbers)})."
        )
        
    if len(clean_numbers) < game_size:
        raise HTTPException(
            status_code=400,
            detail=f"Você deve selecionar pelo menos {game_size} dezenas para realizar o fechamento."
        )

    if data.guarantee > game_size:
        raise HTTPException(
            status_code=400,
            detail=f"A garantia ({data.guarantee}) não pode ser maior que o tamanho do jogo ({game_size})."
        )

    if data.condition_hits > len(clean_numbers) or data.condition_hits > game_size:
        raise HTTPException(
            status_code=400,
            detail=(
                f"A condição de acerto ({data.condition_hits}) não pode exceder "
                f"o tamanho do jogo ({game_size}) nem o número de dezenas selecionadas ({len(clean_numbers)})."
            ),
        )

    if data.guarantee > data.condition_hits:
        raise HTTPException(
            status_code=400,
            detail=(
                f"A garantia ({data.guarantee}) não pode ser maior que a condição de acerto "
                f"({data.condition_hits}): nenhum jogo poderia satisfazê-la."
            ),
        )

    # Executa a geração combinatória
    try:
        games = ClosingEngine.generate_desdobramento(
            selected_numbers=clean_numbers,
            game_size=game_size,
            guarantee=data.guarantee,
            condition_hits=data.condition_hits
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    
    return {
        "lottery": display_name,
        "selected_numbers": clean_numbers,
        "game_size": game_size,
        "guarantee": data.guarantee,
        "condition_hits": data.condition_hits,
        "total_games_generated": len(games),
        "games": games
    }


class CoverageRequest(BaseModel):
    lottery_name: str = Field(..., description="Nome da loteria")
    selected_numbers: List[int] = Field(..., description="Dezenas selecionadas")
    guarantee: int = Field(..., ge=2)
    condition_hits: int = Field(..., ge=2)
    games: List[List[int]] = Field(..., description="Apostas cuja cobertura deve ser medida")


@router.post("/fechamento/coverage", response_model=Dict[str, Any])
async def post_coverage(data: CoverageRequest):
    """Mede a cobertura real de apostas (permite validar o efeito de pós-filtros)."""
    spec = get_lottery_spec(data.lottery_name)
    return ClosingEngine.compute_coverage(
        selected_numbers=sorted(set(data.selected_numbers)),
        game_size=spec["numbers_to_draw"],
        guarantee=data.guarantee,
        condition_hits=data.condition_hits,
        games=data.games,
    )


@router.get("/fechamento/coverage-curve", response_model=Dict[str, Any])
async def get_coverage_curve(
    lottery_name: str = Query(...),
    selected_numbers: str = Query(..., description="Dezenas separadas por vírgula, ex: 1,2,3"),
    guarantee: int = Query(..., ge=2),
    condition_hits: int = Query(..., ge=2),
):
    """Curva de cobertura real, calculada pelo motor (não simulada no cliente)."""
    try:
        numbers = [int(part) for part in selected_numbers.split(",") if part.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="selected_numbers deve conter inteiros separados por vírgula.")
    spec = get_lottery_spec(lottery_name)
    try:
        curve = ClosingEngine.get_coverage_curve(
            selected_numbers=sorted(set(numbers)),
            game_size=spec["numbers_to_draw"],
            guarantee=guarantee,
            condition_hits=condition_hits,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {
        "lottery": spec["display_name"],
        "curve": curve,
        "required_bets": curve[-1]["num_bets"] if curve else 0,
        "final_coverage_pct": curve[-1]["coverage_pct"] if curve else 0.0,
    }

