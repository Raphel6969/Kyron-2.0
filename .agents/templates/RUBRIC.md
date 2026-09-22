# RUBRIC — Hackathon Evaluation Matrix & Score Targets

> **Judge-Proofing Standard:** Evaluated continuously by the `judge-sim` agent.
> A phase cannot be closed if any criterion is projected below 6/10.

---

## 1. Evaluation Criteria & Weightings
| Criterion | Weight | Minimum Target | Target Artifact / Proof |
|---|---|---|---|
| **Technical Innovation & Moat** | 30% | 8/10 | `ARCHITECTURE.md`, core algorithm, sub-10ms latency |
| **Real-World Impact & Feasibility** | 25% | 8/10 | `docs/IMPACT.md`, `/impact` route, sourced arithmetic |
| **Product Finish & Visual Craft** | 20% | 8/10 | `design/DIRECTION.md`, Awwwards aesthetic, GSAP motion |
| **Engineering Rigor & Architecture** | 15% | 7/10 | `make verify` green, strict migrations, zero SQLite in prod |
| **Presentation & Demo Resilience** | 10% | 8/10 | `DEMO.md` 90s click path, `make reset-demo`, zero crashes |

---

## 2. Criterion Score Definitions

### Criterion 1: Technical Innovation & Moat
- **6/10 (Passing):** Architecture goes beyond standard CRUD / basic wrapper. Distinct pipeline demonstrated.
- **8/10 (Competitive):** Proprietary logic cascade (e.g. multi-stage cascade, custom index, or compiled solver).
- **10/10 (Winning):** Deterministic performance guarantees, verifiable benchmarks, innovative protocol integration.

### Criterion 2: Real-World Impact & Feasibility
- **6/10 (Passing):** Identifies a genuine market disparity with basic estimate.
- **8/10 (Competitive):** Sourced baseline, explicit arithmetic, live `/impact` page, stated Honest Limits.
- **10/10 (Winning):** Live telemetry computed from real seeded transactions; defensible unit economics.

### Criterion 3: Product Finish & Visual Craft
- **6/10 (Passing):** Clean responsive layout, no broken links or raw console errors.
- **8/10 (Competitive):** High-craft bespoke design tokens, fluid typography, 4 states on all screens, GSAP reveals.
- **10/10 (Winning):** Awwwards-tier craft, zero AI cliches, immersive kinetic feedback, flawless accessibility.

### Criterion 4: Engineering Rigor
- **6/10 (Passing):** Code builds cleanly, tests pass, basic health check endpoint present.
- **8/10 (Competitive):** Automated fast/slow test gates, zero committed SQLite, strict tenant isolation authz tests.
- **10/10 (Winning):** Comprehensive CI/CD, structured JSON logs with trace IDs, idempotent database migrations.
