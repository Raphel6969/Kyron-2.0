---
name: instrumentation
description: Load this skill to implement the live /impact route, wire structured domain event logging, and ensure impact numbers are dynamically calculated from seeded database records rather than static marketing slides.
---

# WHEN TO LOAD
Load during Phase 1 when building backend data pipelines, implementing `/impact`, or establishing structured telemetry logging.

# INPUTS
- `docs/IMPACT.md` (Arithmetic formula and variable definitions)
- `SCHEMA.md` (Event tables and transactional models)
- `routes.json` (Route registry)

# OUTPUTS
- Functional backend route `GET /impact` returning live calculated metrics
- Frontend `/impact` page component visualizing numbers
- Registered `/impact` entry in `routes.json`
- Green execution of `scripts/checks/impact-gate.sh`

# EXECUTION PROTOCOL

1. **Wire Structured Domain Event Logging:**
   Ensure significant business actions emit a typed event row into PostgreSQL (e.g. `audit_logs`, `decision_records`, or `events` table).
   Record: `timestamp`, `event_type`, `volume_processed`, `latency_ms`, `value_saved`.

2. **Implement `GET /impact` Route:**
   Author backend endpoint in FastAPI / Go:
   - Query event/transaction tables using SQL aggregation (`COUNT`, `SUM`, `AVG`).
   - Compute formula variables defined in `docs/IMPACT.md`.
   - Return dynamic JSON response:
     ```json
     {
       "baseline_metric": 30.0,
       "optimized_metric": 4.2,
       "total_economic_saved": 142500.00,
       "sample_size": 128,
       "unit": "INR"
     }
     ```

3. **Build Frontend `/impact` Route:**
   - Create interactive client page displaying metric comparison cards.
   - Include dynamic sparklines or live event counter.
   - Register route `/impact` in `routes.json`.

4. **Verify Live Output:**
   Query endpoint: verify that numbers change dynamically when new transactions or test seeds are inserted.

# EXIT CRITERIA
- [ ] `GET /impact` endpoint returns HTTP 200 with dynamic database calculation
- [ ] `/impact` route rendered cleanly on frontend
- [ ] `/impact` registered in `routes.json`
- [ ] `bash scripts/checks/impact-gate.sh` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
