# Workflow: /ui-review — Visual Craft Review Loop

Standalone-invokable screenshot review loop. Catches AI clichés, ugly default styling, and layout breakage by rendering real PNG screenshots and scoring them with the `ui-critic` agent until all screens reach >= 7/10.

## Step 1: Render Route Screenshots
- Start local frontend/backend services in test mode.
- Execute visual capture:
  * // turbo `npx playwright test tests/visual/capture.spec.ts`
- Renders full-page PNGs for every route in `routes.json` across:
  * 375px (mobile)
  * 768px (tablet)
  * 1440px (desktop)
- Saves images to `docs/reviews/screenshots/`.

## Step 2: Delegate to UI-Critic Agent
- Delegate to `ui-critic` agent (or skill `review-ui-critic`):
  * Inspect captured screenshots.
  * Score each screen on the 6 craft dimensions: Type Hierarchy, Density/Rhythm, Color Discipline, Composition, Reference Resemblance, and Kinetic Polish.
  * Write report to `docs/reviews/ui-critic-round-<N>.md`.

## Step 3: Evaluate Exit Standards
- If all route craft scores are >= 7/10:
  * Log sign-off in `STATE.md`.
  * // turbo `make verify`
  * Exit loop with success.

## Step 4: Refine & Loop (Max 3 Rounds)
- If any route scores < 7/10:
  * Read the exact actionable fix list in the review report (names specific CSS tokens, font tracking, or padding values to adjust).
  * Apply modifications to the target component files in `src/components/` or `src/views/`.
  * Rerun visual capture (Step 1) and re-evaluate with `ui-critic`.
  * Repeat loop up to 3 rounds.
  * If round 3 still has scores < 7/10, log remaining items to `docs/reviews/ui-backlog.md` and proceed with highest-leverage fixes.
