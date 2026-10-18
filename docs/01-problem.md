# Problem Dossier: Kyron 2.0 — Deterministic Trust Layer for Tool-Using AI Agents

_Decoded from the Kyron 2.0 Problem Statement & Empirical Verification Research_  
_Last updated: 2026-10-17 · Version 2.0 (Verified Context & Competitive Reality)_

---

## 1. Executive Summary & Market Disparity

### The Broken Trust Chain

AI agents act through tools they cannot verify. The model reads each tool's name and description as trusted text and acts on it unconditionally. Nothing in standard production stacks:

- Verifies tool metadata before the model sees it
- Detects when tool definitions change after approval ("rug pull")
- Enforces runtime data-flow policies (information-flow control)
- Limits where data can go next (network egress budgets)
- Keeps credentials out of model prompts and client configs
- Records auditable, cryptographically signed evidence of what happened

Empirical research confirms the severity of this broken trust chain:
* **The MCPTox benchmark (AAAI 2026):** Measured tool-description poisoning across 45 real MCP servers — showing up to **72.8% attack success** on single models. More capable models are *more* susceptible because they follow tool instructions more faithfully.
* **Silent Egress in Agent Systems (arXiv 2602.22450):** Reports an alarming **0.89 silent egress success rate**, with **95% of successful exfiltration attacks completely missed** by conventional output/prompt inspection.
* **Covert-Channel Egress in Autonomous Tool Calling (arXiv 2605.20734):** Proves that attackers routinely bypass per-call rate limiters by sharding secrets across dozens of small legitimate-looking API calls.
* **Faithful Descriptions Improve Selection (TRUSTDESC, arXiv 2604.07536):** Demonstrates that clean, faithful, canonical tool descriptions actually improve agent tool-selection accuracy while stripping adversarial prompt injections.

### Market Disparity

**The asymmetry:** Platform and security teams must approve agents for production but cannot answer four basic questions:
1. Which tools can this agent see?
2. Did any of them change since approval?
3. What did they touch during the session?
4. Can we prove it to an auditor?

**The result:** Enterprises either block agents entirely (losing business value) or ship unprotected agents (accepting unacceptable data-exfiltration and compliance risks). The pilot-to-production rate for agent systems remains stalled at 11–33%, with governance, evaluation, and security cited as primary blockers — not model reasoning capability.

---

## 2. Target Personas (Primary & Secondary Only)

### Primary: Security / AppSec Lead (The Buyer)

| Attribute | Detail |
|---|---|
| **Pain** | Cannot produce a verified tool inventory, cannot detect tool drift/rug-pulls, cannot prove compliance to auditors. |
| **Workaround today** | Blocks agents or manually approves tools via spreadsheets, with no audit trail or runtime enforcement. |
| **Trigger event** | EU AI Act Article 50 transparency duties in force (Aug 2026); pilot blocked by InfoSec review. |
| **Success state** | Verified tool inventory with risk scores, drift alerts, source-attributed egress budgets, and signed audit exports. |
| **Budget owner** | Security tools budget or AI platform security budget. |

### Secondary: Platform / AI-Infra Engineer (The Champion)

| Attribute | Detail |
|---|---|
| **Pain** | Must roll agents out to multiple engineering teams; no central control point, shared API keys, ad hoc reviews. |
| **Workaround today** | Per-team wrapper scripts, manual policy files, zero runtime enforcement. |
| **Trigger event** | First data-leak incident or enterprise compliance audit request. |
| **Success state** | Drop-in custom gateway with per-team TOML policy, non-breaking monitor mode, and actionable error remediation. |
| **Budget owner** | Platform engineering or DevOps budget. |

> **Relegated to background context:** Agent developers (want zero friction), Compliance owners (want exports), End users (want safety), MCP server maintainers (want scanning). All are addressed as side effects; only the primary and secondary personas shape core architecture.

---

## 3. Incumbent Limitations & Competitive Landscape Reality

A critical market finding is that **scanning, hash pinning, and quarantine are already available as standalone free tools**. Therefore, a standalone registry scanner is commoditized and cannot serve as the sole defensive moat. 

Kyron 2.0's defensible moat is **architectural completeness across all 7 stages**: combining pre-execution tool trust, in-process recoverable data-flow control, source-attributed egress budgets, automated secret brokering, and cryptographically signed audit evidence — verified against both MCP-Scan and OpenAPPA.

| Competitor / Incumbent | What it does | Critical Gap vs Kyron 2.0 |
|---|---|---|
| **MCP-Scan** (Invariant Labs / Snyk) | Standalone tool-poisoning detection, hash pinning for rug pulls, proxy mode | Standalone scanner/proxy; lacks in-flight recoverable data-flow algebra, has no source-attributed egress budgets, no automated secrets brokering, and no signed compliance audit chains. |
| **Archestra / OpenAPPA** (Direct Competitor) | Open-source Rust IFC library (MIT, v0.12.0) with commercial paid tier sold by Archestra | Sits strictly at data-flow level; trusts upstream tool contracts; lacks pre-execution tool verification, runtime OS-level execution tracing, network egress budgets, credential brokering, and signed compliance export. Preview/RFC wire format subject to breaking changes. |
| **Pipelock / Gravitee / Peta** | Point solutions for drift pinning, quarantine, and credential vaulting | Fragmented point products; no unified MCP gateway, no recoverable data-flow lattice, no covert-channel exfiltration prevention. |
| **Model Armor** | Screens tool-call traffic only (prompt/message filtering) | Purely probabilistic input/output filter; easily bypassed by paraphrase; blind to tool registration, network egress, and credential leakage. |
| **LLM Guardrails** (Lakera, Prompt Security) | Probabilistic prompt filters | 150–500ms latency overhead; easily bypassed by encoding/paraphrase (MCPTox >70% bypass); zero tool metadata inspection or network egress mediation. |
| **Kyron 1.0** (`agentic_security` project) | 4-stage cascade (RBAC, rules, TurboQuant ML, Groq LLM judge); SOC console; Python SDK | Python hot-path with selective LLM judge latency; no MCP-native gateway; no tool registration/pinning; no egress broker; no secrets broker; no signed audit chain. |

---

## 4. Judging Rubric Alignment

| Rubric Axis | How Kyron 2.0 Scores |
|---|---|
| **Innovation** | First unified system to cover all 7 stages of tool execution deterministically; canonical description synthesis (validated by TRUSTDESC); source-attributed multi-call egress budgets; OpenAPPA in-process adapter. |
| **Impact** | Unblocks enterprise agent deployments (11–33% → production-ready); satisfies EU AI Act Article 50; eliminates silent exfiltration (arXiv 2602.22450); empirical head-to-head comparison against MCP-Scan and OpenAPPA. |
| **Craft** | Custom Go 1.23+ MCP gateway built from scratch (stdio + SSE); pure Rust 1.80+ deterministic policy engine (< 5ms); Ed25519 signed hash-chained audit store; comprehensive property-based test suite. |
| **Technical Depth** | Full formal 20-gap matrix; 6 concrete attack fixtures (S1–S6) tested in CI; 6 research questions with measurement arms; zero model tokens on hot path. |

---

## 5. Explicit Technical Constraints

- **Protocols:** Native MCP over stdio (JSON-RPC 2.0 subprocesses) and streaming HTTP/SSE.
- **Platform:** Linux, macOS, and Windows; static binaries (`kyron` CLI + gateway); minimal Docker images.
- **Core Languages:** Go 1.23+ (custom gateway & brokers), Rust 1.80+ (scanner, pinning, policy engine, OpenAPPA adapter), Python 3.12 (control plane & eval harness).
- **License:** MIT License across the entire codebase.
- **Policy Definition:** Declarative TOML compiled to Rust structs with runtime schema validation.
- **Performance:** p95 hot-path evaluation latency ≤ 5 ms; gateway proxy overhead < 15 ms.
- **Credentials:** Zero credential strings visible in model prompts, context transcripts, or client configs.
- **Compatibility:** Works out-of-the-box with stock MCP clients (Claude Desktop, Cursor, LangChain, CrewAI).
- **Rollout:** Non-breaking monitor/shadow mode by default with actionable structured remediation.
- **Non-goals:** Model parameter fine-tuning; content moderation; verifying internals of closed third-party remote SaaS backends.

---

## 6. Ten Problem Classes (Re-scoped Priority Map)

Based on empirical verification, **Phase 0 is re-scoped to front-load the primary differentiators** (custom gateway, egress budgets, secrets broker, signed audit, and OpenAPPA adapter):

| ID | Failure Class | Priority | Implementation Scope |
|---|---|---|---|
| P1 | Tool-description poisoning | **MUST (P0)** | Registry firewall: static rules + vector outlier check + canonical description synthesis. |
| P2 | Rug pull / tool drift | **MUST (P0)** | SHA-256 hash pinning; real-time drift detection on registry refresh; visual diffs. |
| P3 | Indirect injection to exfiltration | **MUST (P0)** | In-process OpenAPPA adapter: prospective label check + result admission. |
| P4 | Contract mismatch (lying tool) | **SHOULD (P2)** | Local sandbox + Aya/eBPF process tracing vs declared tool contract. |
| P5 | Covert / sharded exfiltration | **MUST (P0)** | Custom Go Egress Broker: source-attributed byte, rate, and distinct-request budgets. |
| P6 | Authority / credential sprawl | **MUST (P0)** | Custom Go Secrets Broker: JIT credential injection, model-traffic secret redaction. |
| P7 | Check-then-use races (TOCTOU) | **COULD (P2)** | Resource-identity content hash re-binding at execution time. |
| P8 | Memory / cross-agent trust | **WON'T (P3)** | Gated memory state transitions with origin, TTL, and promotion rules. |
| P9 | Security tax (utility loss) | **MUST (P0)** | Non-breaking monitor mode; sub-5ms Rust hot path; zero model tokens. |
| P10 | Evidence gap / compliance audit | **MUST (P0)** | Ed25519 signed, SHA-256 hash-chained audit log; EU AI Act Article 50 ready. |
