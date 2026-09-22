---
name: architecture
description: Load this skill after solution-design and impact-model to define system topology, establish polyglot service boundaries, log ADR-000, and generate ARCHITECTURE.md, API.md, and SCHEMA.md.
---

# WHEN TO LOAD
Load during the `/ps` workflow after `solution-design` and `impact-model` are approved, or whenever a major architectural pivot or new service boundary is introduced.

# INPUTS
- `docs/02-solution.md` (Approved technical moat)
- `docs/IMPACT.md` (Quantified value model)
- `.agents/templates/ARCHITECTURE.md`, `API.md`, `SCHEMA.md`, `DECISIONS.md`

# OUTPUTS
- Instantiated `ARCHITECTURE.md` (strict 200-line ceiling)
- Instantiated `API.md` (endpoint registry with `/healthz` and `/impact`)
- Instantiated `SCHEMA.md` (database models and index declarations)
- `DECISIONS.md` initialized with ADR-000 (core stack selection)

# EXECUTION PROTOCOL

1. **Service Decomposition & Stack Mapping:**
   Map responsibilities to proven historical defaults:
   - **Public API / Proxy Layer:** Python FastAPI or Go/Chi (port 8000).
   - **High-Performance Engine / Solver:** Rust Axum or Go worker (port 8080 or 8090).
   - **Client Presentation:** React 18 + Vite or Next.js 14 (port 3000).
   - **Persistent Storage:** PostgreSQL 16+ (Supabase / Neon / Docker Compose).

2. **Establish the Service Trust Boundary Matrix:**
   Document in `ARCHITECTURE.md` which service can read which tables and secrets:
   - Client never sees database URLs, private keys, or raw external tokens.
   - Core computational service has isolated data access.
   - Tenant isolation enforced strictly at the database layer.

3. **Instantiate API & Schema Contracts:**
   - Define `/healthz` deep check (DB + upstream).
   - Define `/impact` endpoint schema returning quantified metrics from DB.
   - Define all entity tables in `SCHEMA.md` with required indexes on foreign keys and filters.

4. **Record ADR-000 in `DECISIONS.md`:**
   Document why the chosen tech stack was selected, alternatives rejected, and accepted trade-offs.

5. **Enforce File Limits:**
   Confirm `ARCHITECTURE.md` does not exceed 200 lines.

# EXIT CRITERIA
- [ ] `ARCHITECTURE.md` instantiated and <= 200 lines
- [ ] `API.md` and `SCHEMA.md` populated with `/healthz` and `/impact`
- [ ] `DECISIONS.md` contains ADR-000
- [ ] `make verify` exits 0

# NEXT
Execute `phase-planner` skill.
