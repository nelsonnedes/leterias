from sqlalchemy import (
    Column, Integer, String, Date, DateTime, Boolean, 
    Float, Text, JSON, func, UniqueConstraint
)
from sqlalchemy.orm import declarative_base
from typing import Optional

Base = declarative_base()


class LotteryResult(Base):
    __tablename__ = "lottery_results"
    __table_args__ = (
        UniqueConstraint("draw_date", "lottery_name", name="uq_draw_date_lottery"),
    )

    id = Column(Integer, primary_key=True, index=True)
    lottery_name = Column(String(100), nullable=False)
    draw_date = Column(Date, nullable=False)
    next_draw_date = Column(Date, nullable=True)
    numbers = Column(JSON, nullable=False)
    dezenas_adicionales = Column(JSON, nullable=True)
    status = Column(String(20), default="open")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    source_url = Column(String(500), nullable=True)
    source_reference = Column(String(200), nullable=True)
    probability_score = Column(Float, nullable=True)
    prediction_trend = Column(Text, nullable=True)

    def __repr__(self):
        return f"<LotteryResult id={self.id} {self.lottery_name} {self.draw_date}>"


class GameCollection(Base):
    __tablename__ = "game_collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    lottery_name = Column(String(100), nullable=False)
    games = Column(JSON, nullable=False)  # Armazena listas de dezenas: [[1, 2, 3...], [4, 5, 6...]]
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<GameCollection id={self.id} '{self.name}' {self.lottery_name}>"