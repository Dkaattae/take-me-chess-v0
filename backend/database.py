import os
import json
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

from models import (
    GameState, LeaderboardEntry, Player, Piece, PieceColor,
    PieceType, BoardState, TakeMeState, GameStatus, GameMode
)
from database_models import Base, DBGame, DBPlayer, DBLeaderboard
from game_logic import get_board_hash

load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./take_me_chess.db")

class SQLAlchemyDatabase:
    def __init__(self, db_url: str):
        self.engine = create_engine(
            db_url, 
            connect_args={"check_same_thread": False} if db_url.startswith("sqlite") else {}
        )
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

    def get_session(self) -> Session:
        return self.SessionLocal()

    def clear_database(self):
        """Reset database for testing. Dropping and re-creating all tables."""
        Base.metadata.drop_all(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)

    def _create_initial_board(self) -> BoardState:
        """Create the initial chess board setup"""
        board = [[None for _ in range(8)] for _ in range(8)]
        for col in range(8):
            board[1][col] = Piece(type=PieceType.PAWN, color=PieceColor.BLACK)
            board[6][col] = Piece(type=PieceType.PAWN, color=PieceColor.WHITE)
        piece_order = [PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP,
                      PieceType.QUEEN, PieceType.KING, PieceType.BISHOP,
                      PieceType.KNIGHT, PieceType.ROOK]
        for col in range(8):
            board[0][col] = Piece(type=piece_order[col], color=PieceColor.BLACK)
            board[7][col] = Piece(type=piece_order[col], color=PieceColor.WHITE)
        return BoardState(root=board)

    def create_game(self, game_mode: GameMode, players_data: List[Dict]) -> GameState:
        session = self.get_session()
        try:
            game_id = f"game_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
            
            initial_board = self._create_initial_board()
            db_game = DBGame(
                id=game_id,
                status=GameStatus.ACTIVE,
                current_turn=PieceColor.WHITE,
                board_json=json.dumps(initial_board.root, default=lambda o: o.model_dump()),
                take_me_state_json=json.dumps(TakeMeState(declared=False, exposed_pieces=[], capturable_pieces=[], must_capture=False).model_dump()),
                move_history_json=json.dumps([]),
                position_history_json=json.dumps([get_board_hash(initial_board, PieceColor.WHITE, False)]),
                piece_count_json=json.dumps({"white": 16, "black": 16}),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            for i, player_data in enumerate(players_data):
                color = PieceColor.WHITE if i == 0 else PieceColor.BLACK
                is_bot = player_data.get("is_bot", False)
                name = player_data["name"]
                player_id = f"player_{game_id}_{i}"
                if is_bot and name == "":
                    name = f"Bot_{player_id}"
                
                db_player = DBPlayer(
                    id=player_id,
                    game_id=game_id,
                    name=name,
                    color=color,
                    is_bot=is_bot,
                    score=0
                )
                db_game.players.append(db_player)
            
            session.add(db_game)
            session.commit()
            session.refresh(db_game)
            return self._to_pydantic_game(db_game)
        finally:
            session.close()

    def get_game(self, game_id: str) -> Optional[GameState]:
        session = self.get_session()
        try:
            db_game = session.query(DBGame).filter(DBGame.id == game_id).first()
            if db_game:
                return self._to_pydantic_game(db_game)
            return None
        finally:
            session.close()

    def update_game(self, game_state: GameState) -> GameState:
        session = self.get_session()
        try:
            db_game = session.query(DBGame).filter(DBGame.id == game_state.id).first()
            if db_game:
                db_game.status = game_state.status
                db_game.current_turn = game_state.current_turn
                db_game.winner_id = game_state.winner.id if game_state.winner else None
                db_game.board_json = json.dumps(game_state.board.root, default=lambda o: o.model_dump())
                db_game.take_me_state_json = json.dumps(game_state.take_me_state.model_dump())
                db_game.move_history_json = json.dumps([m.model_dump(by_alias=True) for m in game_state.move_history])
                db_game.position_history_json = json.dumps(game_state.position_history)
                db_game.piece_count_json = json.dumps(game_state.piece_count)
                db_game.message = game_state.message
                db_game.updated_at = datetime.utcnow()
                
                # Update player scores
                for p in game_state.players:
                    db_p = session.query(DBPlayer).filter(DBPlayer.id == p.id).first()
                    if db_p:
                        db_p.score = p.score
                
                session.commit()
                session.refresh(db_game)
                return self._to_pydantic_game(db_game)
            return game_state
        finally:
            session.close()

    def delete_game(self, game_id: str) -> bool:
        session = self.get_session()
        try:
            db_game = session.query(DBGame).filter(DBGame.id == game_id).first()
            if db_game:
                session.delete(db_game)
                session.commit()
                return True
            return False
        finally:
            session.close()

    def get_leaderboard(self, game_mode: Optional[GameMode] = None, limit: int = 10) -> List[LeaderboardEntry]:
        session = self.get_session()
        try:
            query = session.query(DBLeaderboard)
            if game_mode:
                query = query.filter(DBLeaderboard.game_mode == game_mode)
            
            db_entries = query.order_by(desc(DBLeaderboard.wins)).limit(limit).all()
            return [LeaderboardEntry.model_validate(e) for e in db_entries]
        finally:
            session.close()

    def add_leaderboard_entry(self, entry: LeaderboardEntry) -> None:
        session = self.get_session()
        try:
            db_entry = session.query(DBLeaderboard).filter(
                DBLeaderboard.player_name == entry.player_name,
                DBLeaderboard.game_mode == entry.game_mode
            ).first()
            
            if db_entry:
                db_entry.wins += entry.wins
                db_entry.losses += entry.losses
                db_entry.draws += entry.draws
                db_entry.score += entry.score
                db_entry.last_played = datetime.utcnow()
            else:
                db_entry = DBLeaderboard(
                    player_name=entry.player_name,
                    game_mode=entry.game_mode,
                    wins=entry.wins,
                    losses=entry.losses,
                    draws=entry.draws,
                    score=entry.score,
                    last_played=datetime.utcnow()
                )
                session.add(db_entry)
            
            session.commit()
        finally:
            session.close()

    def _to_pydantic_game(self, db_game: DBGame) -> GameState:
        board_data = json.loads(db_game.board_json)
        take_me_data = json.loads(db_game.take_me_state_json)
        move_history_data = json.loads(db_game.move_history_json)
        position_history = json.loads(db_game.position_history_json)
        piece_count = json.loads(db_game.piece_count_json)
        
        winner = None
        if db_game.winner_id:
            for p in db_game.players:
                if p.id == db_game.winner_id:
                    winner = Player.model_validate(p)
                    break
        
        return GameState(
            id=db_game.id,
            board=BoardState(root=board_data),
            current_turn=db_game.current_turn,
            players=[Player.model_validate(p) for p in db_game.players],
            status=db_game.status,
            winner=winner,
            take_me_state=TakeMeState.model_validate(take_me_data),
            move_history=move_history_data, # Pydantic will validate from dict list
            position_history=position_history,
            piece_count=piece_count,
            message=db_game.message,
            created_at=db_game.created_at,
            updated_at=db_game.updated_at
        )

# Global database instance
db = SQLAlchemyDatabase(DATABASE_URL)