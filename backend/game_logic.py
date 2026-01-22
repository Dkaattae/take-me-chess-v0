from typing import List, Optional, Dict, Tuple
from models import (
    BoardState, Piece, PieceType, PieceColor, Square, Move,
    TakeMeState, GameState, Player, GameStatus
)


def is_valid_square(row: int, col: int) -> bool:
    """Check if a square is on the board"""
    return 0 <= row < 8 and 0 <= col < 8


def get_legal_moves(board: BoardState, square: Square, ignore_take_me: bool = False) -> List[Square]:
    """Get all legal moves for a piece (standard chess rules)"""
    piece = board[square.row][square.col]
    if not piece:
        return []

    moves = []
    row, col = square.row, square.col
    direction = -1 if piece.color == PieceColor.WHITE else 1

    if piece.type == PieceType.PAWN:
        # Forward move
        new_row = row + direction
        if is_valid_square(new_row, col) and not board[new_row][col]:
            moves.append(Square(row=new_row, col=col))
            # Double move from starting position
            start_row = 6 if piece.color == PieceColor.WHITE else 1
            if row == start_row:
                double_row = row + 2 * direction
                if is_valid_square(double_row, col) and not board[double_row][col]:
                    moves.append(Square(row=double_row, col=col))

        # Diagonal captures
        for dc in [-1, 1]:
            capture_col = col + dc
            if is_valid_square(new_row, capture_col):
                target = board[new_row][capture_col]
                if target and target.color != piece.color:
                    moves.append(Square(row=new_row, col=capture_col))

    elif piece.type == PieceType.KNIGHT:
        knight_moves = [(-2, -1), (-2, 1), (-1, -2), (-1, 2),
                       (1, -2), (1, 2), (2, -1), (2, 1)]
        for dr, dc in knight_moves:
            new_row, new_col = row + dr, col + dc
            if is_valid_square(new_row, new_col):
                target = board[new_row][new_col]
                if not target or target.color != piece.color:
                    moves.append(Square(row=new_row, col=new_col))

    elif piece.type == PieceType.BISHOP:
        # Diagonal moves
        directions = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
        for dr, dc in directions:
            r, c = row + dr, col + dc
            while is_valid_square(r, c):
                target = board[r][c]
                if target:
                    if target.color != piece.color:
                        moves.append(Square(row=r, col=c))
                    break
                moves.append(Square(row=r, col=c))
                r += dr
                c += dc

    elif piece.type == PieceType.ROOK:
        # Horizontal and vertical moves
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
        for dr, dc in directions:
            r, c = row + dr, col + dc
            while is_valid_square(r, c):
                target = board[r][c]
                if target:
                    if target.color != piece.color:
                        moves.append(Square(row=r, col=c))
                    break
                moves.append(Square(row=r, col=c))
                r += dr
                c += dc

    elif piece.type == PieceType.QUEEN:
        # Combination of bishop and rook moves
        directions = [(-1, -1), (-1, 1), (1, -1), (1, 1),
                     (-1, 0), (1, 0), (0, -1), (0, 1)]
        for dr, dc in directions:
            r, c = row + dr, col + dc
            while is_valid_square(r, c):
                target = board[r][c]
                if target:
                    if target.color != piece.color:
                        moves.append(Square(row=r, col=c))
                    break
                moves.append(Square(row=r, col=c))
                r += dr
                c += dc

    elif piece.type == PieceType.KING:
        # One square in any direction
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                if dr == 0 and dc == 0:
                    continue
                r, c = row + dr, col + dc
                if is_valid_square(r, c):
                    target = board[r][c]
                    if not target or target.color != piece.color:
                        moves.append(Square(row=r, col=c))

    return moves


def execute_move(board: BoardState, move: Move) -> BoardState:
    """Execute a move on the board"""
    new_board = BoardState([row[:] for row in board])

    # Move the piece
    piece = new_board[move.from_.row][move.from_.col]
    new_board[move.from_.row][move.from_.col] = None
    new_board[move.to.row][move.to.col] = piece

    # Handle promotion
    if move.is_promotion and move.promotion_piece:
        new_board[move.to.row][move.to.col] = Piece(
            type=move.promotion_piece,
            color=piece.color
        )

    return new_board


def count_pieces(board: BoardState) -> Dict[str, int]:
    """Count pieces for each color"""
    white = black = 0
    for row in board:
        for piece in row:
            if piece:
                if piece.color == PieceColor.WHITE:
                    white += 1
                else:
                    black += 1
    return {"white": white, "black": black}


def should_promote(piece: Piece, target_row: int) -> bool:
    """Check if a pawn should promote"""
    if piece.type != PieceType.PAWN:
        return False
    return (piece.color == PieceColor.WHITE and target_row == 0) or \
           (piece.color == PieceColor.BLACK and target_row == 7)


def get_board_hash(board: BoardState, current_turn: PieceColor, must_capture: bool) -> str:
    """Generate a hashable string representaton of the board state"""
    board_str = ""
    for row in board:
        for piece in row:
            if piece:
                board_str += f"{piece.type[0]}{piece.color[0]}"
            else:
                board_str += ".."
        board_str += "|"
    return f"{board_str}:{current_turn[0]}:{must_capture}"


def check_game_over(game_state) -> Optional[Tuple[str, Optional[Player]]]:
    """Check if the game is over and return (status, winner)"""
    piece_count = count_pieces(game_state.board)
    
    # 1. Win by losing all pieces
    if piece_count["white"] == 0:
        winner = next((p for p in game_state.players if p.color == PieceColor.WHITE), None)
        return (GameStatus.WIN, winner)
    if piece_count["black"] == 0:
        winner = next((p for p in game_state.players if p.color == PieceColor.BLACK), None)
        return (GameStatus.WIN, winner)
        
    # 2. Check stalemate (no legal moves for current player)
    current_color = game_state.current_turn
    has_moves = False
    for row in range(8):
        for col in range(8):
            piece = game_state.board[row][col]
            if piece and piece.color == current_color:
                moves = get_legal_moves(game_state.board, Square(row=row, col=col))
                
                # Filter if must capture
                if game_state.take_me_state.must_capture:
                    moves = [m for m in moves if any(cp.row == m.row and cp.col == m.col 
                                                   for cp in game_state.take_me_state.capturable_pieces)]
                
                if moves:
                    has_moves = True
                    break
        if has_moves:
            break
            
    if not has_moves:
        # Stalemate - In Take-Me Chess, the player with no moves wins!
        winner = next((p for p in game_state.players if p.color == current_color), None)
        return (GameStatus.WIN, winner)
        
    # 3. Threefold Repetition
    current_hash = get_board_hash(game_state.board, game_state.current_turn, game_state.take_me_state.must_capture)
    count = 0
    for h in game_state.position_history:
        if h == current_hash:
            count += 1
    
    if count >= 3:
        return (GameStatus.DRAW, None)
        
    return None


def check_stalemate(board: BoardState, color: PieceColor) -> bool:
    """Check if the current player is in stalemate"""
    # Simplified check - no legal moves
    for row in range(8):
        for col in range(8):
            piece = board[row][col]
            if piece and piece.color == color:
                moves = get_legal_moves(board, Square(row=row, col=col))
                if moves:
                    return False
    return True


def find_exposed_pieces(board: BoardState, color: PieceColor) -> List[Square]:
    """Find pieces that are under attack"""
    exposed = []
    enemy_color = PieceColor.BLACK if color == PieceColor.WHITE else PieceColor.WHITE

    for row in range(8):
        for col in range(8):
            piece = board[row][col]
            if piece and piece.color == color:
                # Check if any enemy piece can capture this piece
                enemy_can_capture = False
                for enemy_row in range(8):
                    for enemy_col in range(8):
                        enemy_piece = board[enemy_row][enemy_col]
                        if enemy_piece and enemy_piece.color == enemy_color:
                            enemy_moves = get_legal_moves(board, Square(row=enemy_row, col=enemy_col))
                            if any(move.row == row and move.col == col for move in enemy_moves):
                                enemy_can_capture = True
                                break
                    if enemy_can_capture:
                        break

                if enemy_can_capture:
                    exposed.append(Square(row=row, col=col))

    return exposed


def get_capturable_pieces_after_take_me(board: BoardState, attacker_color: PieceColor) -> List[Square]:
    """Get pieces that can be captured after Take Me! declaration"""
    capturable_squares = set()

    for row in range(8):
        for col in range(8):
            piece = board[row][col]
            if piece and piece.color == attacker_color:
                moves = get_legal_moves(board, Square(row=row, col=col))
                for move in moves:
                    target = board[move.row][move.col]
                    if target and target.color != attacker_color:
                        capturable_squares.add(f"{move.row},{move.col}")

    return [Square(row=int(key.split(',')[0]), col=int(key.split(',')[1]))
            for key in capturable_squares]


def get_capture_moves(board: BoardState, color: PieceColor) -> List[Tuple[Square, Square]]:
    """Get all possible capture moves for a color"""
    captures = []

    for row in range(8):
        for col in range(8):
            piece = board[row][col]
            if piece and piece.color == color:
                moves = get_legal_moves(board, Square(row=row, col=col))
                for move in moves:
                    target = board[move.row][move.col]
                    if target and target.color != color:
                        captures.append((Square(row=row, col=col), move))

    return captures