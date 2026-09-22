---
name: test-verify
description: Load this skill to author happy-path and failure-path unit tests, write Playwright e2e assertions, run make verify, and ensure no sub-task is declared complete without a passing exit code.
---

# WHEN TO LOAD
Load immediately following any feature implementation, before attempting to commit, during `/next`, or when verifying bug fixes.

# INPUTS
- Target endpoint, model, or UI view implementation
- `.agents/checklists/dod.md` (Testing criteria)
- Testing framework configuration (`pytest`, `node --test`, `go test`, `cargo test`, `playwright`)

# OUTPUTS
- Automated unit test files (`tests/` or `backend/tests/`)
- E2E smoke test assertions
- Passing exit code 0 from `make verify`

# EXECUTION PROTOCOL

1. **Author Two Unit Tests per Endpoint (DoD Requirement):**
   - **Test 1 (Happy Path):** Valid payload returns HTTP 200/201 with expected data schema.
   - **Test 2 (Failure Path):** Missing/malformed payload returns HTTP 400 Bad Request (not unhandled 500) or unauthorized request returns HTTP 401/403.

2. **Author User-Visible Playwright Assertion per Page:**
   Add a concrete visual test checking that the core differentiator or data table renders visible content:
   ```typescript
   test('console renders live telemetry records', async ({ page }) => {
     await page.goto('/console');
     await expect(page.locator('[data-testid="telemetry-table"]')).toBeVisible();
     await expect(page.locator('[data-testid="metric-card"]')).not.toBeEmpty();
   });
   ```

3. **Execute Verification Harness (Rule 4):**
   Run `make verify`.
   - Never declare success from reading code. The exit code is the only accepted evidence.
   - If exit code is non-zero, parse the failing check output and resolve the issue.

# EXIT CRITERIA
- [ ] Happy-path and failure-path unit tests exist and pass
- [ ] User-visible outcome assertion verified
- [ ] `make verify` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
