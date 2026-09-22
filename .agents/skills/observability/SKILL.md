---
name: observability
description: Load this skill to implement the deep /healthz endpoint, configure structured JSON logging with request IDs, integrate error tracking, and satisfy docs/OPS.md requirements.
---

# WHEN TO LOAD
Load during Phase 0 to set up health endpoints and logging infrastructure, or during `/harden` to verify runtime telemetry and error diagnostics.

# INPUTS
- `docs/OPS.md` (Operational specifications)
- Backend application entry point (`main.py`, `server.js`, or `cmd/main.go`)

# OUTPUTS
- Deep `/healthz` endpoint verifying database and upstream connectivity
- Structured JSON logging middleware with `request_id` correlation
- Verified test exception proving error capture without server crash

# EXECUTION PROTOCOL

1. **Implement Deep `/healthz` Endpoint:**
   Author a comprehensive health check:
   - Perform a live database ping (`SELECT 1`).
   - Check upstream service connectivity if configured.
   - Return HTTP 200 with component statuses:
     ```json
     {
       "status": "healthy",
       "checks": { "database": "ok" },
       "uptime_seconds": 3600,
       "timestamp": "2026-09-22T12:00:00Z"
     }
     ```
   - Return HTTP 503 Service Unavailable if database is unreachable.

2. **Configure Structured JSON Logging:**
   Add logging middleware that intercepts every request and emits a structured JSON line:
   - Fields: `timestamp`, `level`, `request_id` (UUID from `X-Request-ID` or generated), `method`, `path`, `status_code`, `duration_ms`.
   - Ensure passwords, bearer tokens, and PII are scrubbed before printing.

3. **Wire Error Boundary & Diagnostic Hook:**
   - Add global unhandled exception handler that logs error tracebacks with `request_id` and returns a clean JSON error response (`{"error": "Internal Server Error", "request_id": "<uuid>"}`).
   - Verify with a dedicated test endpoint (`/test/error`) that throwing an exception logs the trace without terminating the process.

# EXIT CRITERIA
- [ ] `/healthz` endpoint returns HTTP 200 with database check verified
- [ ] All request logs emitted as single-line JSON with `request_id`
- [ ] `bash scripts/checks/hardening-gate.sh` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
