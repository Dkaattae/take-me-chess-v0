import pytest
from models import PieceColor, GameStatus

class TestTakeMeFlowDebug:
    def test_bot_declares_takeme_human_must_capture(self, client):
        """Test the flow where bot declares Take Me and human must capture"""
        # 1. Create a 1P game
        create_response = client.post("/games", json={
            "game_mode": "1P",
            "players": [{"name": "Human"}, {"name": "Bot", "is_bot": True}]
        })
        game_id = create_response.json()["id"]
        
        # 2. To simulate bot declaring Take Me, we need to find a move for the human 
        # that results in the bot having a move that exposes its pieces.
        # Initial board: White (Human) Pawns at Row 6, Black (Bot) Pawns at Row 1.
        
        # Human moves e2-e4
        client.post(f"/games/{game_id}/moves", json={"from": {"row": 6, "col": 4}, "to": {"row": 4, "col": 4}})
        
        # After human move, bot automatically moves.
        # We check if the human can now move.
        get_response = client.get(f"/games/{game_id}")
        state = get_response.json()
        
        print(f"\nDEBUG TEST: Current Turn: {state['current_turn']}")
        print(f"DEBUG TEST: Must Capture: {state['take_me_state']['must_capture']}")
        print(f"DEBUG TEST: Capturable Pieces: {state['take_me_state']['capturable_pieces']}")
        
        # 3. If must_capture is True, verify legal moves filtering as seen by endpoint
        # Find a piece of the human that SHOULD have a legal move if must_capture is True
        for r in range(8):
            for c in range(8):
                piece = state['board'][r][c]
                if piece and piece['color'] == state['current_turn']:
                    lm_response = client.get(f"/games/{game_id}/legal-moves?row={r}&col={c}")
                    lm_data = lm_response.json()
                    if state['take_me_state']['must_capture']:
                        # If must capture, verify that all returned moves ARE captures
                        for move in lm_data['legal_moves']:
                            target = state['board'][move['row']][move['col']]
                            assert target is not None
                            assert target['color'] != state['current_turn']
                    
        # 4. Verify that if must_capture is True, there is at least ONE piece with legal moves
        if state['take_me_state']['must_capture']:
            total_moves = 0
            for r in range(8):
                for c in range(8):
                    piece = state['board'][r][c]
                    if piece and piece['color'] == state['current_turn']:
                        lm_response = client.get(f"/games/{game_id}/legal-moves?row={r}&col={c}")
                        total_moves += len(lm_response.json()['legal_moves'])
            assert total_moves > 0, "Must capture is True but NO piece has legal capture moves!"
