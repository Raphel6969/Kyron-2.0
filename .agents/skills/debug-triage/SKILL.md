---
name: debug-triage
description: Load this skill whenever the same build or test error occurs twice to stop editing thrash, write a formal hypothesis log in docs/debug/<slug>.md, evaluate 3 alternative approaches, and escalate if unresolved after 4 attempts.
---

# WHEN TO LOAD
Load immediately when `make verify` or any sub-task command fails with the same error twice in succession. **Mandatory under Rule 8 (Anti-Thrash).**

# INPUTS
- Failing error output and stack trace
- Source files involved in the failing attempts
- Previous failed attempts history

# OUTPUTS
- `docs/debug/<slug>.md` documenting the error, written hypothesis, and 3 alternative approaches
- Escalation to `NEEDS_YOU.md` if the error persists past 4 attempts

# EXECUTION PROTOCOL

1. **STOP EDITING IMMEDIATELY (Rule 8):**
   Do not make another blind edit or speculative fix. Stop and step back.

2. **Author Hypothesis Document (`docs/debug/<slug>.md`):**
   Create a markdown file under `docs/debug/` with slug matching the failure (e.g. `docs/debug/authz-middleware-failure.md`):
   ```markdown
   # Debug Triage: <Error Headline>
   - **Date:** <Timestamp>
   - **Sub-Task:** <sub_task_id>
   - **Attempt Count:** 2

   ## Exact Error Message
   ```
   <paste verbatim compiler, runtime, or test error>
   ```

   ## Root Cause Hypothesis
   <Written explanation of what underlying assumption or interface mismatch is causing the failure>

   ## Three Alternative Approaches
   1. **Approach A (Minimal Intervention):** <Direct structural fix or interface realignment>
   2. **Approach B (Alternative Library / Idiom):** <Replacing problematic pattern with proven standard>
   3. **Approach C (Simplification / Fallback):** <Simplifying logic or leveraging mock/caching boundary>
   ```

3. **Execute Approach A First:**
   Apply the cleanest alternative approach deliberately. Run `make verify`.

4. **The 4-Attempt Hard Ceiling:**
   - If the same error fails a 3rd time, execute Approach B.
   - If the error fails a 4th time: **STOP IMMEDIATELY.**
     * Do NOT attempt a 5th edit.
     * Invoke `escalate` skill: append blocker to `NEEDS_YOU.md` with link to `docs/debug/<slug>.md`.
     * Mark sub-task `status: BLOCKED` in `STATE.md` and switch to next unblocked task.

# EXIT CRITERIA
- [ ] `docs/debug/<slug>.md` created with error, hypothesis, and 3 approaches
- [ ] Either fix passes `make verify` OR blocker is escalated to `NEEDS_YOU.md`

# NEXT
Run `make verify`, update `STATE.md`, commit.
