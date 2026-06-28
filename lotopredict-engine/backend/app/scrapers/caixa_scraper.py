import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("caixa_scraper")

class CaixaScraper:
    BASE_API_URL = "https://servicebus2.caixa.gov.br/portaldeloterias/api"
    
    # Mapeamento do nome interno para o endpoint da API oficial da Caixa
    LOTTERY_API_KEYS = {
        "megasena": "megasena",
        "lotofacil": "lotofacil",
        "quina": "quina",
        "lotomania": "lotomania",
        "timemania": "timemania",
        "duplasena": "duplasena"
    }

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=settings.SCRAPER_TIMEOUT,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            },
            follow_redirects=True
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    async def get_latest_draw_number(self, lottery_name: str) -> Optional[int]:
        """Obtém o número do último concurso realizado para a loteria."""
        api_key = self.LOTTERY_API_KEYS.get(lottery_name.lower())
        if not api_key:
            return None
        
        url = f"{self.BASE_API_URL}/{api_key}"
        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                data = response.json()
                return data.get("numero")
        except Exception as e:
            logger.error(f"Erro ao obter último concurso de {lottery_name}: {e}")
        return None

    async def fetch_draw_result(self, lottery_name: str, draw_number: int) -> Optional[Dict[str, Any]]:
        """Busca o resultado de um concurso específico via API oficial da Caixa."""
        api_key = self.LOTTERY_API_KEYS.get(lottery_name.lower())
        if not api_key:
            return None
        
        url = f"{self.BASE_API_URL}/{api_key}/{draw_number}"
        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                data = response.json()
                
                # Conversão de data DD/MM/AAAA para objeto date
                date_str = data.get("dataApuracao")
                draw_date = datetime.strptime(date_str, "%d/%m/%Y").date() if date_str else None
                
                # Próximo sorteio data
                next_date_str = data.get("dataProximoConcurso")
                next_draw_date = datetime.strptime(next_date_str, "%d/%m/%Y").date() if next_date_str else None
                
                # Números ordenados
                numbers = [int(n) for n in data.get("listaDezenas", []) if n.isdigit()]
                
                # Dezenas adicionais (ex: segundo sorteio da Dupla Sena)
                add_numbers = data.get("listaDezenasSegundoSorteio")
                
                return {
                    "lottery_name": lottery_name.capitalize(),
                    "draw_date": draw_date,
                    "next_draw_date": next_draw_date,
                    "numbers": sorted(numbers),
                    "dezenas_adicionales": add_numbers,
                    "source_url": url,
                    "source_reference": f"Concurso {draw_number}"
                }
        except Exception as e:
            logger.debug(f"Erro ao buscar concurso {draw_number} para {lottery_name}: {e}")
        return None

    async def scrape_lottery(self, lottery_name: str, limit: int = 500) -> List[Dict[str, Any]]:
        """Busca os últimos N concursos de uma determinada loteria."""
        latest_num = await self.get_latest_draw_number(lottery_name)
        if not latest_num:
            return []
        
        start_num = max(1, latest_num - limit + 1)
        logger.info(f"Buscando concursos de {start_num} a {latest_num} para {lottery_name}...")
        
        results = []
        semaphore = asyncio.Semaphore(5)  # Concorrência segura de 5 conexões para evitar bloqueios
        
        async def worker(num):
            async with semaphore:
                res = await self.fetch_draw_result(lottery_name, num)
                if res:
                    results.append(res)
        
        tasks = [worker(num) for num in range(start_num, latest_num + 1)]
        await asyncio.gather(*tasks)
        
        # Ordena os resultados por data crescente
        results.sort(key=lambda x: x["draw_date"] if x["draw_date"] else datetime.min.date())
        return results

    async def scrape_all(self, limit: int = 200) -> Dict[str, List[Dict[str, Any]]]:
        """Realiza a busca dos últimos N resultados para todas as loterias (focado nas 3 principais)."""
        all_results = {}
        # Foco atual do motor matemático: Mega-Sena, Lotofácil e Quina
        for lottery in ["megasena", "lotofacil", "quina"]:
            logger.info(f"Iniciando scraping da loteria: {lottery}...")
            all_results[lottery] = await self.scrape_lottery(lottery, limit=limit)
        return all_results

async def run_scraper():
    """Função auxiliar para rodar o scraper standalone."""
    async with CaixaScraper() as scraper:
        results = await scraper.scrape_all(limit=50)
        return results