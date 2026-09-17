.PHONY: help install dev test lint docker-up docker-down

help:
	@echo "MCPShield Developer Commands:"
	@echo "  make install     - Install Python and Node dependencies"
	@echo "  make dev-api     - Start FastAPI backend & MCP Gateway (Port 8000)"
	@echo "  make dev-web     - Start Web Management Console (Port 3000)"
	@echo "  make dev-mock    - Start Reference MCP Server (Port 8001)"
	@echo "  make test        - Run all Unit, Integration, and Security tests"
	@echo "  make docker-up   - Launch full stack via Docker Compose"
	@echo "  make docker-down - Teardown Docker Compose stack"

install:
	pip install -r requirements.txt
	cd apps/web && npm install
	npm link ./cli

dev-api:
	python -m uvicorn apps.api.main:app --host 127.0.0.1 --port 8000 --reload

dev-web:
	cd apps/web && npm run dev

dev-mock:
	python apps/mock_server/server.py

test:
	pytest -v

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down -v
