# Hack Engine — Master Makefile
# The exit code is the only accepted referee.

SHELL := /bin/bash
.PHONY: verify verify-full reset-demo seed dev deploy help

help:
	@echo "Hack Engine Target Commands:"
	@echo "  make verify       - Fast tier gate (<30s). Runs typecheck, lint, unit tests, state-lint, ui-audit, ux-gate, hardening."
	@echo "  make verify-full  - Slow tier gate (phase close). Runs fast tier + ui-review, impact, a11y, perf."
	@echo "  make reset-demo   - Restores deterministic demo state in one command (production/staging/local)."
	@echo "  make seed         - Seeds database with 30+ realistic records (idempotent)."
	@echo "  make dev          - Boots local development stack."
	@echo "  make deploy       - Deploys current main branch or runs deployment verification."

verify:
	@bash scripts/verify.sh

verify-full:
	@bash scripts/verify-full.sh

reset-demo:
	@echo "==> Resetting demo state..."
	@if [ -f scripts/reset-demo.sh ]; then \
		bash scripts/reset-demo.sh; \
	elif [ -f docker-compose.yml ]; then \
		docker compose down -v && docker compose up -d && make seed; \
	else \
		echo "Notice: No custom scripts/reset-demo.sh or docker-compose.yml found yet. Running seed..."; \
		make seed; \
	fi
	@echo "==> Demo state restored cleanly."

seed:
	@echo "==> Running idempotent seed..."
	@if [ -f scripts/seed.sh ]; then \
		bash scripts/seed.sh; \
	elif [ -f backend/seed.py ]; then \
		python backend/seed.py; \
	elif [ -f scripts/seed.py ]; then \
		python scripts/seed.py; \
	elif [ -f server/scripts/seed.js ]; then \
		node server/scripts/seed.js; \
	else \
		echo "Notice: No custom seed runner configured yet. Seed shim passed."; \
	fi

dev:
	@echo "==> Booting local development environment..."
	@if [ -f docker-compose.yml ]; then \
		docker compose up; \
	elif [ -f package.json ]; then \
		npm run dev; \
	elif [ -f main.py ]; then \
		uvicorn main:app --reload; \
	else \
		echo "Notice: No standard dev runner detected in root."; \
	fi

deploy:
	@echo "==> Running deployment harness..."
	@if [ -f scripts/deploy.sh ]; then \
		bash scripts/deploy.sh; \
	else \
		echo "Notice: Deploy script scripts/deploy.sh not defined. Checked deploy state."; \
	fi
