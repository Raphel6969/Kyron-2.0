# Engineering Harness & Quality Gates

_Consolidated reference for Kyron 2.0 automated build, security, UX, and visual craft verification._

---

## 1. The Four Mechanical Quality Systems

| Quality System | Contract Files | Automated Gate Scripts |
|---|---|---|
| **1. Product & Usability** | [`docs/UX.md`](UX.md), `docs/COPY.md` | [`scripts/checks/ux-gate.sh`](../scripts/checks/ux-gate.sh) (4 screen states, zero raw browser `alert()`/`prompt()`, action-oriented copy) |
| **2. UI & Visual Craft** | [`design/DIRECTION.md`](../design/DIRECTION.md), `design/TOKENS.css`, [`design/COMPONENTS.md`](../design/COMPONENTS.md) | [`scripts/checks/ui-audit.sh`](../scripts/checks/ui-audit.sh) (fast) & [`scripts/checks/ui-review-gate.sh`](../scripts/checks/ui-review-gate.sh) (`>= 7/10` craft score) |
| **3. Impact & Defensibility** | [`docs/IMPACT.md`](IMPACT.md) | [`scripts/checks/impact-gate.sh`](../scripts/checks/impact-gate.sh) (verifies live `/impact` telemetry & Honest Limits) |
| **4. Implementation & Hardening** | [`docs/SECURITY.md`](SECURITY.md), [`docs/OPS.md`](OPS.md) | [`scripts/checks/hardening-gate.sh`](../scripts/checks/hardening-gate.sh) (zero committed prod DBs, `/healthz`, `reset-demo`, zero localhost in `DEMO.md`) |

---

## 2. Verification Tiers

- **Fast Tier (`make verify` / `bash scripts/verify.sh`):** Runs on every commit (`state-lint`, `typecheck`, `lint`, `test-unit`, `ui-audit`, `ux-gate`, `hardening-gate`, `test-e2e`).
- **Slow Tier (`make verify-full` / `bash scripts/verify-full.sh`):** Runs at phase boundaries (`ui-review-gate`, `impact-gate`, `a11y`, `perf`).

---

## 3. Core Engineering Invariants (Adopted from Hack Engine OS)
1. **PostgreSQL Ready:** Committed `.db` files outside test fixtures are rejected by `hardening-gate.sh`.
2. **State Continuity:** [`STATE.md`](../STATE.md) stays `<= 40` lines at repository root and is linted by `state-lint.sh`.
3. **Resilient External Dependencies:** Every external service uses explicit feature flags (`ENABLE_*`) and non-blocking fallbacks so live demos never hang.
4. **No Placeholder UI:** Design tokens live in `TOKENS.css`; raw ad-hoc gradients, placeholder text, and unverified metrics are automatically blocked.
