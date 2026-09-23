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

1. **Priority-Resolved Service & Stack Mapping:**
   Read `docs/02-solution.md → ## Infrastructure Stack` to determine languages and frameworks.
   Apply this resolution order — highest wins:

   | Priority | Source | Condition |
   |---|---|---|
   | 🥇 1st | User-specified | User named a specific language/framework at Step 3 checkpoint |
   | 🥈 2nd | Scaffold template default | Python/FastAPI + React/Vite if no user override |
   | 🥉 3rd | PS-inferred | Only if both above are absent |

   Map resolved values to service roles:
   - **Public API / Proxy Layer:** `<resolved from Infrastructure Stack>` (port 8000)
   - **Computation / Engine Layer:** `<resolved from Infrastructure Stack>` (port 8080 if separate)
   - **Client Presentation:** `<resolved from Infrastructure Stack>` (port 3000)
   - **Persistent Storage:** PostgreSQL 16+ — non-negotiable regardless of user choice

   Every service in `ARCHITECTURE.md` must list its `[source: user-specified / template-default / ps-inferred]` tag so the choice is auditable.

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
