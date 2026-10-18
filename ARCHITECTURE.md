# ARCHITECTURE

_Kyron 2.0 — Deterministic Trust Layer for Tool-Using AI Agents_  
_Last updated: 2026-10-17 · Version 2.0 (Authoritative System Architecture)_

---

## 1. System Overview & Top-Level Architecture

Kyron 2.0 is a **deterministic gateway and policy engine** that sits between AI agents and their MCP tools. Every tool call passes through the data plane; the control plane manages policy, the registry, and evidence but never sits on the critical call path.

The data plane components — specifically the **MCP Protocol Gateway (C1)** and **Network Egress Broker (C8)** — are engineered **from scratch** to strict production and networking standards rather than wrapping off-the-shelf reverse proxies.

```
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │                              KYRON 2.0 SYSTEM                               │
  │                                                                              │
  │  ┌─────────┐      DATA PLANE (hot path, deterministic)       ┌───────────┐  │
  │  │   MCP   │  ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │   MCP     │  │
  │  │ Client  ├─►│ Protocol │ │ Registry │ │  Policy Engine  │ │  Servers  │  │
  │  │(stock,  │  │ Gateway  │►│ Firewall │►│  (Rust) +       │►│(remote or │  │
  │  │unmodif.)│  │(Custom Go│ │  (Rust)  │ │  OpenAPPA Adpt  │ │  local)   │  │
  │  └─────────┘  └────┬─────┘ └──────────┘ └────────┬────────┘ └───────────┘  │
  │                    │                              │                          │
  │               ┌────▼─────┐              ┌─────────▼───────┐                 │
  │               │  Egress  │              │  Secrets Broker │                 │
  │               │  Broker  │              │  (Custom Go)    │                 │
  │               │(Custom Go│              └─────────────────┘                 │
  │               └──────────┘                                                  │
  │                                                                              │
  │  CONTROL PLANE (off hot path — gateway enforces last signed policy bundle)  │
  │  ┌────────────────────────────────────────────────────────────────────────┐ │
  │  │  FastAPI Control API  ·  Web UI (Kyron 1.0 SOC)  ·  PostgreSQL 16+    │ │
  │  │  Eval Harness (Python)  ·  Vulnerable MCP Lab (S1–S6 fixtures)        │ │
  │  └────────────────────────────────────────────────────────────────────────┘ │
  │                                                                              │
  │  AUDIT STORE                                                                 │
  │  Hash-chained, Ed25519-signed events  ·  OpenTelemetry export               │
  └──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Registry (15 Components)

| ID | Component | Language | Interface & Protocol | Responsibility & Behavior | Phase |
|---|---|---|---|---|---|
| C1 | Protocol Gateway | Go 1.23+ | MCP over stdio + HTTP/SSE; local socket / gRPC to core | **Built from scratch:** Terminates MCP clients, manages local subprocess pipes, pools SSE connections, assigns session/trajectory IDs, renders canonical call and SHA-256 hash, applies dynamic tool projection, asks decision core for verdict, returns typed results. | P0 |
| C2 | Registry Firewall | Rust 1.80+ | Input: tool listings; Output: risk record, pinned record, model-facing canonical manifest | Scans, scores, pins, and rewrites tool descriptions; quarantines new or changed tools; synthesizes safe canonical descriptions from schemas (TRUSTDESC). | P0 |
| C3 | Policy Engine | Rust 1.80+ | `evaluate(call, state) -> Verdict`; `admit(return, state) -> Result<Admitted, Violation>` | Pure deterministic evaluation: capability lease → workflow state → prospective label → resource binding → budgets. Evaluates return at admission. Sub-5ms, zero model tokens on hot path. | P0 (Core), P1 (Full) |
| C4 | OpenAPPA Adapter | Rust 1.80+ | In-process crate dependency: contract import/export, label & remedy calls | Direct dependency on `archestra-ai/OpenAPPA` (MIT, v0.12.0). Translates contracts and delegates information-flow lattice math and recovery graph traversal. | P0 |
| C5 | Recovery Engine | Rust 1.80+ | `plan(call, state) -> Vec<RecoveryRoute>` | Searches finite recovery graph for legal routes; memoizes plans by composite state fingerprint for zero-token recovery. | P1 basic, P2 cache |
| C6 | Authority Service | Go 1.23+ | `request_ruling`, `issue_lease`, `consume_lease` | Rules, human approvals queue, optional small offline verifier. Issues single-use rulings and capability leases; consumes rulings atomically with dispatch. | P1 |
| C7 | Ledgers | Rust 1.80+ | `append_effect`, `query_state`, JSON-path labels | JSON-path provenance labels, effect tokens (`Committed` or `Indeterminate`), idempotency keys, and asynchronous reconciliation jobs. | Effects P1, provenance P2 |
| C8 | Egress Broker | Go 1.23+ | Forward HTTP/SOCKS proxy; budget violation events | **Built from scratch:** Every outbound network request checked against destination whitelist, redirect chains, DNS rebinding, and source-attributed byte/rate budgets. | P0 |
| C9 | Secrets Broker | Go 1.23+ | `resolve(secret_ref, scope, ttl)` | In-memory credential vault; mints short-lived scoped tokens per call; scans and redacts credentials from model-visible traffic. | P0 |
| C10 | Sandbox + Attestation | Rust + Aya (eBPF) | Syscall trace stream; contract violation events | Runs local tools in isolated Linux container/namespace; records file opens, socket connects, and sends per PID; diffs against declared contracts. | P2 |
| C11 | Audit Emitter + Store | Rust / Go | `append(event)`, `export(format)` | Canonical event schema; SHA-256 hash-chained, Ed25519-signed; OpenTelemetry and JSON-L exports for EU AI Act Article 50. | P0 |
| C12 | Control Plane API | Python 3.12 + FastAPI | REST OpenAPI; signed bundles pulled by gateway | Policy CRUD with versioning and signing, registry state, approval queue, telemetry reports. | P1 |
| C13 | Control Plane UI | React 18 + TypeScript | Web browser (Vite + Tailwind CSS) | Tool inventory, semantic drift side-by-side visual diffs, 1-click approvals, policy simulation (modernized Kyron 1.0 SOC). | P1 |
| C14 | Eval Harness | Python 3.12 | CLI and CI actions | Benchmark runners (MCPTox AAAI 2026, AgentThreatBench), trace replay, vulnerable lab (S1–S6), cost & latency metrics. | P0 |
| C15 | SDK | Python + TypeScript | Library imported into agent loop | Confinement forks, typed returns, minimal-context DAG forks for teams that control the agent loop. | P3 |

---

## 3. Data Plane: Tool Call Lifecycle (9 Steps, Zero-Model Hot Path)

```
  MCP Client                 Kyron Gateway              Policy Engine     Tool Server
      │                           │                           │               │
  (1) ├──tool_call(name,args)─────►│                           │               │  [Agent's own tokens]
      │                           │                                           │
  (2) │                           ├──render canonical call & compute hash     │  [0 model tokens]
      │                           │                                           │
  (3) │                           ├──evaluate(call, state)───►│               │  [0 model tokens]
      │                           │◄──Verdict─────────────────┤               │
      │                           │                                           │
  (4) │                           │  [Allow | Block(gaps,plan) | Escalate]    │  [0 tokens on hit]
      │                           │                                           │
  (5) │                           ├──inject JIT secrets (C9)                  │  [0 model tokens]
      │                           │                                           │
  (6) │                           ├──dispatch call───────────────────────────►│  [0 model tokens]
      │                           │   (traced in sandbox C10 or proxied)      │
      │                           │                                           │
  (7) │                           ├──meter egress (C8: bytes, rate per source)│  [0 model tokens]
      │                           │◄───────────────────────────realized_res───┤
      │                           │                                           │
  (8) │                           ├──admit(result, state)────►│               │  [0 model tokens]
      │                           │◄──Admitted / Violation────┤               │
      │                           │                                           │
  (9) │◄──typed sanitized result──┼──append signed audit event (C11)          │  [Agent's own tokens]
```

### Decision Latency Targets (p95)
- **Class 1 (Policy Lookup):** < 5 ms (pure Rust, 0 model tokens).
- **Class 2 (Cached Recovery Plan):** < 10 ms (state-keyed cache, 0 model tokens).
- **Class 3 (Residual Ambiguity):** < 200 ms (offline small model, off hot path; answer is input to deterministic verdict).
- **Class 4 (Human Escalation):** Asynchronous with webhook notification.

---

## 4. Tool Registration Lifecycle (7 States, 9 Transitions)

```
  Discovered ──scan──► Scanning ──pass──► Scanned ──approve──► Approved (Pinned) ──publish──► Active (Visible)
                          │                                                                       │
                          └──fail──► Quarantined ◄───────────────drift detected───────────────────┘
                                         │
                                   admin review
                                         │
                               ┌─────────┴─────────┐
                           Re-Approve           Reject ──► Blocked
```

* **States:** `Discovered`, `Scanning`, `Scanned`, `Quarantined`, `Approved`, `Active`, `Blocked`.
* **Rug-Pull Interception:** Upstream description or schema mutation alters the SHA-256 hash, immediately transitioning the tool from `Active` to `Quarantined` before the model can execute it, displaying a semantic visual diff in the SOC console.

---

## 5. Security of Kyron Itself (Threat Model & Mitigations)

Trusted Computing Base (TCB): Protocol Gateway, Decision Core, Signing Keys, Policy Bundle.

| Threat | Impact | Mitigation Strategy | Verification Fixture |
|---|---|---|---|
| **Adaptive evasion of scanner** | Poisoned tool rated safe | Structural controls hold: hash pinning, canonical descriptions, least-privilege leases. | RQ6 adaptive test suite |
| **Prompt injection against offline judge** | Offline model talked into approving tool | Judge has no tools, operates on strict output schema, can only raise risk; static rules can veto. | Static rule test suite |
| **Cache poisoning / missing fingerprint input** | Stale recovery plan applied to invalid state | Composite state fingerprint covers all 8 dimensions; cache invalidates on policy/lease/ledger changes. | Property-based tests |
| **Forged or replayed rulings and leases** | Unauthorized privileged calls executed | Signed with Ed25519, expiring, audience-bound, single-use; consumed atomically at dispatch. | Lease replay tests |
| **Policy tampering** | Rules silently weakened | Cryptographically signed policy bundles, version pinning, immutable change audit log. | Signature check tests |
| **Signing key compromise** | Forged approvals or audit events | KMS/HSM key storage, automated rotation, key ID stamped on every event. | Key rotation tests |
| **Gateway DoS or single point of failure** | Agents stop or run unprotected | Explicit fail modes (fail-closed in enforce, alert in monitor), horizontal scaling, sidecar option. | Gateway chaos tests |
| **Gateway process compromise** | Large blast radius | Memory-safe Go/Rust core, minimal OS privileges, secrets held by reference only, mTLS. | Hardening gate |
| **Supply chain vulnerability** | Malicious upstream dependency | Pinned dependencies (Cargo.lock, go.sum), minimal dependency footprint, reproducible builds. | `cargo audit`, `govulncheck` |
| **Audit log tampering** | Evidence cannot be trusted by auditor | Cryptographic SHA-256 hash chaining + Ed25519 signatures per event; external transparency log anchoring. | `kyron audit verify` |
| **Sensitive data leakage in logs** | Audit store becomes an exfiltration leak | Hashes stored by default; strict PII scrubbing and regex redaction rules. | Log sanitation tests |
| **Misconfigured customer policy** | False sense of security | Policy linting tool (F35), dry-run simulation on recorded traces before activation. | Policy linter CLI |

---

## 6. Testing & Evaluation Matrix

Testing is a core product feature. The vulnerable lab, trace replay tool, and evaluation harness are maintained continuously in CI:

| Layer | What it Verifies | Execution Trigger | Acceptance Criteria |
|---|---|---|---|
| **Unit & Property Tests** | Label combination laws (monotonicity), verdict determinism, lease non-escalation, cache fingerprint soundness. | Every commit (`make verify`) | 100% pass; 0 regressions |
| **Golden Policy Tests** | Policy + call fixture evaluates to expected deterministic verdict. | Every commit (`make verify`) | Exact match on verdicts |
| **Scenario Tests (S1–S6)** | Attack fixtures against vulnerable lab: blocked in enforce mode, logged in monitor mode. | Every commit (`make verify`) | 6 of 6 pass in enforce |
| **Differential Tests vs OpenAPPA** | Same event log produces identical label lattice and recovery route where adapter is invoked. | Every commit with adapter | Zero divergence |
| **Benchmarks (MCPTox)** | Tool-poisoning reduction, false-positive rate on benign tools, token/latency overhead. | Nightly CI | ≥ 80% reduction; ≤ 5% FP |
| **Trace Replay** | Replays real recorded enterprise sessions through proposed policies. | On policy PR / demand | Reports would-block delta |
| **Performance Gate** | Gateway p50/p95 latency under concurrent load; registration scan latency. | Every Release Candidate | p95 ≤ 20 ms policy path |
| **Chaos & Failure Testing** | Decision core killed, control plane unreachable, hanging MCP servers. | Weekly CI | Correct fail-mode response |
| **Protocol Fuzzing** | MCP JSON-RPC message framing and Unicode text normalizer fuzzing. | Continuous | Zero panics / crashes |
| **Adaptive Red Team (RQ6)** | Attacker aware of scanner rules attempts evasion. | Every Phase Gate | Structural controls hold |

---

## 7. Failure Behaviors & Resilience

- **Decision Core Unreachable:** Enforce policies fail closed immediately (calls refused); monitor policies continue with high-priority alert.
- **Control Plane Unreachable:** The Data Plane continues enforcing the last valid, signed policy bundle in memory.
- **Upstream MCP Server Timeout / Hang:** Gateway enforces strict configurable timeouts (default 5000ms), terminates the socket, and returns a structured timeout refusal without blocking the agent process.
