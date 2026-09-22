# Workflow: /close-phase — Phase Gatekeeper & Release Lock

Executes at the boundary of each phase. Runs the slow-tier quality sweep, subjects the diff to adversarial critic review, merges to main, tags the commit, and logs phase memory.

## Step 1: Execute Full Slow-Tier Verification
- // turbo `make verify-full`
- Verifies fast-tier checks + `ui-review-gate`, `impact-gate`, `a11y`, `perf`.
- If exit code is non-zero, abort phase closure and resolve gate failures.

## Step 2: Adversarial Critic Audits
- Delegate to `code-critic` agent (or skill `review-code-critic`):
  * Review `git diff main...HEAD` against `SECURITY.md` and `dod.md`.
  * Confirm zero P1 (authz) or P2 (data loss) findings.
- Delegate to `judge-sim` agent (or skill `review-judge-sim`):
  * Score `RUBRIC.md` criteria against current build.
  * Confirm no criterion scores below 6/10.

## Step 3: Clock Over Scope Check
- Compare `hours_used` vs `hours_budget` in `STATE.md`:
  * If phase is over budget by >= 50%: Invoke `budget-pivot` skill, ship fallback, and log cut list before proceeding.

## Step 4: Write Phase Summary & Sync Documentation
- Invoke agent: `scribe` (or skill `doc-log`):
  * Write `docs/phases/PHASE-<N>.md` (adhering to strict <= 250-word cap).
  * Refresh `ARCHITECTURE.md` (keep <= 200 lines).
  * Refresh `API.md` and `SCHEMA.md` to match verified production code.
  * Refresh `DEMO.md` (keep <= 60 lines).

## Step 5: Merge & Tag Release
- Merge active phase branch into `main` (squash-merge or fast-forward clean merge).
- // turbo `git tag -a "demo-ready-p<N>" -m "Phase <N> verified and demo-ready"`
- **Rule 10:** `main` is now demonstrably demoable to a judge on production.

## Step 6: Advance State to Next Phase
- Update `STATE.md`:
  * `phase: <N+1>`
  * `sub_task: <N+1>.1`
  * `status: IN_PROGRESS`
  * Set `## NEXT ACTION` to Phase <N+1> first sub-task.
- Open next branch: `git checkout -b phase-<N+1>-<feature_name>`
