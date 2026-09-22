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
   Copy the pre-debugged template matching ADR-000 into the active project workspace:
   - `templates/stack-fastapi-react` for Python FastAPI backend + React/Vite frontend.
   - `templates/stack-polyglot` for Python API + Go Gateway + Rust Engine + Next.js.
   - `templates/stack-node-react` for Node.js ESM Express backend + React/Vite frontend.

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
