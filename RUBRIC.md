# RUBRIC — Hackathon Evaluation Matrix & Score Targets

> **Judge-Proofing Standard:** Evaluated continuously by the `judge-sim` agent.
> A phase cannot be closed if any criterion is projected below 6/10. Target: ≥ 8/10 across all axes.

---

## 1. Evaluation Criteria & Weightings

| Criterion | Weight | Minimum Target | Target Artifact / Proof |
|---|---|---|---|
| **Technical Innovation & Moat** | 30% | 9/10 | `ARCHITECTURE.md`, custom Go gateway, Rust policy core (< 5ms), OpenAPPA adapter |
| **Real-World Impact & Feasibility** | 25% | 9/10 | `docs/IMPACT.md`, `/impact` route, MCPTox benchmark, EU AI Act compliance |
| **Product Finish & Visual Craft** | 20% | 8/10 | `ui/`, React 18 SOC console, semantic visual diff drawer, responsive 4-state screens |
| **Engineering Rigor & Architecture** | 15% | 9/10 | `make verify` exits 0, PostgreSQL 16+ migrations, Ed25519 hash-chained audit store |
| **Presentation & Demo Resilience** | 10% | 9/10 | `DEMO.md` 90s click path, `make reset-demo` in < 5s, zero crashes |

---

## 2. Criterion Score Definitions & Evidence

### Criterion 1: Technical Innovation & Moat (Target: 9/10)
- **Status:** Winning (9/10).
- **Evidence:** First unified system to cover all 7 stages of MCP tool execution. Zero-model hot path in Rust (< 5ms) combined with a from-scratch Go MCP gateway speaking stdio & SSE. Source-attributed egress budgets that catch sharded exfiltration (S4) where competitors fail. In-process integration with `archestra-ai/OpenAPPA`.

### Criterion 2: Real-World Impact & Feasibility (Target: 9/10)
- **Status:** Winning (9/10).
- **Evidence:** Sourced baseline using MCPTox (72.8% attack success rate) and arXiv 2602.22450 (0.89 silent egress rate). Directly unlocks enterprise agent pilot deployment (11–33% to production). Real-time telemetry via `/impact` route computed from actual seeded records. Stated Honest Limits.

### Criterion 3: Product Finish & Visual Craft (Target: 8/10)
- **Status:** Competitive (8/10).
- **Evidence:** Modernized React 18 SOC console with side-by-side semantic drift diffs, 1-click approvals, and audit forensics drawer. Mandatory empty, skeleton loading, error, and success states implemented across all screens. Zero AI clichés or cheap templates.

### Criterion 4: Engineering Rigor (Target: 9/10)
- **Status:** Winning (9/10).
- **Evidence:** Multi-service polyglot architecture (Go, Rust, Python, TypeScript) passing `make verify` with 100% green exit code 0. PostgreSQL 16+ migrations, deep `/healthz` downstream checks, structured JSON logs with trace IDs, and property-based test suites.

### Criterion 5: Presentation & Demo Resilience (Target: 9/10)
- **Status:** Winning (9/10).
- **Evidence:** Locked 90-second judge demonstration click-path in `DEMO.md`. Reproducible attack fixtures (S1–S6). Automated demo reset via `make reset-demo` executing in under 5 seconds.
