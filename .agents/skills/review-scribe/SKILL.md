---
name: review-scribe
description: Load this skill whenever updating STATE.md, clearing IN FLIGHT, recording phase logs in docs/phases/PHASE-N.md, or synchronizing API.md and SCHEMA.md with active code changes. Trigger after every sub-task verification and at every phase boundary.
---

# WHEN TO LOAD
Load immediately following any successful sub-task verification, during `/next` cycle wrap-up, and at phase boundaries to synchronize repository memory.

# INPUTS
- `STATE.md`
- Active git diff or commit log
- Current phase scope from `PLAN.md`
- Newly added endpoints or database models

# OUTPUTS
- Updated `STATE.md` (cleared IN FLIGHT, updated next action, <= 40 lines)
- New or refreshed `docs/phases/PHASE-<N>.md` (<= 250 words)
- Synchronized `API.md` and `SCHEMA.md`

# PROTOCOL
1. **Clear In-Flight Work:**
   Verify `make verify` exited 0. Empty the `## IN FLIGHT` block in `STATE.md`.
2. **Update State Indicators:**
   Update `status: VERIFIED`, update `hours_used`, and record the commit SHA.
3. **Formulate Next Action:**
   Write exactly one clear, imperative sentence in `## NEXT ACTION` that a cold agent can execute without external chat context.
4. **Sync Interface Contracts:**
   - If endpoints were added or schemas modified, update `API.md`.
   - If migrations were created, record table schemas and indexes in `SCHEMA.md`.
5. **Enforce File Limits:**
   Ensure `STATE.md` remains under 40 lines. Ensure `PHASE-<N>.md` remains under 250 words.

# EXIT CRITERIA
- [ ] `STATE.md` line count <= 40 lines
- [ ] `## IN FLIGHT` block is empty
- [ ] `bash scripts/checks/state-lint.sh` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
