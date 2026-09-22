# Workflow: /next — The Autonomous Main Loop

The primary operational command of Hack Engine. Designed to resume cleanly from context loss or session resets, execute one verifiable sub-task, enforce quality gates, and commit on green exit code.

## Step 1: Orient (Read State Layer Only)
- Read in order (total ~2k tokens, never scan full codebase):
  1. `STATE.md`
  2. `PLAN.md`
  3. `ARCHITECTURE.md`
  4. Current `docs/phases/PHASE-<N>.md` (if exists)

## Step 2: Resume Safely from IN FLIGHT
- Inspect `STATE.md`:
  - If `status: IN_PROGRESS`:
    * Read `## IN FLIGHT` block.
    * Identify files touched by the previous aborted/crashed session.
    * Finish or explicitly abandon half-done work before touching anything new.
  - If `status: BLOCKED`:
    * Check `blocked_on` reference. If unresolved, pick next unblocked task.

## Step 3: Pick Exactly One Sub-Task
- Select the next incomplete sub-task from `PLAN.md` for the current phase.
- Check `HUMANS.md`: confirm targeted files are in the agent lane and not claimed by a human teammate.

## Step 4: Register IN FLIGHT
- Edit `STATE.md`:
  * Set `status: IN_PROGRESS`.
  * In `## IN FLIGHT`, list the exact files targeted and what is being modified.
  * Formulate `## NEXT ACTION` as one imperative sentence.

## Step 5: Implement Feature to DoD Standards
- Invoke skill: `feature-build`
- Write the code, schema migration, or view component adhering to `.agents/checklists/dod.md`.
- Author accompanying happy-path and failure-path unit tests.

## Step 6: Verify Gate Exit Code
- // turbo `make verify`
- If exit code is 0: Proceed to Step 8.
- If exit code is non-zero:
  * Parse failure output.
  * If same failure occurs 2x: Invoke `debug-triage` (write `docs/debug/<slug>.md`).
  * If same failure occurs 4x: Invoke `escalate` (log in `NEEDS_YOU.md`, mark BLOCKED, move to next task).

## Step 7: Continuous Documentation Sync
- Invoke agent: `scribe` (or skill `review-scribe`)
- Clear `## IN FLIGHT` in `STATE.md`.
- Update `sub_task`, set `status: VERIFIED`, update `hours_used`.
- If endpoints or schemas changed, sync `API.md` and `SCHEMA.md`.

## Step 8: Atomic Commit
- // turbo `git commit -m "phase<N>.<M>: <what changed>"`

## Step 9: Check Phase Completion
- If all sub-tasks in current phase are complete -> invoke workflow: `/close-phase`.
- Else -> repeat `/next` for the next sub-task.
