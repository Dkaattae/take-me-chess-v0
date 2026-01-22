from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict
from datetime import datetime
from models import *
from database import db
from game_logic import get_legal_moves, execute_move, should_promote, check_game_over, count_pieces, get_capture_moves, find_exposed_pieces, get_capturable_pieces_after_take_me, get_board_hash
from bot import get_bot_move

app = FastAPI(
    title="Take-Me Chess API",
    description="Backend API for Take-Me Chess game",
    version="1.0.0"
)

def update_leaderboard_on_game_over(game_state: GameState):
    """Update leaderboard entries for all human players when game ends"""
    if game_state.status not in [GameStatus.WIN, GameStatus.DRAW]:
        return

    # Map game mode
    game_mode = GameMode.SINGLE_PLAYER if any(p.is_bot for p in game_state.players) else GameMode.TWO_PLAYER

    for player in game_state.players:
        if player.is_bot:
            continue
            
        wins = 0
        losses = 0
        draws = 0
        
        if game_state.status == GameStatus.DRAW:
            draws = 1
        elif game_state.winner and game_state.winner.id == player.id:
            wins = 1
        else:
            losses = 1
            
        entry = LeaderboardEntry(
            player_name=player.name,
            wins=wins,
            losses=losses,
            draws=draws,
            score=player.score,
            game_mode=game_mode,
            last_played=datetime.now()
        )
        db.add_leaderboard_entry(entry)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint for debugging"""
    return {
        "message": "Take-Me Chess API is running",
        "endpoints": ["/health", "/games", "/leaderboard"]
    }


@app.post("/games", response_model=GameState)
async def create_game(request: CreateGameRequest):
    """Create a new game session"""
    try:
        game_state = db.create_game(request.game_mode, request.players)
        return game_state
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create game: {str(e)}")


@app.get("/games/{game_id}", response_model=GameState)
async def get_game(game_id: str):
    """Get game state"""
    game_state = db.get_game(game_id)
    if not game_state:
        raise HTTPException(status_code=404, detail="Game not found")
    return game_state


@app.delete("/games/{game_id}")
async def end_game(game_id: str):
    """End game session"""
    game_state = db.get_game(game_id)
    if not game_state:
        raise HTTPException(status_code=404, detail="Game not found")

    success = db.delete_game(game_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to end game")

    return {
        "message": "Game ended successfully",
        "final_state": game_state
    }


@app.post("/games/{game_id}/moves", response_model=GameState)
async def make_move(game_id: str, request: MakeMoveRequest):
    """Make a move"""
    game_state = db.get_game(game_id)
    if not game_state:
        raise HTTPException(status_code=404, detail="Game not found")

    if game_state.status != GameStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Game is not active")

    # Check if it's the player's turn
    piece = game_state.board[request.from_.row][request.from_.col]
    if not piece or piece.color != game_state.current_turn:
        raise HTTPException(status_code=403, detail="Not your turn")

    # Validate the move
    legal_moves = get_legal_moves(game_state.board, request.from_)
    if not any(move.row == request.to.row and move.col == request.to.col for move in legal_moves):
        raise HTTPException(status_code=400, detail="Invalid move")

    # Filter moves if must capture
    if game_state.take_me_state.must_capture:
        capturable_moves = [move for move in legal_moves
                           if any(cp.row == move.row and cp.col == move.col
                                 for cp in game_state.take_me_state.capturable_pieces)]
        if not any(move.row == request.to.row and move.col == request.to.col for move in capturable_moves):
            raise HTTPException(status_code=400, detail="Must capture exposed piece")

    # Create the move
    captured_piece = game_state.board[request.to.row][request.to.col]
    move = Move(
        from_=request.from_,
        to=request.to,
        piece=piece,
        captured_piece=captured_piece,
        is_promotion=should_promote(piece, request.to.row),
        promotion_piece=request.promotion_piece if should_promote(piece, request.to.row) else None
    )

    # Execute the move
    new_board = execute_move(game_state.board, move)
    new_piece_count = count_pieces(new_board)

    # Update game state
    next_turn = PieceColor.BLACK if game_state.current_turn == PieceColor.WHITE else PieceColor.WHITE
    
    # New state after the move
    new_take_me_state = TakeMeState(declared=False, exposed_pieces=[], capturable_pieces=[], must_capture=False)
    new_position_hash = get_board_hash(new_board, next_turn, new_take_me_state.must_capture)
    new_position_history = game_state.position_history + [new_position_hash]

    # Check game over with NEW state
    game_over = check_game_over(game_state.copy(update={
        "board": new_board, 
        "current_turn": next_turn, 
        "take_me_state": new_take_me_state,
        "position_history": new_position_history
    }))
    
    updated_game = game_state.copy(update={
        "board": new_board,
        "current_turn": next_turn,
        "selected_piece": None,
        "legal_moves": [],
        "message": None,
        "move_history": game_state.move_history + [move],
        "position_history": new_position_history,
        "take_me_state": new_take_me_state,
        "piece_count": new_piece_count,
        "status": game_over[0] if game_over else GameStatus.ACTIVE,
        "winner": game_over[1] if game_over else None,
        "updated_at": datetime.now()
    })

    db.update_game(updated_game)
    
    if game_over:
        update_leaderboard_on_game_over(updated_game)
    
    # If next player is bot, make bot move
    if not game_over and any(p.is_bot and p.color == next_turn for p in updated_game.players):
        await get_bot_move_endpoint(game_id)
        # Fetch the latest state after bot move
        final_game_state = db.get_game(game_id)
        return final_game_state if final_game_state else updated_game

    return updated_game


@app.post("/games/{game_id}/moves/validate", response_model=ValidationResponse)
async def validate_move(game_id: str, request: MakeMoveRequest):
    """Validate a potential move"""
    game_state = db.get_game(game_id)
    if not game_state:
        raise HTTPException(status_code=404, detail="Game not found")

    piece = game_state.board[request.from_.row][request.from_.col]
    if not piece or piece.color != game_state.current_turn:
        return ValidationResponse(valid=False, error="Not your turn")

    legal_moves = get_legal_moves(game_state.board, request.from_)

    # Filter for must capture
    if game_state.take_me_state.must_capture:
        legal_moves = [move for move in legal_moves
                      if any(cp.row == move.row and cp.col == move.col
                            for cp in game_state.take_me_state.capturable_pieces)]

    is_valid = any(move.row == request.to.row and move.col == request.to.col for move in legal_moves)

    return ValidationResponse(
        valid=is_valid,
        legal_moves=legal_moves,
        error=None if is_valid else "Invalid move"
    )


@app.post("/games/{game_id}/take-me", response_model=GameState)
async def declare_take_me(game_id: str, request: DeclareTakeMeRequest):
    """Declare Take Me!"""
    game_state = db.get_game(game_id)
    if not game_state:
        raise HTTPException(status_code=404, detail="Game not found")

    if game_state.status != GameStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Game is not active")

    piece = game_state.board[request.from_.row][request.from_.col]
    if not piece or piece.color != game_state.current_turn:
        raise HTTPException(status_code=403, detail="Not your turn")

    # Validate the move
    legal_moves = get_legal_moves(game_state.board, request.from_)
    if not any(move.row == request.to.row and move.col == request.to.col for move in legal_moves):
        raise HTTPException(status_code=400, detail="Invalid move")

    # Create the move
    captured_piece = game_state.board[request.to.row][request.to.col]
    move = Move(
        from_=request.from_,
        to=request.to,
        piece=piece,
        captured_piece=captured_piece,
        is_promotion=should_promote(piece, request.to.row),
        promotion_piece=request.promotion_piece if should_promote(piece, request.to.row) else None
    )

    # Execute the move
    new_board = execute_move(game_state.board, move)
    new_piece_count = count_pieces(new_board)

    # Find exposed pieces and capturable pieces
    exposed_pieces = find_exposed_pieces(new_board, game_state.current_turn)
    next_turn_color = PieceColor.BLACK if game_state.current_turn == PieceColor.WHITE else PieceColor.WHITE
    capturable_pieces = get_capturable_pieces_after_take_me(new_board, next_turn_color)

    # Update game state
    next_turn = PieceColor.BLACK if game_state.current_turn == PieceColor.WHITE else PieceColor.WHITE
    
    new_take_me_state = TakeMeState(
        declared=True,
        declarer=game_state.current_turn,
        exposed_pieces=exposed_pieces,
        capturable_pieces=capturable_pieces,
        must_capture=len(capturable_pieces) > 0
    )

    # CHECK FOR PENALTY: "Take Me!" but no captures possible
    message = None
    if len(capturable_pieces) == 0:
        new_take_me_state.declared = False # Reset declaration
        message = "take who??"
        # Deduct 5 points from the current player
        for p in game_state.players:
            if p.color == game_state.current_turn:
                p.score -= 5
                break
    new_position_hash = get_board_hash(new_board, next_turn, new_take_me_state.must_capture)
    new_position_history = game_state.position_history + [new_position_hash]

    # Check game over
    game_over = check_game_over(game_state.copy(update={
        "board": new_board, 
        "current_turn": next_turn,
        "take_me_state": new_take_me_state,
        "position_history": new_position_history
    }))

    updated_game = game_state.copy(update={
        "board": new_board,
        "current_turn": next_turn,
        "selected_piece": None,
        "legal_moves": [],
        "take_me_state": new_take_me_state,
        "message": message,
        "move_history": game_state.move_history + [move],
        "position_history": new_position_history,
        "piece_count": new_piece_count,
        "status": game_over[0] if game_over else GameStatus.ACTIVE,
        "winner": game_over[1] if game_over else None,
        "updated_at": datetime.now()
    })

    db.update_game(updated_game)
    
    if game_over:
        update_leaderboard_on_game_over(updated_game)
    
    # If next player is bot, make bot move
    if not game_over and any(p.is_bot and p.color == next_turn for p in updated_game.players):
        await get_bot_move_endpoint(game_id)
        # Fetch the latest state after bot move
        final_game_state = db.get_game(game_id)
        return final_game_state if final_game_state else updated_game

    return updated_game


@app.post("/games/{game_id}/bot-move")
async def get_bot_move_endpoint(game_id: str):
    """Get bot move"""
    game_state = db.get_game(game_id)
    if not game_state:
        raise HTTPException(status_code=404, detail="Game not found")

    if game_state.status != GameStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Game is not active")

    # Find bot player
    bot_player = next((p for p in game_state.players if p.is_bot and p.color == game_state.current_turn), None)
    if not bot_player:
        raise HTTPException(status_code=403, detail="Not bot's turn")

    # Get bot move
    bot_result = get_bot_move(
        game_state.board,
        game_state.current_turn,
        game_state.take_me_state.must_capture,
        game_state.take_me_state.capturable_pieces
    )

    if not bot_result:
        # Bot has no moves - end game
        updated_game = game_state.copy(update={
            "status": GameStatus.DRAW,
            "updated_at": datetime.now()
        })
        db.update_game(updated_game)
        return {
            "gameState": updated_game,
            "botMove": None
        }

    # Execute bot move
    new_board = execute_move(game_state.board, bot_result.move)
    new_piece_count = count_pieces(new_board)

    # Update take me state if bot declared
    take_me_state = TakeMeState(declared=False, exposed_pieces=[], capturable_pieces=[], must_capture=False)
    if bot_result.declare_take_me:
        exposed_pieces = find_exposed_pieces(new_board, game_state.current_turn)
        next_turn_color = PieceColor.BLACK if game_state.current_turn == PieceColor.WHITE else PieceColor.WHITE
        capturable_pieces = get_capturable_pieces_after_take_me(new_board, next_turn_color)
        take_me_state = TakeMeState(
            declared=True,
            declarer=game_state.current_turn,
            exposed_pieces=exposed_pieces,
            capturable_pieces=capturable_pieces,
            must_capture=len(capturable_pieces) > 0
        )

    # Check game over after bot move
    next_turn = PieceColor.BLACK if game_state.current_turn == PieceColor.WHITE else PieceColor.WHITE
    new_position_hash = get_board_hash(new_board, next_turn, take_me_state.must_capture)
    new_position_history = game_state.position_history + [new_position_hash]

    game_over = check_game_over(game_state.copy(update={
        "board": new_board, 
        "current_turn": next_turn, 
        "take_me_state": take_me_state,
        "position_history": new_position_history
    }))

    updated_game = game_state.copy(update={
        "board": new_board,
        "current_turn": next_turn,
        "selected_piece": None,
        "legal_moves": [],
        "take_me_state": take_me_state,
        "move_history": game_state.move_history + [bot_result.move],
        "position_history": new_position_history,
        "piece_count": new_piece_count,
        "status": game_over[0] if game_over else GameStatus.ACTIVE,
        "winner": game_over[1] if game_over else None,
        "updated_at": datetime.now()
    })

    db.update_game(updated_game)

    if game_over:
        update_leaderboard_on_game_over(updated_game)

    return {
        "gameState": updated_game,
        "botMove": bot_result
    }


@app.get("/games/{game_id}/legal-moves")
async def get_legal_moves_endpoint(
    game_id: str,
    row: int = Query(..., ge=0, le=7),
    col: int = Query(..., ge=0, le=7)
):
    """Get legal moves for a piece"""
    game_state = db.get_game(game_id)
    if not game_state:
        raise HTTPException(status_code=404, detail="Game not found")

    square = Square(row=row, col=col)
    legal_moves = get_legal_moves(game_state.board, square)

    # Filter for must capture
    if game_state.take_me_state.must_capture:
        legal_moves = [move for move in legal_moves
                      if any(cp.row == move.row and cp.col == move.col
                            for cp in game_state.take_me_state.capturable_pieces)]

    return {"legal_moves": legal_moves}


@app.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    game_mode: Optional[GameMode] = None,
    limit: int = Query(10, ge=1, le=100)
):
    """Get leaderboard"""
    return db.get_leaderboard(game_mode, limit)


@app.post("/leaderboard")
async def submit_game_result(entry: LeaderboardEntry):
    """Submit game result"""
    db.add_leaderboard_entry(entry)
    return {
        "message": "Game result recorded successfully",
        "updated_leaderboard": db.get_leaderboard(limit=10)
    }


@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
