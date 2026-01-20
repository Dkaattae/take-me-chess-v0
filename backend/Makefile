.PHONY: help setup install run dev test test-watch clean lint format

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

setup: ## Set up the development environment
	uv sync

install: ## Install dependencies (alias for setup)
	uv sync

run: ## Run the FastAPI server
	uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev: ## Run the development server (alias for run)
	uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

test: ## Run all tests
	uv run pytest test_api.py -v

test-watch: ## Run tests in watch mode
	uv run pytest test_api.py -v --watch

test-coverage: ## Run tests with coverage report
	uv run pytest test_api.py --cov=. --cov-report=html

clean: ## Clean up cache files and virtual environment
	rm -rf .pytest_cache
	rm -rf __pycache__
	rm -rf .venv
	rm -f uv.lock

lint: ## Run linting (if ruff is available)
	uv run ruff check . || echo "Ruff not installed. Install with: uv add ruff"

format: ## Format code (if ruff is available)
	uv run ruff format . || echo "Ruff not installed. Install with: uv add ruff"

add-dep: ## Add a new dependency (usage: make add-dep PACKAGE=package-name)
	@if [ -z "$(PACKAGE)" ]; then \
		echo "Usage: make add-dep PACKAGE=package-name"; \
		exit 1; \
	fi
	uv add $(PACKAGE)

server: ## Run server without reload (production-like)
	uv run uvicorn main:app --host 0.0.0.0 --port 8000

docs: ## Generate API documentation
	@echo "API docs available at: http://localhost:8000/docs"
	@echo "Alternative docs at: http://localhost:8000/redoc"