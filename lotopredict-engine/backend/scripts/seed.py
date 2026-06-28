import asyncio
import logging
import sys
import os

# Adiciona o diretório base do backend ao sys.path para permitir importações corretas do módulo app
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy.exc import IntegrityError
from app.database.session import engine, SessionLocal
from app.database.models import Base, LotteryResult
from app.scrapers.caixa_scraper import CaixaScraper

# Configuração simples de logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("seed_script")

async def seed_data():
    # 1. Garantir que as tabelas existem no SQLite
    logger.info("Criando tabelas no banco de dados SQLite caso não existam...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Tabelas criadas com sucesso.")
    except Exception as e:
        logger.error(f"Erro ao inicializar tabelas do banco de dados: {e}")
        return

    # 2. Inicializar o scraper
    logger.info("Iniciando o CaixaScraper para buscar resultados históricos...")
    async with CaixaScraper() as scraper:
        try:
            results_dict = await scraper.scrape_all()
        except Exception as e:
            logger.error(f"Erro durante o processo de scraping de dados: {e}")
            return

        db = SessionLocal()
        total_inserted = 0
        total_ignored = 0
        
        try:
            for lottery_key, results in results_dict.items():
                logger.info(f"Processando {len(results)} resultados encontrados para '{lottery_key}'...")
                for r in results:
                    # Verifica duplicatas com base na data do sorteio e nome da loteria
                    exists = db.query(LotteryResult).filter(
                        LotteryResult.lottery_name == r["lottery_name"],
                        LotteryResult.draw_date == r["draw_date"]
                    ).first()
                    
                    if not exists:
                        lottery_result = LotteryResult(
                            lottery_name=r["lottery_name"],
                            draw_date=r["draw_date"],
                            numbers=r["numbers"],
                            source_url=r["source_url"],
                            status="completed"  # Dados históricos são marcados como concluídos
                        )
                        db.add(lottery_result)
                        total_inserted += 1
                    else:
                        total_ignored += 1
            
            if total_inserted > 0:
                db.commit()
                logger.info(f"Commit executado com sucesso no banco de dados.")
            else:
                logger.info("Nenhum dado novo para inserir.")
                
            logger.info(f"Seeding finalizado! Inseridos: {total_inserted}, Ignorados (já existentes): {total_ignored}")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erro ao inserir dados no banco de dados, transação revertida: {e}")
        finally:
            db.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
