---
name: ux-audit
description: Load this skill to audit frontend routes against docs/UX.md, verify the 4 states per screen, count journey clicks, hunt for dead ends, and execute the ux-gate script.
---

# WHEN TO LOAD
Load during frontend development cycles, before closing UI phases, or when running `/harden` to ensure every user journey is intuitive and bug-free.

# INPUTS
- `docs/UX.md` (Target journeys and click constraints)
- `routes.json` (Registered application routes)
- Client source code (`src/` or `frontend/`)

# OUTPUTS
- UX audit log confirming Journey 1/2/3 compliance
- Green execution of `scripts/checks/ux-gate.sh`

# EXECUTION PROTOCOL

1. **Verify State Completeness across all Routes:**
   For each route in `routes.json`, inspect components to verify:
   - **Empty state:** Does it render deliberate placeholder content if database table has 0 rows?
   - **Loading state:** Does it use layout-matching skeletons? Are circular spinners banned?
   - **Error state:** Do failed fetch calls render inline alert cards with a retry button?
   - **Success state:** Does user mutation trigger positive feedback without full-page reloads?

2. **Audit Journey Click Counts:**
   - Walk Journey 1 (Primary Value Path): verify clicks <= declared limit.
   - Walk Journey 2 (Judge Demo Path): verify judge reaches differentiator in <= 2 clicks.

3. **Hunt for Dead Ends & Anti-Patterns:**
   - Scan for unlinked buttons, placeholder `href="#"`, or stubbed `onClick={() => {}}`.
   - Scan for raw browser `alert()`, `confirm()`, or unstyled error boundaries.
   - Scan for dead button text ("Click here", "Submit").

4. **Execute Automated Usability Gate:**
   Run `bash scripts/checks/ux-gate.sh`. Fix any detected violations immediately.

# EXIT CRITERIA
- [ ] All 4 states verified across every route in `routes.json`
- [ ] Journey 2 click depth <= 2 verified
- [ ] Zero dead buttons or raw browser alerts
- [ ] `bash scripts/checks/ux-gate.sh` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
