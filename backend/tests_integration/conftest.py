import pytest
import os
import sys
from fastapi.testclient import TestClient

# Add parent directory to path so we can import backend modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import database
import main
from database import SQLAlchemyDatabase

@pytest.fixture(scope="session")
def test_db_url():
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "test_take_me_chess.db"))
    return f"sqlite:///{db_path}"

@pytest.fixture(scope="function")
def test_db(test_db_url):
    # Setup
    test_database = SQLAlchemyDatabase(test_db_url)
    
    # Save original db reference
    original_db = database.db
    original_main_db = getattr(main, 'db', None)
    
    # Patch the global db instances
    database.db = test_database
    main.db = test_database
    
    # Ensure tables are created and clean
    test_database.clear_database()
    
    yield test_database
    
    # Teardown
    database.db = original_db
    if original_main_db:
        main.db = original_main_db
    
    # Remove test db file
    db_path = test_db_url.replace("sqlite:///", "")
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
        except PermissionError:
            pass # SQLite might still have a lock

@pytest.fixture(scope="function")
def client(test_db):
    from main import app
    return TestClient(app)
