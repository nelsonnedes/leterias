from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.database.models import GameCollection, LotteryResult
from app.database.session import get_db

router = APIRouter()

# Definições estáticas das loterias para validação e mapeamento de nomes
LOTTERY_MAP = {
    "megasena": {"db_name": "Megasena", "display_name": "Mega-Sena"},
    "mega-sena": {"db_name": "Megasena", "display_name": "Mega-Sena"},
    "lotofacil": {"db_name": "Lotofacil", "display_name": "Lotofácil"},
    "lotofácil": {"db_name": "Lotofacil", "display_name": "Lotofácil"},
    "quina": {"db_name": "Quina", "display_name": "Quina"},
}

class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Nome personalizado para a coleção de apostas")
    lottery_name: str = Field(..., description="Loteria correspondente (Mega-Sena, Lotofácil ou Quina)")
    games: List[List[int]] = Field(..., description="Lista de jogos/apostas, ex: [[1,2,3,4,5,6]]")

@router.post("/collections", response_model=Dict[str, Any], status_code=201)
async def create_collection(collection_data: CollectionCreate, db: Session = Depends(get_db)):
    """
    Salva uma nova coleção de apostas com nome personalizado no banco de dados.
    """
    name_clean = collection_data.lottery_name.lower().replace(" ", "")
    spec = LOTTERY_MAP.get(name_clean)
    if not spec:
        raise HTTPException(
            status_code=400,
            detail=f"Loteria '{collection_data.lottery_name}' não suportada. Use Mega-Sena, Lotofácil ou Quina."
        )
    
    db_name = spec["db_name"]
    display_name = spec["display_name"]
    
    # Salva no SQLite
    new_collection = GameCollection(
        name=collection_data.name,
        lottery_name=db_name,
        games=collection_data.games
    )
    
    try:
        db.add(new_collection)
        db.commit()
        db.refresh(new_collection)
        
        return {
            "id": new_collection.id,
            "name": new_collection.name,
            "lottery_name": display_name,
            "total_games": len(new_collection.games),
            "games": new_collection.games,
            "created_at": new_collection.created_at.isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao salvar a coleção no banco de dados: {str(e)}"
        )

@router.get("/collections", response_model=List[Dict[str, Any]])
async def list_collections(db: Session = Depends(get_db)):
    """
    Lista todas as coleções de jogos salvas no banco de dados.
    """
    collections = db.query(GameCollection).order_by(GameCollection.created_at.desc()).all()
    
    output = []
    for col in collections:
        # Busca o nome de exibição amigável correspondente
        display_name = col.lottery_name
        for k, v in LOTTERY_MAP.items():
            if v["db_name"] == col.lottery_name:
                display_name = v["display_name"]
                break
                
        output.append({
            "id": col.id,
            "name": col.name,
            "lottery_name": display_name,
            "total_games": len(col.games),
            "created_at": col.created_at.isoformat()
        })
    return output

@router.delete("/collections/{collection_id}", status_code=200)
async def delete_collection(collection_id: int, db: Session = Depends(get_db)):
    """
    Remove uma coleção de jogos do banco de dados SQLite.
    """
    col = db.query(GameCollection).filter(GameCollection.id == collection_id).first()
    if not col:
        raise HTTPException(status_code=404, detail="Coleção não encontrada.")
        
    try:
        db.delete(col)
        db.commit()
        return {"message": "Coleção excluída com sucesso."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao excluir coleção: {str(e)}")

class CollectionUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Novo nome personalizado para a coleção")

@router.put("/collections/{collection_id}", response_model=Dict[str, Any])
async def update_collection(collection_id: int, update_data: CollectionUpdate, db: Session = Depends(get_db)):
    """
    Atualiza o nome personalizado de uma coleção de apostas no banco de dados SQLite.
    """
    col = db.query(GameCollection).filter(GameCollection.id == collection_id).first()
    if not col:
        raise HTTPException(status_code=404, detail="Coleção não encontrada.")
        
    try:
        col.name = update_data.name
        db.commit()
        db.refresh(col)
        return {"message": "Coleção atualizada com sucesso.", "id": col.id, "name": col.name}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar coleção: {str(e)}")

@router.get("/collections/{collection_id}", response_model=Dict[str, Any])
async def get_collection_detail(collection_id: int, db: Session = Depends(get_db)):
    """
    Retorna os detalhes de uma coleção e realiza a Conferência Automática
    dos acertos contra o último concurso real sorteado.
    """
    col = db.query(GameCollection).filter(GameCollection.id == collection_id).first()
    if not col:
        raise HTTPException(status_code=404, detail="Coleção não encontrada.")
        
    # Mapeamento de nome de exibição
    display_name = col.lottery_name
    for k, v in LOTTERY_MAP.items():
        if v["db_name"] == col.lottery_name:
            display_name = v["display_name"]
            break
            
    # Busca o último concurso real sorteado no banco para esta loteria
    last_real_draw = (
        db.query(LotteryResult)
        .filter(LotteryResult.lottery_name == col.lottery_name)
        .order_by(LotteryResult.draw_date.desc())
        .first()
    )
    
    check_results = []
    real_draw_info = None
    
    if last_real_draw:
        real_draw_set = set(last_real_draw.numbers)
        real_draw_info = {
            "reference": last_real_draw.source_reference or f"Sorteio de {last_real_draw.draw_date.strftime('%d/%m/%Y')}",
            "draw_date": last_real_draw.draw_date.isoformat(),
            "numbers": last_real_draw.numbers
        }
        
        # Realiza a conferência de cada aposta
        for idx, game in enumerate(col.games):
            game_set = set(game)
            hits = len(game_set.intersection(real_draw_set))
            
            # Descrição do prêmio virtual de acordo com o total de acertos
            award = "Nenhum"
            if col.lottery_name == "Megasena":
                if hits == 4: award = "Quadra"
                elif hits == 5: award = "Quina"
                elif hits == 6: award = "Sena"
            elif col.lottery_name == "Lotofacil":
                if hits >= 11: award = f"{hits} Acertos"
            elif col.lottery_name == "Quina":
                if hits == 2: award = "Duque"
                elif hits == 3: award = "Terno"
                elif hits == 4: award = "Quadra"
                elif hits == 5: award = "Quina"
                
            check_results.append({
                "game_index": idx + 1,
                "game": game,
                "hits_count": hits,
                "award_achieved": award
            })
    else:
        # Fallback caso não haja histórico no banco para conferir
        for idx, game in enumerate(col.games):
            check_results.append({
                "game_index": idx + 1,
                "game": game,
                "hits_count": 0,
                "award_achieved": "Histórico não disponível para conferência"
            })
            
    return {
        "id": col.id,
        "name": col.name,
        "lottery_name": display_name,
        "created_at": col.created_at.isoformat(),
        "last_real_draw": real_draw_info,
        "checking_summary": check_results
    }
