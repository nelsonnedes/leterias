from fastapi import HTTPException
from typing import Dict, Any

# Definições centralizadas das loterias suportadas
LOTTERY_SPECS: Dict[str, Dict[str, Any]] = {
    "megasena": {
        "total_numbers": 60,
        "numbers_to_draw": 6,
        "db_name": "Megasena",
        "display_name": "Mega-Sena",
    },
    "lotofacil": {
        "total_numbers": 25,
        "numbers_to_draw": 15,
        "db_name": "Lotofacil",
        "display_name": "Lotofácil",
    },
    "quina": {
        "total_numbers": 80,
        "numbers_to_draw": 5,
        "db_name": "Quina",
        "display_name": "Quina",
    },
}

# Aliases aceitos nas rotas
_LOTTERY_ALIASES: Dict[str, str] = {
    "megasena": "megasena",
    "mega-sena": "megasena",
    "lotofacil": "lotofacil",
    "lotofácil": "lotofacil",
    "quina": "quina",
}


def normalize_lottery_key(lottery_name: str) -> str | None:
    """Normaliza o nome da loteria para a chave canônica."""
    cleaned = lottery_name.lower().replace(" ", "")
    if cleaned in _LOTTERY_ALIASES:
        return _LOTTERY_ALIASES[cleaned]
    cleaned_no_dash = cleaned.replace("-", "")
    return _LOTTERY_ALIASES.get(cleaned_no_dash)


def get_lottery_spec(lottery_name: str, strict: bool = True) -> Dict[str, Any]:
    """
    Retorna as especificações da loteria.
    Se strict=True, lança HTTPException(400) para loteria desconhecida.
    """
    key = normalize_lottery_key(lottery_name)
    if key and key in LOTTERY_SPECS:
        return LOTTERY_SPECS[key]

    if not strict:
        return LOTTERY_SPECS["megasena"]

    raise HTTPException(
        status_code=400,
        detail=f"Loteria '{lottery_name}' não suportada. Escolha entre: Mega-Sena, Lotofácil ou Quina.",
    )


def get_display_name_by_db_name(db_name: str) -> str:
    """Converte db_name (ex: 'Megasena') para display_name (ex: 'Mega-Sena')."""
    for spec in LOTTERY_SPECS.values():
        if spec["db_name"] == db_name:
            return spec["display_name"]
    return db_name
