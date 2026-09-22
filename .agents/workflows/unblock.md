# Workflow: /unblock — Human Dependency Resolution & Resume

Executes immediately after a human collaborator fills in an API key, provisions an account, or resolves a product decision in `NEEDS_YOU.md`. Restores blocked sub-tasks and resumes the autonomous loop.

## Step 1: Scan NEEDS_YOU.md for Resolved Items
- Read `NEEDS_YOU.md`.
- Identify entries marked `Status: RESOLVED` or entries where the requested credentials have been added to `.env`.

## Step 2: Validate the Provided Dependency
- For each resolved entry:
  * Check `.env`: verify variable is set and non-empty.
  * Run the resolution check command specified in item 3 of the `NEEDS_YOU.md` entry (e.g. `curl` connection check or test script).
  * Confirm the blocker is genuinely resolved.

## Step 3: Clear Blocker in STATE.md
- Inspect `STATE.md`:
  * If `blocked_on` matches the resolved entry number:
    * Clear `blocked_on: —`.
    * Set `status: IN_PROGRESS`.
    * Formulate the resumption step in `## NEXT ACTION`.

## Step 4: Archive or Update NEEDS_YOU.md
- Update entry status to `Status: RESOLVED (verified <timestamp>)`.
- Keep historical record in `NEEDS_YOU.md` for post-hackathon debrief.

## Step 5: Resume Execution via /next
- Pick up the unblocked sub-task.
- Invoke workflow: `/next`.
