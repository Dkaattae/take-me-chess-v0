import random
from typing import List, Optional, Tuple
from models import (
    BoardState, PieceColor, Square, Move, Piece, PieceType,
    BotMoveResponse
)
from game_logic import get_legal_moves, execute_move, should_promote, get_capture_moves


def generate_bot_name() -> str:
    """Generate a random bot name"""
    first_names = ['Chippy', 'Buddy', 'Sparky', 'Ziggy', 'Fuzzy', 'Bumble', 'Twinkle', 'Whiskers']
    last_names = ['Bot', 'Knight', 'Pawn', 'Rook', 'Bishop', 'King', 'Queen', 'Chess']

    first = random.choice(first_names)
    last = random.choice(last_names)
    return f"{first} {last}"


def generate_bot_avatar() -> str:
    """Generate a random bot avatar"""
    avatars = ['🤖', '🎮', '🎯', '🎲', '🧠', '⚡', '🌟', '🎪']
    return random.choice(avatars)


def get_bot_move(
    board: BoardState,
    color: PieceColor,
    must_capture: bool = False,
    capturable_pieces: List[Square] = []
) -> Optional[BotMoveResponse]:
    """
    Get a bot move for Take-Me Chess.
    Strategy: Try to give away pieces (opposite of normal chess!)
    """
    possible_moves = []

    # Get all pieces of the bot's color
    for row in range(8):
        for col in range(8):
            piece = board[row][col]
            if piece and piece.color == color:
                moves = get_legal_moves(board, Square(row=row, col=col))

                # Filter moves if must capture
                if must_capture:
                    moves = [move for move in moves
                            if any(cp.row == move.row and cp.col == move.col
                                  for cp in capturable_pieces)]

                for move in moves:
                    possible_moves.append((Square(row=row, col=col), move))

    if not possible_moves:
        return None

    # Choose a move - prefer captures (since we want to lose pieces)
    captures = []
    non_captures = []

    for from_square, to_square in possible_moves:
        target = board[to_square.row][to_square.col]
        if target and target.color != color:
            captures.append((from_square, to_square))
        else:
            non_captures.append((from_square, to_square))

    # Prefer captures if available
    move_pool = captures if captures else non_captures

    # Randomly select from available moves
    from_square, to_square = random.choice(move_pool)

    # Create the move
    piece = board[from_square.row][from_square.col]
    captured_piece = board[to_square.row][to_square.col] if board[to_square.row][to_square.col] else None

    move = Move(
        from_=from_square,
        to=to_square,
        piece=piece,
        captured_piece=captured_piece,
        is_promotion=should_promote(piece, to_square.row),
        promotion_piece=PieceType.QUEEN if should_promote(piece, to_square.row) else None
    )

    # Decide whether to declare Take Me!
    # Bot declares if it has exposed pieces after the move
    from game_logic import find_exposed_pieces, get_capturable_pieces_after_take_me

    # Simulate the move
    new_board = execute_move(board, move)
    # Bot declares if the OPPONENT can capture its pieces after the move
    opponent_color = PieceColor.BLACK if color == PieceColor.WHITE else PieceColor.WHITE
    capturable_by_opponent = get_capturable_pieces_after_take_me(new_board, opponent_color)

    # Declare if there are pieces that the opponent MUST capture
    declare_take_me = len(capturable_by_opponent) > 0

    return BotMoveResponse(move=move, declare_take_me=declare_take_me)