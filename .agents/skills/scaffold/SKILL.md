---
name: scaffold
description: Load this skill in Phase 0 to instantiate the project code structure from a pre-debugged stack template, verify green make verify on second zero, and initialize the database with migrations and seeds.
---

# WHEN TO LOAD
Load during Phase 0 execution, or when bootstrapping a new hackathon project repository from the selected stack template.

# INPUTS
- Target stack selection from ADR-000 (`stack-fastapi-react`, `stack-polyglot`, or `stack-node-react`)
- `templates/stack-<name>/` pre-debugged skeleton
- `.env.example` template

# OUTPUTS
- Working code skeleton in project root
- Functional `docker-compose.yml` spinning up PostgreSQL and services
- Green `make verify` run out of the box
- Verified `/healthz` endpoint returning HTTP 200

# EXECUTION PROTOCOL

1. **Select and Copy the Stack Skeleton:**
   Read `docs/02-solution.md → ## Infrastructure Stack` for the resolved stack.

   **Fast path (< 5 min to green) — use if stack matches a pre-built template:**
   - `templates/stack-fastapi-react` → Python FastAPI backend + React 18/Vite frontend
   - `templates/stack-polyglot` → Python API + Go Gateway + Rust Engine + Next.js
   - `templates/stack-node-react` → Node.js ESM Express backend + React/Vite frontend

   Copy the matching template into the active project workspace.

   **Custom stack path (10–15 min to green) — use if no template matches:**
   If ADR-000 specifies a language/framework not covered by the 3 templates, generate a minimal skeleton from scratch:
   - Correct folder structure for the chosen stack (e.g. `src/`, `app/`, `cmd/`)
   - `docker-compose.yml` spinning up PostgreSQL 16+ and the application service
   - One `GET /healthz` endpoint in the chosen language returning `{"status": "ok", "db": "connected"}`
   - One baseline migration file (language-appropriate: Alembic, Flyway, golang-migrate, node-pg-migrate, etc.)
   - Working `Makefile` with `verify`, `dev`, `deploy`, `seed`, `reset-demo` targets
   - Target: `make verify` exits 0 within 15 minutes

2. **Environment & Secrets Setup:**
   - Copy `.env.example` to `.env`.
   - Verify that `.env` is listed in `.gitignore` (hardening-gate requirement).
   - Ensure `DATABASE_URL` points to PostgreSQL (e.g. `postgresql://postgres:postgres@localhost:5432/app_db`), never SQLite.
   - If real keys are missing, populate mock defaults and append required keys to `NEEDS_YOU.md`.

3. **Verify Database Connectivity & Migrations:**
   - Boot database container: `docker compose up -d db` (or Postgres container).
   - Run baseline migration: `alembic upgrade head` or `npm run db:migrate` or `go run ./migrations`.
   - Confirm tables match `SCHEMA.md`.

4. **Execute Baseline Seed:**
   - Run seed script (`make seed`).
   - Confirm at least 30 realistic domain records are loaded.

5. **Verify Baseline Health:**
   - Start development server in background.
   - Query `/healthz`: verify HTTP 200 and database connected status.

6. **Execute Fast-Tier Gate:**
   - Run `make verify`. Must exit 0 cleanly on the fresh scaffold.

# EXIT CRITERIA
- [ ] Working project skeleton present in repository
- [ ] Database running with migrations applied and 30+ seed rows present
- [ ] `curl -f http://localhost:8000/healthz` (or service port) returns 200 OK
- [ ] `make verify` exits 0
- [ ] `STATE.md` updated: Phase 0 sub-task complete

# NEXT
Run `make verify`, update `STATE.md`, commit.
