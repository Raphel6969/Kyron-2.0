# Phase Exit Checklist

> **Phase Transition Standard:** Run by `/close-phase` before merging into `main`.
> Every box must be verified with concrete exit code or file artifact evidence.

---

## 1. Automated Verification
- [ ] `make verify-full` executed and exited with code `0`.
- [ ] Fast-tier gates passed: `state-lint`, `typecheck`, `lint`, `test-unit`, `ui-audit`, `ux-gate`, `hardening-gate`.
- [ ] Slow-tier gates passed: `ui-review-gate`, `impact-gate`, `a11y`, `perf`.

## 2. Critic Reviews
- [ ] `code-critic` review completed against `SECURITY.md`, `OPS.md`, and `dod.md`.
- [ ] Zero critical authorization, data loss, or secret leakage findings.
- [ ] `judge-sim` evaluation logged in `docs/reviews/`; no `RUBRIC.md` criterion scored below 6/10.
- [ ] `ui-critic` visual craft review logged; all route scores >= 7/10.

## 3. Documentation Synchronized
- [ ] `docs/phases/PHASE-<N>.md` written adhering to <=250-word cap.
- [ ] `ARCHITECTURE.md` refreshed (topology, trust boundaries, table ownership).
- [ ] `API.md` matched against reality (endpoints, request/response schemas).
- [ ] `SCHEMA.md` updated with new migrations and index definitions.
- [ ] `DECISIONS.md` updated with all ADRs accepted during this phase.

## 4. Git & Deployment Parity
- [ ] Work squashed or merged cleanly into `main` branch.
- [ ] Git tag created: `demo-ready-p<N>`.
- [ ] Production deployment booted and `/healthz` returning HTTP 200.
- [ ] `DEMO.md` judge click-path confirmed working on deployed URL.
