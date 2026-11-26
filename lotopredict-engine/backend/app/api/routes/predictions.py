import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Tuple, Set
from pydantic import BaseModel, Field
from app.database.models import LotteryResult
from app.database.session import get_db
from app.core.constants import get_lottery_spec
from app.services.probability import ProbabilityAlgorithms
from app.services.closing_engine import ClosingEngine

router = APIRouter()

@router.get("/lottery/{lottery_name}/predict", response_model=Dict[str, Any])
@router.post("/lottery/{lottery_name}/predict", response_model=Dict[str, Any])
async def get_predictions(
    lottery_name: str,
    num_games: int = Query(default=1, ge=1, le=50, description="Quantidade de jogos a serem gerados"),
    strategy: str = Query(default="combined", description="Estratégia preditiva: combined, frequency, delay ou ml_ensemble"),
    db: Session = Depends(get_db)
):
    """
    Gera previsões de jogos baseando-se no histórico de sorteios e aplicando os filtros matemáticos.
    """
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
    
    # Extrai listas de dezenas
    numbers_history = [r.numbers for r in results if r.numbers]
    
    # Inverte para ter do mais antigo ao mais recente para o gerador
    numbers_history.reverse()
    
    # Gera jogos sugeridos pelo motor matemático
    predicted_games = ProbabilityAlgorithms.generate_prediction(
        numbers_history=numbers_history,
        total_numbers=spec["total_numbers"],
        numbers_to_draw=spec["numbers_to_draw"],
        strategy=strategy,
        lottery_name=db_name,
        num_games=num_games
    )
    
    return {
        "lottery": display_name,
        "strategy_used": strategy,
        "total_historical_draws_analyzed": len(numbers_history),
        "games": predicted_games
    }

@router.post("/lottery/{lottery_name}/backtest", response_model=Dict[str, Any])
async def run_backtest(
    lottery_name: str,
    num_draws: int = Query(default=100, ge=5, le=5000, description="Quantidade de concursos históricos para o teste"),
    num_games_per_draw: int = Query(default=5, ge=1, le=50, description="Quantidade de jogos simulados por concurso"),
    strategy: str = Query(default="combined", description="Estratégia estatística: combined, frequency, delay ou ml_ensemble"),
    from_start: bool = Query(default=False, description="Simular desde o concurso mais antigo do banco"),
    target_hits: int = Query(default=0, ge=0, description="Meta de acertos: continua gerando jogos ate atingir (0 = desativado)"),
    db: Session = Depends(get_db)
):
    """
    Simula e valida a eficácia do motor estatístico retrospectivamente contra os dados do banco de dados SQLite.
    """
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
    
    # Sorteios separados para o loop de backtest
    start_test_idx = 15 if from_start else total_db_draws - test_draws_count
    if target_hits > 0:
        start_test_idx = max(start_test_idx, 30)
    test_draws_count = min(test_draws_count, total_db_draws - start_test_idx)
    
    hits_distribution = {}  # Contagem geral de acertos
    total_games_simulated = 0
    results_detail = []
    hits_by_draw = []  # Resumo compacto: concurso -> máximo de acertos
    all_games_with_hits: List[Tuple[List[int], int, int, List[int]]] = []
    target_games: List[Dict[str, Any]] = []
    target_attempts_used = 0
    TARGET_MAX_ATTEMPTS = 500
    TARGET_ATTEMPTS_PER_DRAW = 50

    def _target_search(history: List[List[int]], target_set: Set[int], concurso_num: int) -> None:
        """Gera lotes extras (com limite) ate aparecer jogo que atinja a meta de acertos."""
        nonlocal target_attempts_used
        if target_hits <= 0 or target_attempts_used >= TARGET_MAX_ATTEMPTS:
            return
        attempts_here = 0
        while attempts_here < TARGET_ATTEMPTS_PER_DRAW and target_attempts_used < TARGET_MAX_ATTEMPTS:
            attempts_here += 1
            extra = ProbabilityAlgorithms.generate_prediction(
                numbers_history=history,
                total_numbers=spec["total_numbers"],
                numbers_to_draw=spec["numbers_to_draw"],
                strategy=strategy,
                lottery_name=db_name,
                num_games=num_games_per_draw,
            )
            target_attempts_used += 1
            reached = False
            for game in extra:
                game_set = set(game)
                hits = len(game_set & target_set)
                hit_numbers = sorted(game_set & target_set)
                all_games_with_hits.append((list(game), hits, concurso_num, hit_numbers))
                if hits >= target_hits:
                    target_games.append({
                        "game": game,
                        "hits": hits,
                        "concurso": concurso_num,
                        "hit_numbers": hit_numbers,
                    })
                    reached = True
            if reached:
                break

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
            num_games=num_games_per_draw
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

        if target_hits > 0:
            for game, hits in zip(predicted_games, draw_hits):
                if hits >= target_hits:
                    target_games.append({
                        "game": game,
                        "hits": hits,
                        "concurso": concurso_num,
                        "hit_numbers": sorted(set(game) & real_numbers_set),
                    })
            if not any(h >= target_hits for h in draw_hits):
                _target_search(history, real_numbers_set, concurso_num)

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

    return {
        "lottery": display_name,
        "strategy_tested": strategy,
        "concursos_simulados": test_draws_count,
        "total_apostas_simuladas": total_games_simulated,
        "hits_distribution": hits_distribution,
        "rewards_summary": reward_metrics,
        "hits_by_draw": hits_by_draw,
        "top_games": top_games,
        "target_hits": target_hits,
        "target_games": target_games,
        "target_reached": bool(target_games),
        "from_start": from_start,
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
    lot_key = data.lottery_name.lower().replace(" ", "").replace("-", "")

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
        
    if data.condition_hits > len(clean_numbers):
        raise HTTPException(
            status_code=400,
            detail=f"A condição de acerto ({data.condition_hits}) não pode ser maior que o número de dezenas selecionadas ({len(clean_numbers)})."
        )

    # Executa a geração combinatória
    games = ClosingEngine.generate_desdobramento(
        selected_numbers=clean_numbers,
        game_size=game_size,
        guarantee=data.guarantee,
        condition_hits=data.condition_hits
    )
    
    return {
        "lottery": display_name,
        "selected_numbers": clean_numbers,
        "game_size": game_size,
        "guarantee": data.guarantee,
        "condition_hits": data.condition_hits,
        "total_games_generated": len(games),
        "games": games
    }

