---
name: review-ux-critic
description: Load this skill whenever auditing user journeys, measuring click depth, verifying empty/skeleton/error/success states, hunting for dead ends, or ensuring the judge demo path reaches the core differentiator in <= 2 clicks.
---

# WHEN TO LOAD
Load during user-experience passes, before closing frontend phases, when running `/harden`, or when auditing interactive journeys against `docs/UX.md`.

# INPUTS
- `docs/UX.md` (Journey specifications and click constraints)
- `routes.json` (Registered application routes)
- Client application source code (`src/` or `app/`)

# OUTPUTS
- `docs/reviews/ux-critic-<phase>.md` with journey click counts, dead-end inventory, and state verification.

# PROTOCOL
1. **Trace Journey 1 (Value Path):**
   Count each step from entry to primary outcome. Fail if actual clicks exceed `docs/UX.md` limit.
2. **Trace Journey 2 (Judge Path):**
   Confirm that a judge reaches the live differentiator and `/impact` route in <= 2 clicks from the homepage.
3. **Trace Journey 3 (Error Recovery):**
   Verify that network failures and bad inputs trigger inline error states with retry buttons, not white screens or raw alerts.
4. **Audit State Coverage:**
   Verify each route in `routes.json` has:
   - Designed empty state (no blank screens)
   - Layout-accurate skeleton (no spinners)
   - Error banner with action button
   - Success state with live feedback
5. **Log Report:**
   Write findings to `docs/reviews/ux-critic-<phase>.md`.

# EXIT CRITERIA
- [ ] Journey 2 click count <= 2 clicks to differentiator
- [ ] Zero unhandled alert() or console-only error fallbacks
- [ ] `bash scripts/checks/ux-gate.sh` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
