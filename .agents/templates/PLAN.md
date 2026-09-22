# PLAN

## Project Overview
- **Goal:** <one sentence stating the primary user problem solved and key differentiator>
- **Total Hours Budget:** <total_hours>
- **Current Hours Used:** <hours_used>

## Target Personas
- **Primary Persona:** <persona_1_description_and_job_to_be_done>
- **Secondary Persona:** <persona_2_description_and_job_to_be_done>
*(Maximum 2 personas allowed during hackathon build. Additional personas moved to Cut List).*

---

## Phase 0: System Skeleton & Core Trust Boundaries
- **Time Budget:** <n> hours
- **Goal:** <working skeleton, database connection, healthcheck, CI, and governance contracts>
- **Exit Criteria:**
  - [ ] `make verify` exits 0
  - [ ] Database migrations configured and tested
  - [ ] `/healthz` endpoint returning HTTP 200 with database check
  - [ ] `.env.example` committed; `.env` excluded in `.gitignore`
  - [ ] No `.db` binary files in repo
- **Demo Fallback (if cut):** <minimal mock server returning static JSON with verified contract>

## Phase 1: Core Domain Pipeline & Quantified Impact Route
- **Time Budget:** <n> hours
- **Goal:** <primary data model, domain logic pipeline, and /impact live telemetry endpoint>
- **Exit Criteria:**
  - [ ] `make verify` exits 0
  - [ ] `docs/IMPACT.md` arithmetic formulas validated against live `/impact` route
  - [ ] Server-side authorization enforced with unit test proving tenant isolation
  - [ ] 30+ seeded records loaded into database
- **Demo Fallback (if cut):** <pre-calculated seeded database snapshot with read-only endpoint>

## Phase 2: Differentiator Feature & First-Class Client Workflow
- **Time Budget:** <n> hours
- **Goal:** <the primary technical moat / core user workflow that wins the hackathon>
- **Exit Criteria:**
  - [ ] `make verify` exits 0
  - [ ] All 4 UI states designed and verified (empty, skeleton loading, error, success)
  - [ ] Banned styling audit passes (no raw Tailwind colors, no gradients, no emoji icons)
  - [ ] End-to-end smoke test verifies complete happy path
- **Demo Fallback (if cut):** <interactive sandbox mode with preset test inputs>

## Phase 3: Hardening, Polish & Judge-Proof Resilience
- **Time Budget:** <n> hours
- **Goal:** <reset-demo verification, GSAP/Lenis motion pass, judge click-path lockdown>
- **Exit Criteria:**
  - [ ] `make verify-full` exits 0
  - [ ] `make reset-demo` restores clean demo state in < 5 seconds
  - [ ] Public production deployment active with no `localhost` references in `DEMO.md`
  - [ ] ui-critic score >= 7/10 across all routes in `routes.json`
  - [ ] judge-sim score >= 6/10 across all criteria in `RUBRIC.md`
- **Demo Fallback (if cut):** <pre-recorded offline video walk-through fallback linked in DEMO.md>

---

## Cut List (Explicitly Descheduled Scope)
- <feature_or_persona_deferred_to_post_hackathon_with_reason>
- <feature_or_persona_deferred_to_post_hackathon_with_reason>
