---
name: feasibility-dossier
description: Load this skill to audit third-party dependency risks, verify circuit-breaker feature flags, evaluate API latency constraints, and ensure demo stability against external vendor outages.
---

# WHEN TO LOAD
Load during Phase 0/1 when integrating external APIs, cloud services, or AI providers, or during `/harden` to audit operational fragility.

# INPUTS
- `ARCHITECTURE.md` (External service connections)
- `.env.example` (Configured third-party API credentials)
- `docs/OPS.md` (Operational circuit breaker flags)

# OUTPUTS
- `docs/feasibility.md` auditing all external dependencies, latency budgets, and fallback routes
- Circuit-breaker feature flags (`ENABLE_<SERVICE>`) wired in application code

# EXECUTION PROTOCOL

1. **Catalog Every External Dependency:**
   Identify all third-party APIs (LLM endpoints, weather feeds, payment gateways, vision classifiers).
   Record:
   - Vendor Name & Endpoint
   - Expected Latency & P99 Latency
   - Rate Limits & Cost per Call
   - Outage Blast Radius (Does failure crash the app or just one view?)

2. **Enforce the Feature-Flag Circuit Breaker Pattern:**
   *(Motivated by Aloorithm HuggingFace outage & Orcheon ADR-003).*
   Every external integration MUST be wrapped in a conditional check:
   ```python
   if settings.ENABLE_EXTERNAL_API:
       try:
           return fetch_external_data()
       except Exception as e:
           logger.warning(f"Upstream provider failed: {e}. Falling back to seeded cache.")
           return get_seeded_fallback()
   else:
       return get_seeded_fallback()
   ```

3. **Verify Deterministic Local Fallback:**
   Confirm that when `ENABLE_<SERVICE>=false`, the endpoint returns realistic, schema-valid data without throwing errors or halting the demo.

4. **Document Findings in `docs/feasibility.md`:**
   Record dependency inventory, fallback mechanisms, and circuit-breaker flag names.

# EXIT CRITERIA
- [ ] `docs/feasibility.md` created and populated
- [ ] Every external API has a corresponding `ENABLE_<SERVICE>` boolean flag in `.env.example`
- [ ] Fallback paths verified with automated unit tests
- [ ] `make verify` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
