import json
from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class DBPlayer(Base):
    __tablename__ = "players"
    
    id = Column(String, primary_key=True)
    game_id = Column(String, ForeignKey("games.id", ondelete="CASCADE"))
    name = Column(String)
    color = Column(String)
    is_bot = Column(Boolean, default=False)
    avatar = Column(String, nullable=True)
    score = Column(Integer, default=0)
    
    game = relationship("DBGame", back_populates="players")

class DBGame(Base):
    __tablename__ = "games"
    
    id = Column(String, primary_key=True)
    status = Column(String)
    current_turn = Column(String)
    winner_id = Column(String, nullable=True)
    
    # Complex fields stored as JSON strings
    board_json = Column(Text)
    take_me_state_json = Column(Text)
    move_history_json = Column(Text)
    position_history_json = Column(Text)
    piece_count_json = Column(Text)
    
    message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    players = relationship("DBPlayer", back_populates="game", cascade="all, delete-orphan")

class DBLeaderboard(Base):
    __tablename__ = "leaderboard"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    player_name = Column(String)
    game_mode = Column(String)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    score = Column(Integer, default=0)
    last_played = Column(DateTime, default=datetime.utcnow)
