---
name: team-split
description: Load this skill after phase-planner to divide repository files and responsibilities across team members and autonomous agents, generating HUMANS.md to prevent merge collisions.
---

# WHEN TO LOAD
Load during the `/ps` workflow right after `phase-planner` completes, or whenever team composition changes mid-hackathon.

# INPUTS
- `PLAN.md` (Phased task breakdown)
- Team member list and designated roles
- `.agents/templates/HUMANS.md`

# OUTPUTS
- Instantiated `HUMANS.md` (strict 40-line ceiling) declaring human-owned and agent-owned paths.

# EXECUTION PROTOCOL

1. **Apply the Proven Historical Team Split:**
   Divide responsibilities strictly along proven hackathon lanes:
   - **Lead (You):**
     * **Owns:** `ARCHITECTURE.md`, `design/DIRECTION.md`, core engine/algorithm (`services/scoring/` or `services/engine/`), database trust boundaries, and demo narrative.
     * **Role:** Required reviewer on architecture changes and phase transitions.
   - **Backend B (Pipeline Lead):**
     * **Owns:** Data pipelines, ingestion connectors, vector retrieval, and third-party integrations (`services/ingestion/`, `services/retrieval/`).
     * **Role:** Implements data flow adhering strictly to Lead's schema contracts.
   - **Frontend C (UI Specialist):**
     * **Owns:** UI views, presentation components, layout responsiveness, and CSS token implementation (`src/components/`, `src/views/`).
     * **Role:** Follower lane — wires frontend views as backend endpoints land.
   - **Glue D (Integration & Pitch Lead):**
     * **Owns:** Cross-phase integration, demo script rehearsal, fallback assets, slide deck, and presentation media (`docs/pitch/`).
   - **Agent (Autonomous Pair-Programmer):**
     * **Owns:** Active phase implementation in non-claimed lanes, unit tests, fast-tier verification, and contract sync (`tests/`, `scripts/`, endpoint handlers).

2. **Establish the Hard Wait Dependencies:**
   Record which phases must wait for prior files to exist before starting. A dependent phase CANNOT begin based on verbal confirmation — the verified file artifact must exist in git.

3. **Populate `HUMANS.md`:**
   Generate the lane allocation table. Ensure all team members understand that claimed paths are READ-ONLY to other contributors and agents.

4. **Enforce 40-Line Ceiling:**
   Keep `HUMANS.md` strictly under 40 lines.

# EXIT CRITERIA
- [ ] `HUMANS.md` instantiated and <= 40 lines
- [ ] Lead, delegates, and agent assigned explicit, non-overlapping file paths
- [ ] `make verify` exits 0

# NEXT
Execute `scaffold` skill to bootstrap Phase 0.
