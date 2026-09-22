---
name: escalate
description: Load this skill whenever a human dependency is encountered (missing API keys, cloud accounts, paid tier limits, or product decisions) to log a non-blocking entry in NEEDS_YOU.md and switch immediately to unblocked work.
---

# WHEN TO LOAD
Load immediately upon encountering any requirement that requires human intervention (API keys, OAuth credentials, third-party accounts, paid tiers, ambiguous product decisions, or claimed human paths in `HUMANS.md`).

# INPUTS
- Description of the dependency, missing credential, or decision
- `NEEDS_YOU.md`
- `STATE.md` and `PLAN.md`

# OUTPUTS
- Appended numbered entry in `NEEDS_YOU.md` following the strict 4-field structure
- Updated `STATE.md` marking active sub-task `status: BLOCKED`
- Context switch to the next unblocked sub-task in `PLAN.md`

# EXECUTION PROTOCOL

1. **NEVER BLOCK OR HALT (Rule 7):**
   - Do NOT stop execution.
   - Do NOT ask questions in the chat mid-loop.
   - Do NOT invent fake or placeholder credentials.

2. **Formulate the Numbered Entry in `NEEDS_YOU.md`:**
   Append a new entry using the exact 4-field structure:
   ```markdown
   ### #<N> — <Short Title of Dependency>
   - **Date Added:** <Timestamp>
   - **Status:** PENDING
   - **Phase Affected:** Phase <N> (<sub_task>)

   1. **What is needed:**
      <Exact description of key, account, or decision>

   2. **Exact steps to resolve it:**
      - Step 1: <Direct URL or console path>
      - Step 2: <Exact setting, key generation, or permission to toggle>
      - Step 3: <Variable name to populate in .env>

   3. **What happens once provided:**
      <Exact sub-task that unblocks and verification command>

   4. **What the agent is doing meanwhile:**
      <Specific unblocked sub-task currently being executed>
   ```

3. **Update `STATE.md`:**
   - Set `status: BLOCKED`.
   - Set `blocked_on: NEEDS_YOU #<N>`.
   - In `## NEXT ACTION`, name the next unblocked sub-task.

4. **Pivot Immediately to Unblocked Work:**
   Inspect `PLAN.md`. Identify the next independent sub-task (e.g. building offline mock fallbacks, client UI layout, unit test suites) and begin work immediately.

# EXIT CRITERIA
- [ ] Numbered entry appended to `NEEDS_YOU.md` with all 4 required fields
- [ ] `STATE.md` marked `BLOCKED` with `blocked_on` reference
- [ ] Next unblocked sub-task selected and active

# NEXT
Execute `feature-build` on the selected unblocked sub-task.
