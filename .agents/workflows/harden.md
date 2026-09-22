# Workflow: /harden — Full Quality Sweep & Score Optimization

Executes a comprehensive 4-system quality audit. Dispatches all four critic agents simultaneously, consolidates their findings into a single list ranked by score-gained-per-hour, fixes what fits the remaining clock, and deschedules the rest into the Cut List. Run at every phase close and once at the 70% time mark.

## Step 1: Run Full Slow-Tier Verification
- // turbo `make verify-full`
- Checks compilation, linters, unit tests, a11y, perf budgets, and gate scripts.

## Step 2: Dispatch All Four Critic Agents
Invoke the 4 specialized reviewers:
1. **`ui-critic`:** Screenshot craft evaluation against `design/DIRECTION.md` tokens.
2. **`ux-critic`:** User journeys, click limits, 4 states, and dead-end check against `docs/UX.md`.
3. **`code-critic`:** Git diff security review, authz holes, data loss risks against `docs/SECURITY.md` and `dod.md`.
4. **`judge-sim`:** 8-minute adversarial judge evaluation against `RUBRIC.md`.

## Step 3: Merge Findings into One Ranked ROI Backlog
- Consolidate all critic findings into `docs/reviews/harden-audit.md`.
- Rank every action item by **Score Gained per Developer Hour**:
  ```markdown
  | Priority | System | Finding / Fix | Est. Time | Score Lift | File:Line |
  |---|---|---|---|---|---|
  | 1 | Security | Missing authz check on delete endpoint | 0.5h | +1.5 pts | `routers/items.py:45` |
  | 2 | Craft | Clamp font scale missing tracking token | 0.2h | +1.0 pts | `TOKENS.css:12` |
  | 3 | Usability | Missing error boundary on impact chart | 0.5h | +0.8 pts | `views/Impact.tsx:32` |
  ```

## Step 4: Apply High-ROI Fixes Within Remaining Budget
- Check remaining hours budget in `STATE.md`.
- Sequentially execute fixes starting from Priority 1 until the current allocation is filled.
- Verify each fix: // turbo `make verify`.

## Step 5: Deschedule Low-ROI Items to Cut List
- For any findings that exceed the time budget:
  * Move to `## Cut List (Explicitly Descheduled Scope)` in `PLAN.md`.
  * Log rationale in `DECISIONS.md`.
  * **Rule 9:** Never let scope creep jeopardize the clock.

## Step 6: Verify & Commit Hardened State
- // turbo `make verify-full`
- // turbo `git commit -m "harden: comprehensive 4-critic quality pass and score optimization"`
