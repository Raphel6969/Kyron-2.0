---
name: user-journey
description: Load this skill in /ps before architecture or during UX redesigns to map the 3 critical user journeys in docs/UX.md, enforce click-depth limits, and define empty/loading/error/success states.
---

# WHEN TO LOAD
Load during `/ps` immediately following `solution-design` (before architecture), or when designing user interaction flows and screen state transitions.

# INPUTS
- `docs/01-problem.md` (Target personas)
- `docs/02-solution.md` (Technical differentiator)
- `.agents/templates/UX.md`

# OUTPUTS
- Instantiated `docs/UX.md` containing Journey 1 (Value Path), Journey 2 (Judge Path), Journey 3 (Error Recovery), and the 4-state contract per route.

# EXECUTION PROTOCOL

1. **Map Journey 1: Core Value Path:**
   - Define exact step-by-step path for the primary persona to solve their core friction.
   - Cap maximum allowed clicks (e.g. <= 4 clicks from entry to resolution).

2. **Map Journey 2: The Judge Verification Path (<= 2 Clicks):**
   - Design the 90-second judge journey.
   - **Non-negotiable rule:** The judge must reach the core differentiator and live telemetry in <= 2 clicks from the landing page.
   - Pre-authenticate or provide a single-click "Try Demo as Guest" entry.

3. **Map Journey 3: Edge & Error Recovery:**
   - Define system behavior when network fails, external APIs timeout, or bad inputs occur.
   - Guarantee that user input is never wiped and errors provide actionable inline retry buttons.

4. **Define 4 Mandatory States per Route:**
   For every page declared in `routes.json`:
   - Designed Empty State (purposeful instructions, zero blank canvas).
   - Skeleton Loading State (layout-accurate shapes, zero spinning loaders).
   - Error State (human-readable explanation + retry).
   - Success State (instant kinetic confirmation).

5. **Write `docs/UX.md`:**
   Instantiate the file with concrete routes and click limits.

# EXIT CRITERIA
- [ ] `docs/UX.md` instantiated and populated
- [ ] Journey 2 specifies <= 2 clicks to reach differentiator
- [ ] All 4 states defined for every registered route
- [ ] `make verify` exits 0

# NEXT
Execute `impact-model` skill.
