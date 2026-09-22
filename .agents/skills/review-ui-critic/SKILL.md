---
name: review-ui-critic
description: Load this skill whenever reviewing UI craft, inspecting screenshots, conducting visual audits, or verifying that frontends meet Awwwards design standards without generic AI clichés. Trigger whenever a page looks generic, before phase close, or after /ui-review.
---

# WHEN TO LOAD
Load immediately when executing visual audits, evaluating frontend craft against `design/DIRECTION.md`, parsing screenshot captures from `tests/visual/capture.spec.ts`, or when closing a UI phase.

# INPUTS
- `design/DIRECTION.md` (Design tokens, type scales, reference URLs)
- `routes.json` (List of active routes)
- `docs/reviews/screenshots/` (Rendered PNG captures @ 375, 768, 1440)

# OUTPUTS
- `docs/reviews/ui-critic-<phase>.md` containing 6-dimension scores and exact token fix directives.

# CRITIC EXECUTION PROTOCOL

1. **Audit Rendered Screenshots:**
   Inspect screenshots for every route in `routes.json` at mobile (375px), tablet (768px), and desktop (1440px).

2. **Score 6 Craft Dimensions (0–10):**
   - **Type Hierarchy:** Fluid clamp scaling (`clamp(3.5rem,8vw,7rem)`), tight display tracking (`-0.03em`), clear contrast between display and body faces.
   - **Density & Rhythm:** Explicit 4px-multiple spacing. Zero identical 3-up generic card grids.
   - **Color Discipline:** Strict adherence to the 5 tokens from `TOKENS.css`. Zero purple/indigo gradients. Accent used on <= 3 elements.
   - **Composition:** Asymmetric editorial splits (7/5 or 8/4 grid). At least one full-bleed component.
   - **Reference Match:** Resemblance to the 3 declared reference sites in `DIRECTION.md`.
   - **Craft Polish:** Designed empty/skeleton/error/success states. No spinners. Subtle borders.

3. **Format Score Entry:**
   Write findings to `docs/reviews/ui-critic-<phase>.md`:
   ```markdown
   # UI Craft Review — Phase <N>
   - Route: <route_path>
   - Overall Craft Score: <Score>/10
   - Critical Fixes:
     - Change `<element>` from `<current_property>` to `<design_token>`
   ```

4. **Iterate or Sign-Off:**
   If any score is < 7/10, apply exact CSS token fixes to the affected components and rerun screenshot capture until all scores reach >= 7/10.

# EXIT CRITERIA
- [ ] `docs/reviews/ui-critic-<phase>.md` exists with scores for all routes in `routes.json`
- [ ] No route overall craft score is below 7/10
- [ ] `bash scripts/checks/ui-review-gate.sh` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
