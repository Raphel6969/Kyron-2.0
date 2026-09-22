---
name: review-code-critic
description: Load this skill whenever conducting security and architecture code audits, reviewing pull requests, inspecting git diffs against SECURITY.md and dod.md, finding cross-tenant authorization holes, or hunting unhandled exceptions before closing a phase.
---

# WHEN TO LOAD
Load before every phase merge, during `/close-phase`, during `/harden`, or whenever completing backend endpoint and database schema implementations.

# INPUTS
- `git diff main...HEAD` (The active change set)
- `docs/SECURITY.md` (Tenant boundary and input validation rules)
- `docs/OPS.md` (Reliability, health checks, logging)
- `.agents/checklists/dod.md` (Definition of Done)

# OUTPUTS
- `docs/reviews/code-critic-<phase>.md` with prioritized findings citing exact `file:line` locations.

# PROTOCOL
1. **Analyze Full Diff:**
   Scan every changed file on the active branch against `SECURITY.md`.
2. **Priority 1 (Authorization):**
   Verify server-side authorization. Confirm no endpoint naively accepts `user_id` or `tenant_id` from unauthenticated client bodies without session token verification.
3. **Priority 2 (Data Integrity):**
   Ensure database updates are atomic (`withTransaction`). Verify database migration exists for every schema change.
4. **Priority 3 (Failure Resilience):**
   Confirm external API calls are wrapped in try/catch and feature-flagged with deterministic fallbacks.
5. **Priority 4 (Test Coverage):**
   Verify existence of unit tests covering both 2xx success and 4xx validation failure.
6. **Log Report:**
   Write findings to `docs/reviews/code-critic-<phase>.md`.

# EXIT CRITERIA
- [ ] `docs/reviews/code-critic-<phase>.md` logged
- [ ] Zero unhandled P1 (authz) or P2 (data loss) findings
- [ ] `bash scripts/checks/hardening-gate.sh` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
