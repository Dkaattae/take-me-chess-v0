import pytest
from fastapi.testclient import TestClient
from main import app
from models import *
from database import db

client = TestClient(app)


class TestGameAPI:
    def setup_method(self):
        """Reset database before each test"""
        db.clear_database()

    def test_create_game(self):
        """Test creating a new game"""
        response = client.post("/games", json={
            "game_mode": "1P",
            "players": [
                {"name": "Player 1"},
                {"name": "", "is_bot": True}
            ]
        })

        assert response.status_code == 200
        data = response.json()
        assert data["id"].startswith("game_")
        assert data["status"] == "active"
        assert len(data["players"]) == 2
        assert data["players"][0]["name"] == "Player 1"
        assert data["players"][1]["is_bot"] == True

    def test_get_game(self):
        """Test getting a game"""
        # Create game first
        create_response = client.post("/games", json={
            "game_mode": "1P",
            "players": [
                {"name": "Player 1"},
                {"name": "", "is_bot": True}
            ]
        })
        game_id = create_response.json()["id"]

        # Get the game
        response = client.get(f"/games/{game_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == game_id

    def test_get_nonexistent_game(self):
        """Test getting a non-existent game"""
        response = client.get("/games/nonexistent")
        assert response.status_code == 404

    def test_make_move(self):
        """Test making a valid move"""
        # Create game
        create_response = client.post("/games", json={
            "game_mode": "1P",
            "players": [
                {"name": "Player 1"},
                {"name": "", "is_bot": True}
            ]
        })
        game_id = create_response.json()["id"]

        # Make a move (white pawn forward)
        response = client.post(f"/games/{game_id}/moves", json={
            "from": {"row": 6, "col": 4},  # e2
            "to": {"row": 4, "col": 4}     # e4
        })

        assert response.status_code == 200
        data = response.json()
        # Note: In 1P mode, the bot moves synchronously, so the turn might already be back to white
        assert data["current_turn"] == "white" 
        assert len(data["move_history"]) == 2 # Player move + Bot move

    def test_invalid_move(self):
        """Test making an invalid move"""
        # Create game
        create_response = client.post("/games", json={
            "game_mode": "1P",
            "players": [
                {"name": "Player 1"},
                {"name": "", "is_bot": True}
            ]
        })
        game_id = create_response.json()["id"]

        # Try to move opponent's piece
        response = client.post(f"/games/{game_id}/moves", json={
            "from": {"row": 1, "col": 4},  # e7 (black pawn)
            "to": {"row": 3, "col": 4}     # e5
        })

        assert response.status_code == 403

    def test_validate_move(self):
        """Test move validation"""
        # Create game
        create_response = client.post("/games", json={
            "game_mode": "1P",
            "players": [
                {"name": "Player 1"},
                {"name": "", "is_bot": True}
            ]
        })
        game_id = create_response.json()["id"]

        # Validate a valid move
        response = client.post(f"/games/{game_id}/moves/validate", json={
            "from": {"row": 6, "col": 4},  # e2
            "to": {"row": 4, "col": 4}     # e4
        })

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True

    def test_get_legal_moves(self):
        """Test getting legal moves for a piece"""
        # Create game
        create_response = client.post("/games", json={
            "game_mode": "1P",
            "players": [
                {"name": "Player 1"},
                {"name": "", "is_bot": True}
            ]
        })
        game_id = create_response.json()["id"]

        # Get legal moves for white pawn
        response = client.get(f"/games/{game_id}/legal-moves?row=6&col=4")

        assert response.status_code == 200
        data = response.json()
        assert "legal_moves" in data
        assert len(data["legal_moves"]) > 0

    def test_leaderboard(self):
        """Test leaderboard endpoints"""
        # Get leaderboard
        response = client.get("/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # Submit game result
        response = client.post("/leaderboard", json={
            "player_name": "TestPlayer",
            "wins": 1,
            "losses": 0,
            "draws": 0,
            "game_mode": "1P"
        })
        assert response.status_code == 200

    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_take_me_penalty(self):
        """Test the penalty for declaring Take Me when no pieces are capturable"""
        # Create game
        create_response = client.post("/games", json={
            "game_mode": "1P",
            "players": [
                {"name": "Player 1"},
                {"name": "", "is_bot": True}
            ]
        })
        game_id = create_response.json()["id"]

        # Declare Take Me without moving (initial state, no captures possible)
        # We need a valid move first because declare_take_me requires from/to
        # Let's move a pawn forward (no capture possible)
        response = client.post(f"/games/{game_id}/take-me", json={
            "from": {"row": 6, "col": 4},  # e2
            "to": {"row": 4, "col": 4}     # e4
        })

        assert response.status_code == 200
        data = response.json()
        
        # Declarer should be White (was first turn)
        # But since no pieces are capturable, exposed_pieces should be checked
        # and penalty applied if no one can capture white's pieces.
        
        # In this specific initial move e4, black cannot capture anything.
        assert data["message"] == "take who??"
        # Player score should be -5 (assuming it started at 0)
        white_player = next(p for p in data["players"] if p["color"] == "white")
        assert white_player["score"] == -5
        # take_me_state.declared should be False (as we reset it on penalty)
        assert data["take_me_state"]["declared"] == False


if __name__ == "__main__":
    pytest.main([__file__])