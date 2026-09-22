---
name: demo-resilience
description: Load this skill to build and verify the make reset-demo command, implement circuit-breaker feature flags on third-party APIs, configure mock fallbacks, and bulletproof the live judging demo.
---

# WHEN TO LOAD
Load during Phase 0 to set up `make reset-demo`, in Phase 3 during `/demo-prep`, or whenever testing system resilience against live vendor outages during presentation.

# INPUTS
- `Makefile` (`reset-demo` target)
- `docs/OPS.md` (Operational circuit-breaker specifications)
- `DEMO.md` (Judge walkthrough path)

# OUTPUTS
- Verified, working `make reset-demo` restoring pristine demo state in < 5 seconds
- Feature-flag toggles (`ENABLE_<SERVICE>`) wired for every 3rd-party integration
- Clean `DEMO.md` pointing exclusively to deployed production URLs (zero localhost)

# EXECUTION PROTOCOL

1. **Build and Test `make reset-demo`:**
   Configure Makefile target or `scripts/reset-demo.sh`:
   - Truncates transient test tables and clears cache.
   - Re-runs idempotent database seed (`make seed`).
   - Time the execution: must complete in under 5 seconds.
   - Test by creating dirty user data, running `make reset-demo`, and verifying pristine return.

2. **Wire Circuit-Breaker Feature Flags on Every 3rd-Party API:**
   *(The single mechanism that saves demos when cloud providers fail).*
   - Wrap all external integrations in `ENABLE_<SERVICE>` flags:
     * LLM generation -> `ENABLE_LLM_INFERENCE`
     * Vision / Embeddings -> `ENABLE_VISION_API`
     * Payment / Webhooks -> `ENABLE_PAYMENT_GATEWAY`
   - Test each flag: when set to `false`, the system must immediately return seeded realistic JSON mocks rather than throwing HTTP 500.

3. **Purge All Localhost References from `DEMO.md`:**
   Inspect `DEMO.md`:
   - Ensure target URL is the live deployed URL (e.g. `https://app.onrender.com`).
   - Replace any lingering `http://localhost:3000` or `http://127.0.0.1:8000` URLs.

4. **Verify Offline / Pre-Recorded Video Fallback:**
   Confirm an unlisted screen recording link is present in `DEMO.md` in case the venue Wi-Fi crashes.

# EXIT CRITERIA
- [ ] `make reset-demo` tested live; restores clean state in < 5 seconds
- [ ] All external APIs wrapped in boolean `ENABLE_` flags with mock fallbacks
- [ ] Zero `localhost` references in `DEMO.md`
- [ ] `bash scripts/checks/hardening-gate.sh` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
