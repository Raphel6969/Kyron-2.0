---
name: security-baseline
description: Load this skill in Phase 0/1 or during /harden to enforce docs/SECURITY.md, implement server-side tenant authorization, write tenant-isolation tests, validate boundary inputs, and clean secrets.
---

# WHEN TO LOAD
Load during Phase 0 to establish the security foundation, during Phase 1 when creating endpoints, and during `/harden` to ensure no security holes exist.

# INPUTS
- `docs/SECURITY.md` (Security specifications and rules)
- Backend source code (`backend/` or `src/`)
- Test suite (`tests/`)

# OUTPUTS
- Server-side tenant authorization middleware / dependency
- Automated test proving User A cannot access User B's data
- Boundary input validation schemas (Pydantic / Zod)
- Green execution of `scripts/checks/hardening-gate.sh`

# EXECUTION PROTOCOL

1. **Implement Server-Side Authorization:**
   Enforce tenant and user authorization strictly on the server:
   - Extract `tenant_id` and `user_id` from verified session tokens, never from unauthenticated request bodies or query params.
   - Inject tenant filter into every database query (`WHERE tenant_id = :current_tenant_id`).

2. **Author the Mandatory Tenant-Isolation Unit Test:**
   Write an automated test in `tests/test_authz.py` (or language equivalent):
   - Seed Tenant A and Tenant B with separate resource records.
   - Attempt to read, update, and delete Tenant B's resource using Tenant A's token.
   - **Assertion:** System must reject the request with HTTP 403 Forbidden or HTTP 404 Not Found.

3. **Enforce Boundary Input Validation:**
   - Every endpoint must define strict request schemas with field types and length limits.
   - Invalid payloads must return structured HTTP 400 Bad Request responses.
   - Unhandled exceptions producing HTTP 500 on malformed input are strictly forbidden.

4. **Audit Secrets & Environment Hygiene:**
   - Confirm `.env` is listed in `.gitignore` and not tracked in git.
   - Confirm all required environment variables are listed with dummy values in `.env.example`.
   - Confirm zero hardcoded passwords, tokens, or private keys exist in source files.

# EXIT CRITERIA
- [ ] Tenant-isolation unit test written and passing
- [ ] Boundary validation returns 4xx on invalid payloads
- [ ] No secrets tracked in git repository
- [ ] `bash scripts/checks/hardening-gate.sh` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
