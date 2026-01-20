# Take-Me Chess Backend

FastAPI backend for the Take-Me Chess game.

## Quick Start

1. **Set up the environment:**
   ```bash
   make setup
   ```

2. **Run the development server:**
   ```bash
   make run
   ```

3. **Run tests:**
   ```bash
   make test
   ```

## Available Commands

Run `make help` to see all available commands, or use:

- `make setup` - Set up development environment
- `make run` - Run development server with auto-reload
- `make test` - Run all tests
- `make test-watch` - Run tests in watch mode
- `make clean` - Clean cache files and virtual environment
- `make add-dep PACKAGE=package-name` - Add a new dependency

## API Documentation

When the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Development

The backend uses:
- **uv** for dependency management
- **FastAPI** for the web framework
- **Pydantic** for data validation
- **pytest** for testing
- **uvicorn** as the ASGI server
