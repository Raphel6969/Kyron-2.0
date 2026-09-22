---
name: budget-pivot
description: Load this skill whenever a phase exceeds its allocated time budget by 50% to trigger an immediate scope reduction, ship the declared demo fallback from PLAN.md, and update the project cut list.
---

# WHEN TO LOAD
Load during `/close-phase`, at phase boundaries, or whenever `hours_used` for the current phase exceeds `1.5 * hours_budget`. **Mandatory under Rule 9 (Clock Over Scope).**

# INPUTS
- `STATE.md` (`hours_used`, `hours_budget`)
- `PLAN.md` (Active phase demo fallback and cut list)
- Outstanding uncompleted tasks in current phase

# OUTPUTS
- Immediate descheduling of unbuilt features to `PLAN.md` Cut List
- Implementation of the pre-planned Demo Fallback
- Updated `STATE.md` recalibrating phase budget

# EXECUTION PROTOCOL

1. **Calculate Budget Overrun Ratio:**
   Compare `hours_used` against the declared phase budget in `PLAN.md`.
   If `hours_used >= 1.5 * hours_budget`:
   - **CLOCK OVER SCOPE:** You are barred from continuing to build the full scope.
   - Halt new feature development on the current phase immediately.

2. **Activate the Pre-Declared Demo Fallback:**
   Read the "Demo Fallback" section declared for this phase in `PLAN.md`:
   - If a complex real-time pipeline is running over time: ship the pre-seeded deterministic snapshot instead.
   - If dynamic user editing is failing: ship the read-only sandbox mode.
   - If a polyglot microservice integration is stalled: wire the local mock server.

3. **Update the Cut List in `PLAN.md`:**
   Move all unfinished sub-tasks to the `## Cut List (Explicitly Descheduled Scope)` section in `PLAN.md`.
   Record:
   - Feature name
   - Time spent before pivot
   - Why it was cut (budget protection)
   - Fallback activated in its place

4. **Log the Pivot in `DECISIONS.md`:**
   Record an ADR titled `ADR-<NNN>: Budget Pivot Phase <N> Scope Cut` documenting the trade-off.

5. **Verify the Fallback:**
   Run `make verify`. Confirm that the demo fallback passes all gate checks cleanly.

# EXIT CRITERIA
- [ ] Active phase scope reduced to declared Demo Fallback
- [ ] Unfinished tasks logged to `PLAN.md` Cut List
- [ ] ADR logged in `DECISIONS.md`
- [ ] `make verify` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
