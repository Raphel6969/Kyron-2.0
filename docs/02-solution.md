# Solution Design: Kyron 2.0

_Formulated from the Kyron 2.0 PS, the Kyron 1.0 (`agentic_security`) architecture, and Empirical Verification Findings._  
_Oct 17, 2026 · Version 2.2 — Complete Specification & Architectural Master_

---

## 1. Empirical Verification Results & Strategic Realignment

A rigorous investigation into existing tools, published academic literature, and open-source ecosystems revealed critical realities that reshape our technical strategy:

| Item Verified | Empirical Finding | Architectural & Strategic Impact |
|---|---|---|
| **OpenAPPA License & Health** | MIT License on GitHub (`archestra-ai/OpenAPPA`). Active project: ~1.6k stars, 66 forks, 793 commits, tagged v0.12.0. | Clean `cargo` dependency without license friction. |
| **OpenAPPA Status & Competitor** | Explicitly labelled **"preview and RFC"** with configs and wire surfaces that "may break without shims". Archestra sells a commercial paid tier for its OpenAPPA integration (PR dated Oct 9, 2026). | **Archestra is a direct commercial competitor.** The `core/openappa-adapter/` abstraction layer is strictly mandatory to isolate Kyron from upstream API churn. |
| **Policy Language** | Declarative TOML, decided from the event log alone. | Locks TOML compiled into Rust structs; eliminates YAML/Rego complexity. |
| **Competitive Landscape** | **MCP-Scan** (Invariant Labs / Snyk) already performs tool-poisoning detection, hash pinning for rug-pulls, and runs as an MCP proxy. **Pipelock**, **Gravitee**, and **Peta** cover drift pinning, quarantine, and credential vaulting. **Model Armor** screens tool-call traffic only. | **Tool scanning, pinning, and quarantine alone are commoditized free tools.** A standalone registry scanner is not a defensible moat. |
| **The TRUE Defensible Moat** | The defensible product is the **synergistic combination of all 7 execution stages**: Tool Trust + In-flight Data Flow (OpenAPPA) + Source-Attributed Egress + Secrets Brokering + Signed Audit Evidence, verified against MCP-Scan and OpenAPPA. | **Re-scope Phase 0 to front-load egress budgets, secrets brokering, signed audit, and the OpenAPPA adapter, accompanied by a published benchmark comparison at Gate 0.** |
| **Canonical Descriptions** | **TRUSTDESC (arXiv 2604.07536)** confirms that faithful, canonical tool descriptions improve tool-selection accuracy while stripping adversarial injections. | Validates Kyron's canonical description generator; retains RQ1 accuracy sub-metric. |
| **Silent Egress & Exfiltration** | **arXiv 2602.22450** reports an alarming **0.89 silent egress rate**, with **95% of successful attacks missed** by output/prompt checks. **arXiv 2605.20734** models covert-channel egress in tool-using agents. | Proves that output/prompt filters fail; validates our custom Egress Broker with source-attributed budgeting. |
| **Literature Cleanup** | `claude -p` claim unverified (removed). `AgentSecBench` refers to multiple conflicting benchmarks (dropped in favor of MCPTox AAAI 2026 and our S1–S6 suite). | Keeps all architectural documentation strictly truthful and scientifically defensible. |

---

## 2. Core Design Principles

1. **The Model Proposes; Kyron Decides.** The agent never holds authority, capability leases, or raw credentials. All security state lives strictly outside the prompt and context transcript.
2. **Deterministic by Default.** Security decisions are computed via pure policy lookups and cached recovery plans in single-digit milliseconds. A small model is the last resort (for residual ambiguity only) and never sits on the hot path. The split is measured, not assumed.
3. **Verify Reality, Not Declarations.** Tool metadata is scanned, pinned, and rewritten into canonical descriptions; local tools are traced via OS sandboxes/eBPF; network egress is metered at the gateway.
4. **Gateway First.** Everything in the primary release functions out-of-the-box with stock, unmodified MCP clients over stdio and HTTP/SSE. Features requiring model context control arrive in the SDK tier.
5. **Compose, Do Not Rebuild.** OpenAPPA supplies data-flow lattice semantics behind an adapter. Kyron delivers the essential runtime layers around it: pre-execution tool verification, runtime egress budgets, and secrets brokering.
6. **Monitor Before Enforce.** Every policy can run in non-blocking shadow/monitor mode to log would-block telemetry without disrupting live workflows, and be replayed against recorded session traces.
7. **Bounded Everything.** Trajectory forks, recovery steps, authority requests, delegation depth, and egress bytes have strict, hard quotas that terminate hostile loops without consuming model tokens.
8. **Evidence is a Product.** Every verdict is cryptographically signed, hash-chained, ordered, and exportable for regulatory compliance (EU AI Act Article 50).
9. **Transparent Limitations.** Remote third-party servers are treated as black boxes; detectors can be evaded; and zero observed benchmark attacks is evidence, not formal mathematical proof.

---

## 3. Technical Moat & The 7-Stage Architecture

### The Unfair Advantage: All-Seven-Stages Coverage

Every existing market solution guards *one* stage of the call path and leaves the rest to the buyer. Kyron 2.0 provides continuous, deterministic enforcement across all seven stages:

```
  Stage 1: REGISTER   ──► Scanner & Hash Pinning: tool scanned, scored, quarantined if risky.
  Stage 2: EXPOSE     ──► Tool Projection: model sees only approved tools & canonical descriptions.
  Stage 3: PROPOSE    ──► Model proposes call; parameters parsed into canonical call structure.
  Stage 4: DISPATCH   ──► Deterministic Policy Engine (Rust + OpenAPPA): capability lease & data-flow check.
  Stage 5: EXECUTE    ──► Secrets Broker injects JIT credentials; local sandbox traces execution.
  Stage 6: ADMIT      ──► Result Admission: realized output checked against labels & effect ledger.
  Stage 7: EGRESS     ──► Egress Broker: destination, redirects, DNS, and source-attributed byte budgets.
```

---

## 4. Complete Feature Inventory (F01 – F38)

| ID | Feature Name | Origin | Phase | Description |
|---|---|---|---|---|
| F01 | Tool Scanner | Research (MCPTox) | P0 | Manifest rules, embedding outlier check, offline model judge, risk score (0.0–1.0) with human rationales. |
| F02 | Hash Pinning & Drift Detection | Industry Practice | P0 | SHA-256 hash pinning of normalized text, schema, and server identity. Automatic quarantine on drift. |
| F03 | Canonical Descriptions | New (TRUSTDESC arXiv 2604.07536) | P0 | Rewrites raw description into clean text synthesized from schema; model never reads raw server text. |
| F04 | Quarantine & Approval Workflow | New in 2.0 | P0 | Tools default to quarantine unless explicitly approved or auto-approved by strict policy thresholds. |
| F05 | Cross-Tool Shadowing Checks | Research (MCPTox) | P1 | Flags duplicate names, overlapping verbs, and parameter shadowing across tools. |
| F06 | Server Identity & Signed Manifests | New in 2.0 | P2 | Cryptographic server attestation with signed tool manifests. |
| F07 | Two-Gate Reference Monitor | OpenAPPA | P0 | Prospective check at dispatch + admission check on realized return results. |
| F08 | Label Lattice | OpenAPPA | P0 | Reader principal set + trust level (0–255), combined via algebraic meet. |
| F09 | Tool Contracts | OpenAPPA | P0 | Declares label contributions, effect tokens, preconditions, allowed files, and network destinations. |
| F10 | Effect History & Workflow Rules | OpenAPPA | P1 | Enforces sequences (e.g. `read_terms` must precede `sign_document`; `commit` must happen once). |
| F11 | Gradual Typing & Fail-Closed Casts | OpenAPPA | P1 | Manages unknown external sources with declared trust ceilings; fails closed on type mismatch. |
| F12 | Structured Refusals | OpenAPPA | P0 | Block verdicts return machine-readable gap lists and legal recovery routes. |
| F13 | Recovery Routes Engine | OpenAPPA | P1 | Automatically evaluates legal remedies: accept narrowing, authority ruling, prerequisite tool, sanitizer. |
| F14 | Call-Scoped Authority | OpenAPPA | P1 | Issues single-use rulings valid only for the exact rendered call. |
| F15 | Trajectory Confinement | OpenAPPA | P3 (SDK) | Forks an isolated child branch and returns a sanitized or typed result. |
| F16 | Multi-Tier Deployment | OpenAPPA | P0/P3 | Protocol gateway (P0), authority service (P1), and inference harness (P3). |
| F17 | Memoized Recovery Cache | Kyron 1.0 | P2 | Precomputes and caches recovery plans keyed by composite state fingerprint. |
| F18 | Capability Leases | Kyron 1.0 | P1 | Signed, expiring, scoped grants covering safe repeated loops without approval fatigue. |
| F19 | Dynamic Tool Projection | Kyron 1.0 | P0 | Intercepts `tools/list`; model sees only currently permitted and active tools. |
| F20 | Task Profiles | Kyron 1.0 | P1/P3 | Admin-declared tool bundles; later inferred in suggest-only mode. |
| F21 | JSON-Path Field Provenance | Kyron 1.0 | P2 | Fine-grained field-level provenance labels on structured JSON outputs. |
| F22 | Effect Ledger & Reconciliation | Kyron 1.0 | P2 | Records `Committed` vs `Indeterminate` outcomes with idempotency keys. |
| F23 | Context DAG & Minimal Forks | Kyron 1.0 | P3 (SDK) | Branches child agents with stripped context transcripts to stop prompt injection propagation. |
| F24 | Contract-vs-Runtime Attestation | Kyron 1.0 | P2 | Local sandbox with Aya/eBPF kernel tracing diffing observed syscalls against declared contracts. |
| F25 | Source-Attributed Egress Broker | Kyron 1.0 (arXiv 2605.20734) | P0 | Enforces byte, rate, and distinct-request budgets aggregated *per data source*. |
| F26 | TOCTOU Resource Binding | Kyron 1.0 | P2 | Binds human approval to resource content hash, re-verified at execution time. |
| F27 | Hard Resource Budgets | Kyron 1.0 | P1 | Caps child branches, recovery steps, authority requests, and delegation depth. |
| F28 | Signed Inter-Agent Messages | Kyron 1.0 | P3 | Verifies peer agent messages; a peer's assertion is never treated as authority. |
| F29 | Gated Memory Transitions | Kyron 1.0 | P3 | Long-term memory writes governed by origin, TTL, and promotion rules. |
| F30 | Risk-Adaptive Isolation | Kyron 1.0 | P3 | Dynamic execution tiers: inline, field-level, isolated child container, or hard block. |
| F31 | Automated Secrets Broker | New in 2.0 | P0 | JIT token injection at tool dispatch; automated redaction of credentials from model traffic. |
| F32 | Monitor Mode & Trace Simulation | New in 2.0 | P0/P1 | Shadow evaluation mode; replays recorded traces against proposed TOML policies. |
| F33 | Cryptographic Audit Log | New in 2.0 | P0 | Ed25519-signed, SHA-256 hash-chained immutable audit log with OpenTelemetry export. |
| F34 | Vulnerable Lab & CI Replay | New in 2.0 | P0 | Deliberately vulnerable servers (S1–S6 fixtures) replayed in CI on every push. |
| F35 | Contract & Policy Linting | New in 2.0 | P1 | Static analysis tool verifying policy soundness, reachability, and absence of deadlocks. |
| F36 | OpenAPPA Contract Importer | New in 2.0 | P0 | In-process translator between Kyron tool metadata and OpenAPPA algebraic contracts. |
| F37 | Modernized SOC Console UI | Kyron 1.0 | P1 | React 18 dashboard: tool inventory, semantic drift visual diffs, and 1-click approvals. |
| F38 | Agent-Code Provenance Gate | Research (SWE-chat) | P3 | Verifies authorship and security boundaries for coding agents writing repository code. |

---

## 5. Customer Usability & Enterprise Feasibility

| Company Headache | How Existing Solutions Fail | Kyron 2.0 Usability Solution |
|---|---|---|
| **High Integration Friction** | Demands rewriting agent code, adopting proprietary SDKs, or swapping LLM orchestration frameworks. | **Zero-Code Drop-In Proxy:** Kyron terminates standard MCP stdio and HTTP/SSE transparently. Works out-of-the-box with LangChain, LlamaIndex, Claude Desktop, Cursor, and custom agent loops without modifying a single line of agent code. |
| **Fear of Production Breakage** | Security teams cannot enforce policies because blocking false positives halts revenue-generating workflows. | **Safe Progressive Rollout (Monitor Mode First):** Every policy deploys in non-blocking shadow mode first. Platform teams receive full "would-block" telemetry and audit logs to tune policies with zero risk of breaking live workflows. |
| **Cryptic "Permission Denied" Errors** | When a call is blocked, the agent crashes or enters an infinite retry loop because the error message is opaque. | **Actionable Remediation & Explainability:** The gateway returns structured JSON errors explaining the exact violated rule, why it triggered, suggested alternative tools, and an instant human-approval escalation URL. |
| **Silent Tool Drift & "Rug Pulls"** | Third-party MCP servers update their tools, silently injecting new capabilities, prompt instructions, or schema changes. | **Semantic Drift Intelligence & Review Workflows:** Automatic SHA-256 hash checking on every registry refresh. If a tool changes, it is quarantined immediately, and the SOC console renders a visual semantic diff for one-click approval. |
| **Secret & Credential Leakage** | Developers accidentally pass raw API keys or database credentials into LLM prompts or MCP client config files. | **Automated Secrets Broker:** Credentials remain strictly within Kyron's broker. Dynamic, scoped, short-lived tokens are injected directly into tool requests at execution time and redacted from model-visible traffic. |
| **Distributed / Sharded Exfiltration** | Attackers evade per-call rate limiters by chunking stolen data across dozens of tiny legitimate calls. | **Source-Attributed Egress Budgets:** Tracks egress volume aggregated by the data source classification over the lifetime of a trajectory, terminating the session once the source budget is exceeded. |

---

## 6. Execution Lifecycle, Recovery & Escalation

### Tool Call Lifecycle (9 Steps, Model Token Accounting)

```
  Step 1: Agent proposes tool call (name, args)                [Agent's own tokens]
  Step 2: Gateway renders call & computes canonical hash       [0 model tokens]
  Step 3: Policy engine evaluates rules & prospective labels   [0 model tokens]
  Step 4: Verdict issued (Allow, Block, or Escalate)           [0 model tokens on hit]
  Step 5: Secrets broker injects short-lived scoped tokens     [0 model tokens]
  Step 6: Tool executes (sandbox tracing or remote proxy)      [0 model tokens]
  Step 7: Egress broker meters outbound destination & bytes    [0 model tokens]
  Step 8: Admission check on result & effect ledger update     [0 model tokens]
  Step 9: Typed sanitized result returned with signed audit    [Agent's own tokens]
```

### Four-Tier Escalation Ladder

1. **Class 1 — Policy Lookup:** Pure deterministic in-memory lookup. (0 model tokens, < 5ms).
2. **Class 2 — Cached Recovery Plan:** Precomputed recovery plan matching composite state fingerprint. (0 model tokens, < 10ms).
3. **Class 3 — Residual Ambiguity:** Narrow offline verifier (e.g., verifying whether free text contains customer PII). Small model, off critical path (< 200ms); output is an input to a deterministic verdict, never the verdict itself.
4. **Class 4 — High-Risk or Exceptional:** Immediate human escalation or authority ruling within a declared mandate.

### Six Legal Recovery Routes

* **Accept Narrowing:** Acknowledge label shrinkage when policy explicitly permits utility reduction.
* **Authority Ruling:** Human or small verifier approves the exact rendered call once.
* **Prerequisite Tool:** Automatically executes a safe prerequisite tool that commits a required effect token.
* **Sanitizer or Cast:** Invokes a registered sanitization transform to scrub sensitive data to a declared ceiling.
* **Fork with Schema Attestation (SDK Tier):** Forks a child agent to process untrusted data, returning only bounded typed fields.
* **Fork with Sanitizer (SDK Tier):** Forks a child agent to process confidential data, returning scrubbed text.

### Cache Soundness Rule
A recovery plan is cached strictly under a composite state fingerprint consisting of: `policy_version`, `label_class`, `provenance_class`, `tool_id`, `arg_class`, `recipient_class`, `workflow_state`, and `lease_set`. The cache is invalidated immediately whenever policy changes, a capability lease expires, or the effect ledger updates.

---

## 7. Capability Tiers & Deployment Topologies

### Three Capability Tiers

* **Tier A — Gateway (Stock Clients):** Intercepts stdio and HTTP/SSE MCP traffic. Delivers registry firewall, canonical descriptions, policy engine, source-attributed egress budgets, secrets broker, and signed audit. Covers remote and local tools without modifying agent code.
* **Tier B — Sandbox (Local Tools):** Linux namespace/container isolation with Aya/eBPF syscall tracing. Verifies runtime tool behavior against declared contracts and enforces TOCTOU resource identity bindings.
* **Tier C — SDK (Custom Agent Loops):** Python and TypeScript libraries for teams controlling the agent execution loop. Provides minimal-context forks, context DAGs, and confinement sandboxing.

### Four Deployment Shapes

1. **Local Binary:** Single static executable (`kyron run -- <agent>`) wrapping stdio MCP servers on developer workstations. Monitor mode by default.
2. **Sidecar:** Deployed alongside agent microservices in Kubernetes pods / container groups. Enforces per-service policies with zero shared points of failure.
3. **Central Gateway:** High-throughput cluster service terminating enterprise MCP traffic with unified inventory and audit streams.
4. **Hosted Control Plane + Customer Data Plane:** Cloud-hosted UI and policy management with all tool traffic and sensitive data remaining strictly within the customer's VPC.

---

## 8. Concrete Attack Scenarios (CI Acceptance Fixtures)

| Scenario | Attack Vector | Kyron 2.0 Mechanism | CI Fixture |
|---|---|---|---|
| **S1 Poisoned Time Tool** | Tool description directs model to read private key and exfiltrate in note field. | Registry firewall flags at scan; canonical description delivered to model; egress broker halts exfiltration. | `lab/s1_poison.py` |
| **S2 Rug Pull** | Tool gains hidden malicious instructions after initial approval. | SHA-256 hash change detected on refresh; tool quarantined; side-by-side diff shown in SOC console. | `lab/s2_rugpull.py` |
| **S3 Lying Tool** | Tool declares no network access but attempts external CRM exfiltration. | Egress broker blocks undeclared destination; local sandbox raises violation event. | `lab/s3_lying.py` |
| **S4 Sharded Exfiltration** | Prompt injection shards stolen secret across 40 tiny requests to an allowed API. | Egress broker aggregates byte and request budgets *per data source*, halting the session. | `lab/s4_shard.py` |
| **S5 TOCTOU Swap** | Approved file path swapped to sensitive symlink before tool executes. | Resource-identity content hash re-verified at execution; mismatch rejected. | `lab/s5_toctou.py` |
| **S6 Credential Theft** | Prompt injection instructs agent to print environment variables. | Secrets broker isolates credentials from model context; redacts known secrets from traffic. | `lab/s6_cred.py` |

---

## 9. Gate 0 Milestone: Head-to-Head Comparison

Before closing Phase 0, Kyron 2.0 must publish a reproducible benchmark comparison table evaluating:
1. **No Defense (Baseline)**
2. **MCP-Scan (Invariant Labs / Snyk)**
3. **OpenAPPA Alone (Archestra AI)**
4. **Kyron 2.0 (Phase 0 Core)**

Across the 6 concrete attack fixtures (S1–S6) and the MCPTox benchmark, proving that only Kyron's synergistic architecture defeats sharded exfiltration (S4), credential theft (S6), and tool poisoning (S1) without breaking agent utility.

---

## 10. Positioning Statement

> _For enterprise platform and security teams running AI agents with MCP tools, **Kyron 2.0** is the only deterministic trust layer that verifies tool metadata before the model sees it, restricts in-flight data flows and network egress at runtime, isolates credentials, and cryptographically signs audit evidence — without altering agent code or relying on probabilistic LLM guardrails._

* **Against MCP-Scan:** MCP-Scan is a metadata scanner; Kyron provides end-to-end runtime data-flow control, source-attributed egress budgets, and secrets brokering.
* **Against Archestra / OpenAPPA:** Archestra is a direct commercial competitor operating strictly at the data-flow algebra layer; Kyron integrates OpenAPPA while adding the pre-execution tool verification, egress controls, secrets broker, and SOC management plane Archestra lacks.
* **Against Prompt Guardrails:** Deterministic (< 5ms Rust core, 0 model tokens on hot path) vs probabilistic, jailbreakable prompt classifiers that fail against paraphrase attacks.
