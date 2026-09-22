---
name: feature-build
description: Load this skill to execute exactly one sub-task from PLAN.md, write the IN FLIGHT register before touching files, implement the feature against dod.md, and verify with make verify.
---

# WHEN TO LOAD
Load during the `/next` main loop to build any individual feature, endpoint, data model, or UI component declared in `PLAN.md`.

# INPUTS
- Target sub-task from `PLAN.md`
- `STATE.md` (Active state and IN FLIGHT block)
- `.agents/checklists/dod.md` (Definition of Done)
- Relevant contracts: `API.md`, `SCHEMA.md`, `docs/UX.md`, `design/DIRECTION.md`

# OUTPUTS
- Implemented source code and associated tests
- Updated `STATE.md` with cleared IN FLIGHT block
- Atomic git commit: `phase<N>.<M>: <what changed>`

# EXECUTION PROTOCOL

1. **Write IN FLIGHT First (Rule 3 & State Layer Guarantee):**
   Before modifying or creating any source file, edit `STATE.md`:
   - Set `status: IN_PROGRESS`.
   - In `## IN FLIGHT`, list the exact files about to be modified and what is being built.
   - If a crash or timeout occurs mid-edit, the next agent recovers in 3 lines without archaeology.

2. **Check Human Boundaries (Rule 12):**
   Inspect `HUMANS.md`. Confirm the files targeted are in the agent lane and NOT claimed by a human collaborator. If claimed, route through `escalate`.

3. **Implement Feature to dod.md Standards:**
   - **If Page:** Implement all 4 states (empty, skeleton, error, success). Zero emojis as icons. Zero raw Tailwind colors. Add Playwright assertion.
   - **If Endpoint:** Validate inputs at boundary (4xx not 500). Enforce server-side authorization. Add structured JSON log. Add happy and failure unit tests.
   - **If Data Model:** Write migration, index foreign keys, add 30+ seed rows to `make seed`.

4. **Verify Exit Code (Rule 4):**
   Run `make verify`.
   - If 0: Proceed to commit.
   - If non-zero: Fix failure. If same error occurs 2x, immediately invoke `debug-triage`.

5. **Commit & Update State (Rules 5 & 6):**
   - Commit changes: `git commit -m "phase<N>.<M>: <what changed>"`.
   - Update `STATE.md`: clear `## IN FLIGHT`, update `sub_task`, set `status: VERIFIED`, update `last_verified_commit`.

# EXIT CRITERIA
- [ ] Feature meets all applicable `dod.md` checklist criteria
- [ ] `make verify` exits 0
- [ ] Atomic git commit recorded
- [ ] `STATE.md` has `## IN FLIGHT` cleared and `status: VERIFIED`

# NEXT
Run `make verify`, update `STATE.md`, commit.
