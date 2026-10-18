# Product Implementation Plan: Kyron 2.0

## Product Overview & Strategic Realignment
- **Goal:** Build an enterprise-grade, deterministic, and verifiable trust layer for tool-using AI agents from scratch. Kyron 2.0 verifies tool metadata before the model sees it, enforces data-flow and egress policies on every call, isolates credentials, and produces cryptographically signed audit evidence — with zero agent-code modifications, zero model tokens on the hot path, and zero cryptic failures.
- **Strategic Reality:** Scanning and hash-pinning alone are commoditized free tools (e.g. MCP-Scan). Archestra (owner of OpenAPPA) sells a paid integration and is a direct competitor.
- **The Defensible Moat:** The synergistic combination across all seven stages: Tool Trust + In-flight Data Flow (OpenAPPA) + Source-Attributed Egress + Secrets Brokering + Signed Audit Evidence.
- **Development Philosophy:** Quality, thorough testing, and empirical verification over artificial deadlines.

---

## Phase 0: The Core Trust Gateway (P0 Core Moat)
- **Objective:** Establish production scaffolding and deliver the core data-plane differentiator: custom Go MCP gateway, Rust registry firewall, in-process OpenAPPA adapter, source-attributed egress broker, secrets broker, and signed audit emitter — validated by a published head-to-head benchmark against MCP-Scan and OpenAPPA at Gate 0.

### Sub-tasks

| ID | Task | Component | Scope / Deliverable |
|---|---|---|---|
| 0.1 | ps-decode + solution-design + verification | docs/ | ✅ Done: Dossier, solution design, empirical research, locked decisions |
| 0.2 | Production Scaffolding | All | Root repo layout (`core/`, `gateway/`, `control/`, `ui/`, `lab/`, `eval/`), Makefiles, Docker Compose, Postgres 16+ migrations, `.env.example`, deep `/healthz` |
| 0.3 | Rust Registry Firewall (C2) | `core/scanner/`, `core/pinning/` | Manifest normalizer, static rules, vector outlier check, SHA-256 hash pinning, real-time drift detection, canonical description synthesis (validated by TRUSTDESC arXiv 2604.07536) |
| 0.4 | Custom Go Protocol Gateway (C1) | `gateway/` | **Built from scratch:** Bidirectional JSON-RPC 2.0 stdio subprocess proxy + HTTP/SSE streaming client/server; zero-alloc buffer pooling; dynamic tool projection (filtering unapproved tools, canonical description delivery); session/trajectory tracking |
| 0.5 | In-Process OpenAPPA IFC Adapter (C4) | `core/openappa-adapter/` | Direct crate dependency on `archestra-ai/OpenAPPA` v0.12.0; contract translation layer isolating upstream RFC wire-format churn; label lattice combination & prospective checks |
| 0.6 | Source-Attributed Egress Broker (C8) | `gateway/` | **Built from scratch:** Outbound proxy with byte, rate, and distinct-destination budgets aggregated *per data source* (catches S4 sharded exfiltration and arXiv 2605.20734 covert channels) |
| 0.7 | Automated Secrets Broker (C9) | `gateway/` | In-memory credential vault; JIT token injection at tool dispatch; automatic redaction of known secrets from model-visible traffic (defeats S6 credential theft) |
| 0.8 | Ed25519 Signed Audit Log (C11) | `core/`, `gateway/` | Canonical event schema; SHA-256 hash chaining across trajectory events; Ed25519 digital signatures per event; `kyron audit verify` CLI command |
| 0.9 | Deliberately Vulnerable MCP Lab | `lab/` | Standalone test servers for S1 (poisoned time tool), S2 (rug pull), S3 (lying tool), S4 (sharded exfiltration), S5 (TOCTOU swap), and S6 (credential theft) |
| 0.10 | Non-Breaking Monitor Mode & Telemetry | `gateway/` | Shadow evaluation emitting structured "would-block" telemetry without disrupting agent utility |
| 0.11 | **Gate 0 Benchmark Comparison** | `eval/` | Reproducible head-to-head empirical comparison: No Defense vs MCP-Scan vs OpenAPPA Alone vs Kyron 2.0 across S1–S6 and MCPTox |
| 0.12 | Verification & State Close | CI | `make verify` passes (100% green); commit `phase0.close`; update `STATE.md`; write `docs/phases/PHASE-0.md` |

### Exit Criteria
- [ ] `make verify` exits 0 across all Go, Rust, and Python linters and tests.
- [ ] Custom Go Gateway handles stdio and SSE streaming with zero memory leaks.
- [ ] S1 (poisoned time tool): Scanner flags risk > 0.6; canonical description delivered to agent.
- [ ] S2 (rug pull): Tool hash change triggers instant quarantine on refresh.
- [ ] S4 (sharded exfiltration): Egress broker halts exfiltration when cumulative source budget is breached.
- [ ] S6 (credential theft): Zero secrets visible in model context or prompt transcripts.
- [ ] OpenAPPA adapter enforces data-flow prospective label check in-process.
- [ ] Audit log hash chain verified with valid Ed25519 signatures.
- [ ] Gate 0 benchmark comparison published proving Kyron's superior multi-stage defense.

---

## Phase 1: Control Plane, Leases & Actionable Usability
- **Objective:** Deliver capability leases, call-scoped authority rulings, FastAPI control plane API, React 18 SOC console with visual drift diffs, and structured remediation payloads.

### Sub-tasks
- 1.1 Capability leases (F18) & Call-Scoped Authority Service (C6): Single-use signed capability leases with automatic TTL expiry.
- 1.2 Actionable Error Remediation Engine: Structured JSON error returns with rule violations, remediation advice, and instant escalation URLs.
- 1.3 Control Plane REST API (C12): FastAPI service with PostgreSQL 16+ backing for policies, registry state, approval queues, and EU AI Act exports.
- 1.4 React 18 SOC Console Modernization (C13): Tool inventory table, side-by-side visual semantic drift diffs, 1-click approvals, and trajectory audit drawer.
- 1.5 Declarative TOML Policy Compiler & Hot-Reload: Instant policy bundle reloading across active gateway sessions with zero downtime.
- 1.6 Seeded Enterprise Demo Dataset: 30+ realistic tools, policies, active sessions, and audit events.
- 1.7 `make verify` green; commit `phase1.close`; update `STATE.md`; write `docs/phases/PHASE-1.md`.

---

## Phase 2: Local Sandbox Attestation, TOCTOU & Provenance
- **Objective:** Extend trust to local tools via eBPF process tracing, eliminate TOCTOU races, memoize recovery plans, and implement JSON-path field-level provenance.

### Sub-tasks
- 2.1 Local Tool Sandbox + Aya/eBPF Process Tracing (C10): Isolated Linux namespaces tracing file opens, socket connects, and diffing against declared contracts (catches lying tools in S3).
- 2.2 TOCTOU Resource-Identity Binding (F26): Cryptographically binding approvals to content hashes, re-verifying at execution (defeats S5).
- 2.3 Memoized Recovery Engine (C5, F17): Precomputed recovery plans cached by composite state fingerprint for zero-token self-healing.
- 2.4 JSON-Path Field-Level Provenance (C7, F21): Fine-grained output labeling to prevent over-tainting.
- 2.5 Effect Ledger & Idempotency (C7): Effect tokens with reconciliation jobs.
- 2.6 Adaptive Red-Team Evaluation (RQ6): Validating resilience against attackers aware of the scanner.
- 2.7 `make verify-full` green; commit `phase2.close`; update `STATE.md`; write `docs/phases/PHASE-2.md`.

---

## Phase 3: Production Packaging, Distribution & Public Launch
- **Objective:** Multi-platform packaging, production deployment, demo resilience, and open-source release.

### Sub-tasks
- 3.1 Static Multi-Platform Binaries: GoReleaser / Cargo builds for Linux, macOS, and Windows (`kyron` CLI + gateway).
- 3.2 Production Packaging: Multi-stage minimal Docker images and Kubernetes Helm charts.
- 3.3 Zero-Code Drop-In Configurations: Ready-to-use config recipes for Claude Desktop, Cursor, LangChain, and CrewAI.
- 3.4 Automated Demo Reset (`make reset-demo`): Restores fresh demo state in < 5 seconds.
- 3.5 Cloud Production Deployment: Live HTTPS endpoints with zero localhost dependencies.
- 3.6 UI/UX Motion Pass: Polished GSAP transitions, responsive layout, dark/light theme alignment.
- 3.7 Documentation & EU AI Act Dossier: Architecture whitepaper, API reference, and 90-second walk-through video in `DEMO.md`.
- 3.8 `make verify-full` green; squash-merge to main; tag `v1.0.0-release`; write `docs/phases/PHASE-3.md`.
