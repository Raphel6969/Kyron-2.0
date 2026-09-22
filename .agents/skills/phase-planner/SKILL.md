---
name: phase-planner
description: Load this skill after architecture to generate PLAN.md with explicit phase budgets, strict exit criteria, demo fallbacks, and a populated cut list. Run whenever replanning or budgeting hours.
---

# WHEN TO LOAD
Load during the `/ps` workflow right after `architecture` completes, or when running `budget-pivot` to re-estimate timelines and cut non-critical features.

# INPUTS
- Total hackathon hours constraint (e.g. 24h, 36h, 48h)
- `ARCHITECTURE.md` (System services and topology)
- `.agents/templates/PLAN.md`

# OUTPUTS
- Instantiated `PLAN.md` populated with realistic time budgets, exit criteria, demo fallbacks, and cut list.
- Initialized `STATE.md` set to Phase 0.

# EXECUTION PROTOCOL

1. **Calculate Phase Hour Allocations:**
   Apply standard time-budget distribution:
   - **Phase 0 (Skeleton & Governance):** 15% of total time. Working verify-green skeleton, DB migrations, CI, and /healthz.
   - **Phase 1 (Data Pipeline & Impact Route):** 25% of total time. Core entities, data pipeline, and `/impact` route live.
   - **Phase 2 (Differentiator & UI Core):** 35% of total time. The primary technical moat and complete 4-state user views.
   - **Phase 3 (Hardening & Judge-Ready Demo):** 15% of total time. GSAP motion pass, `make reset-demo`, public deploy, DEMO.md.
   - **Buffer / Rehearsal:** 10% non-negotiable reserve for Q&A prep and pitch synchronization.

2. **Define Uncompromising Exit Criteria per Phase:**
   Every phase must have:
   - `make verify` or `make verify-full` exit code 0.
   - Explicit artifact requirements (e.g. "30+ realistic seeded database rows", "4 UI states").
   - A named **Demo Fallback** (what ships if this phase runs 50% over budget and gets cut).

3. **Populate the Cut List:**
   Explicitly declare all out-of-scope features that might tempt scope creep:
   - Multi-tenant self-serve billing
   - Additional 3rd and 4th user personas
   - Native mobile apps (unless primary requirement)

4. **Instantiate `PLAN.md` & `STATE.md`:**
   Populate `PLAN.md` and set `STATE.md` to `phase: 0`, `sub_task: 0.1`, `status: IN_PROGRESS`.

# EXIT CRITERIA
- [ ] `PLAN.md` populated with all phases, exit criteria, and demo fallbacks
- [ ] Sum of phase hours + buffer equals total hackathon budget
- [ ] `Cut List` contains at least 2 explicitly descheduled features
- [ ] `STATE.md` initialized to Phase 0
- [ ] `make verify` exits 0

# NEXT
Execute `team-split` skill.
