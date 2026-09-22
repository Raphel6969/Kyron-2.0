---
name: doc-log
description: Load this skill at phase boundaries or after significant architecture changes to write docs/phases/PHASE-N.md (<=250 words) and synchronize ARCHITECTURE.md, API.md, SCHEMA.md, and DEMO.md.
---

# WHEN TO LOAD
Load upon completing all sub-tasks in a phase, when running `/close-phase`, or whenever endpoints, schemas, or service boundaries are added or altered.

# INPUTS
- Git commit log for the current phase
- Active codebase state
- Templates for `PHASE-N.md`, `ARCHITECTURE.md`, `API.md`, `SCHEMA.md`, `DEMO.md`

# OUTPUTS
- `docs/phases/PHASE-<N>.md` (strictly <= 250 words)
- Updated `ARCHITECTURE.md` reflecting current components and trust boundaries
- Synchronized `API.md` matching live routes
- Updated `SCHEMA.md` matching current migrations
- Updated `DEMO.md` matching current live routes

# EXECUTION PROTOCOL

1. **Author `docs/phases/PHASE-<N>.md`:**
   Synthesize the phase summary adhering strictly to the 250-word cap:
   - What was delivered (3 concrete functional changes).
   - Verification evidence (`make verify-full` exit code 0, test counts, critic scores).
   - Key decisions & ADRs logged.
   - Next safe step.

2. **Synchronize Interface Contracts:**
   - **`API.md`:** Scan router files. Verify every live endpoint is registered with accurate request/response JSON schemas.
   - **`SCHEMA.md`:** Verify every table created in recent migrations is listed with its primary keys, foreign keys, and indexes.

3. **Refresh Topology & Click Path:**
   - **`ARCHITECTURE.md`:** Update component map if services or internal ports changed. Keep under 200 lines.
   - **`DEMO.md`:** Confirm step-by-step 90-second judge script accurately reflects the active client UI. Keep under 60 lines.

4. **Enforce Clean Doc Hygiene (Anti-Patch Rule):**
   Never create ad-hoc patch files like `docs/BACKEND_REWORK.md` or `docs/TODO.md`. Consolidate all truths into the canonical living state documents.

# EXIT CRITERIA
- [ ] `docs/phases/PHASE-<N>.md` exists and is <= 250 words
- [ ] `API.md` and `SCHEMA.md` match live code reality
- [ ] `ARCHITECTURE.md` <= 200 lines and `DEMO.md` <= 60 lines
- [ ] `bash scripts/checks/state-lint.sh` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
