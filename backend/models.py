from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, RootModel
from pydantic.config import ConfigDict
from datetime import datetime


class PieceType(str, Enum):
    KING = "king"
    QUEEN = "queen"
    ROOK = "rook"
    BISHOP = "bishop"
    KNIGHT = "knight"
    PAWN = "pawn"


class PieceColor(str, Enum):
    WHITE = "white"
    BLACK = "black"


class Piece(BaseModel):
    type: PieceType
    color: PieceColor


class Square(BaseModel):
    row: int = Field(ge=0, le=7)
    col: int = Field(ge=0, le=7)


class Move(BaseModel):
    from_: Square = Field(alias="from")
    to: Square
    piece: Piece
    captured_piece: Optional[Piece] = None
    is_promotion: Optional[bool] = False
    promotion_piece: Optional[PieceType] = None

    model_config = ConfigDict(validate_by_name=True)


class BoardState(RootModel[List[List[Optional[Piece]]]]):
    root: List[List[Optional[Piece]]] = Field(min_length=8, max_length=8)

    def __iter__(self):
        return iter(self.root)

    def __getitem__(self, key):
        return self.root[key]

    def __setitem__(self, key, value):
        self.root[key] = value


class Player(BaseModel):
    id: str
    name: str = Field(min_length=1, max_length=50)
    color: PieceColor
    is_bot: bool = False
    avatar: Optional[str] = None


class GameStatus(str, Enum):
    SETUP = "setup"
    ACTIVE = "active"
    WIN = "win"
    DRAW = "draw"


class GameMode(str, Enum):
    SINGLE_PLAYER = "1P"
    TWO_PLAYER = "2P"


class TakeMeState(BaseModel):
    declared: bool
    declarer: Optional[PieceColor] = None
    exposed_pieces: List[Square] = []
    capturable_pieces: List[Square] = []
    must_capture: bool = False


class GameState(BaseModel):
    id: str
    board: BoardState
    current_turn: PieceColor
    players: List[Player] = Field(min_length=2, max_length=2)
    status: GameStatus
    winner: Optional[Player] = None
    selected_piece: Optional[Square] = None
    legal_moves: List[Square] = []
    take_me_state: TakeMeState
    move_history: List[Move] = []
    piece_count: Dict[str, int] = Field(default_factory=lambda: {"white": 16, "black": 16})
    created_at: datetime
    updated_at: datetime


class LeaderboardEntry(BaseModel):
    player_name: str
    wins: int = Field(ge=0)
    losses: int = Field(ge=0)
    draws: int = Field(ge=0)
    game_mode: GameMode
    last_played: Optional[datetime] = None


# Request/Response models
class CreateGameRequest(BaseModel):
    game_mode: GameMode
    players: List[Dict[str, Any]] = Field(min_length=2, max_length=2)


class MakeMoveRequest(BaseModel):
    from_: Square = Field(alias="from")
    to: Square
    promotion_piece: Optional[PieceType] = None

    model_config = ConfigDict(allow_population_by_field_name=True)


class DeclareTakeMeRequest(BaseModel):
    from_: Square = Field(alias="from")
    to: Square
    promotion_piece: Optional[PieceType] = None

    model_config = ConfigDict(allow_population_by_field_name=True)


class BotMoveResponse(BaseModel):
    move: Move
    declare_take_me: bool


class ValidationResponse(BaseModel):
    valid: bool
    legal_moves: List[Square] = []
    error: Optional[str] = None


class ErrorResponse(BaseModel):
    error: str
    code: str
    details: Optional[Dict[str, Any]] = None