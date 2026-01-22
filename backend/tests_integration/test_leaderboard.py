import pytest
from models import GameMode

class TestLeaderboardIntegration:
    def test_leaderboard_submission_and_retrieval(self, client):
        """Test submitting a result and retrieving it from leaderboard"""
        # 1. Submitting a result
        player_name = "TestPlayer123"
        submission_response = client.post("/leaderboard", json={
            "player_name": player_name,
            "wins": 1,
            "losses": 0,
            "draws": 0,
            "score": 100,
            "game_mode": "1P"
        })
        assert submission_response.status_code == 200
        
        # 2. Retrieving the leaderboard
        get_response = client.get("/leaderboard?game_mode=1P")
        assert get_response.status_code == 200
        leaderboard = get_response.json()
        
        # Find our player in the leaderboard
        player_entry = next((e for e in leaderboard if e["player_name"] == player_name), None)
        assert player_entry is not None
        assert player_entry["wins"] == 1
        assert player_entry["score"] == 100

    def test_leaderboard_filtering(self, client):
        """Test leaderboard filtering by game mode"""
        # Submit results for different modes
        client.post("/leaderboard", json={
            "player_name": "P1", "wins": 1, "losses": 0, "draws": 0, "score": 10, "game_mode": "1P"
        })
        client.post("/leaderboard", json={
            "player_name": "P2", "wins": 1, "losses": 0, "draws": 0, "score": 20, "game_mode": "2P"
        })
        
        # Get 1P leaderboard
        response_1p = client.get("/leaderboard", params={"game_mode": "1P"})
        data_1p = response_1p.json()
        assert all(e["game_mode"] == "1P" for e in data_1p)
        assert any(e["player_name"] == "P1" for e in data_1p)
        assert not any(e["player_name"] == "P2" for e in data_1p)
        
        # Get 2P leaderboard
        response_2p = client.get("/leaderboard", params={"game_mode": "2P"})
        data_2p = response_2p.json()
        assert all(e["game_mode"] == "2P" for e in data_2p)
        assert any(e["player_name"] == "P2" for e in data_2p)
        assert not any(e["player_name"] == "P1" for e in data_2p)

    def test_leaderboard_limit(self, client):
        """Test the limit parameter on leaderboard retrieval"""
        # Submit several results
        for i in range(15):
            client.post("/leaderboard", json={
                "player_name": f"User{i}", 
                "wins": i, 
                "losses": 0, 
                "draws": 0, 
                "score": i*10, 
                "game_mode": "1P"
            })
            
        # Get leaderboard with limit 5
        response = client.get("/leaderboard", params={"limit": 5})
        data = response.json()
        assert len(data) == 5
        # Should be ordered by wins descending
        assert data[0]["wins"] > data[4]["wins"]
