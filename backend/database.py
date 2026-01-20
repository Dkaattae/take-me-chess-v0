from typing import Dict, List, Optional
from datetime import datetime
from models import (
    GameState, LeaderboardEntry, Player, Piece, PieceColor,
    PieceType, BoardState, TakeMeState, GameStatus, GameMode
)


class MockDatabase:
    def __init__(self):
        self.games: Dict[str, GameState] = {}
        self.leaderboard: List[LeaderboardEntry] = self._create_mock_leaderboard()
        self.next_game_id = 1
        self.next_player_id = 1

    def _create_mock_leaderboard(self) -> List[LeaderboardEntry]:
        return [
            LeaderboardEntry(
                player_name="ChessMaster",
                wins=15,
                losses=5,
                draws=2,
                game_mode=GameMode.SINGLE_PLAYER,
                last_played=datetime.now()
            ),
            LeaderboardEntry(
                player_name="PawnSlayer",
                wins=12,
                losses=8,
                draws=3,
                game_mode=GameMode.TWO_PLAYER,
                last_played=datetime.now()
            ),
            LeaderboardEntry(
                player_name="QueenBee",
                wins=10,
                losses=4,
                draws=1,
                game_mode=GameMode.SINGLE_PLAYER,
                last_played=datetime.now()
            ),
        ]

    def _create_initial_board(self) -> BoardState:
        """Create the initial chess board setup"""
        board = [[None for _ in range(8)] for _ in range(8)]

        # Set up pawns
        for col in range(8):
            board[1][col] = Piece(type=PieceType.PAWN, color=PieceColor.BLACK)
            board[6][col] = Piece(type=PieceType.PAWN, color=PieceColor.WHITE)

        # Set up other pieces
        piece_order = [PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP,
                      PieceType.QUEEN, PieceType.KING, PieceType.BISHOP,
                      PieceType.KNIGHT, PieceType.ROOK]

        for col in range(8):
            board[0][col] = Piece(type=piece_order[col], color=PieceColor.BLACK)
            board[7][col] = Piece(type=piece_order[col], color=PieceColor.WHITE)

        return BoardState(root=board)

    def create_game(self, game_mode: GameMode, players_data: List[Dict]) -> GameState:
        """Create a new game"""
        game_id = f"game_{self.next_game_id}"
        self.next_game_id += 1

        players = []
        for i, player_data in enumerate(players_data):
            player_id = f"player_{self.next_player_id}"
            self.next_player_id += 1

            color = PieceColor.WHITE if i == 0 else PieceColor.BLACK
            is_bot = player_data.get("is_bot", False)

            # Generate bot name if needed
            name = player_data["name"]
            if is_bot and name == "":
                name = f"Bot_{player_id}"

            players.append(Player(
                id=player_id,
                name=name,
                color=color,
                is_bot=is_bot
            ))

        game_state = GameState(
            id=game_id,
            board=self._create_initial_board(),
            current_turn=PieceColor.WHITE,
            players=players,
            status=GameStatus.ACTIVE,
            take_me_state=TakeMeState(declared=False, exposed_pieces=[], capturable_pieces=[], must_capture=False),
            move_history=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        self.games[game_id] = game_state
        return game_state

    def get_game(self, game_id: str) -> Optional[GameState]:
        """Get a game by ID"""
        return self.games.get(game_id)

    def update_game(self, game_state: GameState) -> GameState:
        """Update a game state"""
        game_state.updated_at = datetime.now()
        self.games[game_state.id] = game_state
        return game_state

    def delete_game(self, game_id: str) -> bool:
        """Delete a game"""
        if game_id in self.games:
            del self.games[game_id]
            return True
        return False

    def get_leaderboard(self, game_mode: Optional[GameMode] = None, limit: int = 10) -> List[LeaderboardEntry]:
        """Get leaderboard entries"""
        entries = self.leaderboard
        if game_mode:
            entries = [e for e in entries if e.game_mode == game_mode]

        return sorted(entries, key=lambda x: x.wins, reverse=True)[:limit]

    def add_leaderboard_entry(self, entry: LeaderboardEntry) -> None:
        """Add or update a leaderboard entry"""
        # Simple implementation - just append for now
        # In a real implementation, you'd update existing entries
        entry.last_played = datetime.now()
        self.leaderboard.append(entry)


# Global database instance
db = MockDatabase()