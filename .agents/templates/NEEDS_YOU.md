# NEEDS_YOU — Human Dependency Queue

> **Rule for Agents:**
> When you need human intervention (API keys, account provisioning, cloud credentials, product direction):
> 1. Append a new numbered entry below using the exact 4-field structure.
> 2. Mark the active sub-task `status: BLOCKED` in `STATE.md` and set `blocked_on: NEEDS_YOU #<n>`.
> 3. Switch immediately to the next unblocked sub-task in `PLAN.md`.
> 4. **Never stop. Never halt execution. Never invent fake credentials.**

---

### #<n> — <Short Imperative Title of Blocker>
- **Date Added:** <YYYY-MM-DD HH:MM UTC>
- **Status:** PENDING | RESOLVED
- **Phase Affected:** Phase <n> (<sub_task_id>)

1. **What is needed:**
   <exact description of the secret, key, account, or decision required>

2. **Exact steps to resolve it:**
   - <step 1: URL to visit or console to open>
   - <step 2: where to copy the key or what setting to toggle>
   - <step 3: which env variable name to populate in .env>

3. **What happens once provided:**
   <exact sub-task that will unblock and command to verify it>

4. **What the agent is doing meanwhile:**
   <specific unblocked sub-task currently being executed to prevent downtime>
