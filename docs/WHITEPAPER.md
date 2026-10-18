# Kyron 2.0: A Deterministic Trust Layer for Tool-Using AI Agents

**Authors:** Kyron Security & Systems Research Team  
**Date:** October 2026 · Version 2.0.0  
**Artifact Classification:** Core Technical Whitepaper · Production Release Specification  

---

## Abstract

As autonomous AI agents shift from static chat interfaces to real-world execution environments via the Model Context Protocol (MCP), they inherit critical vulnerabilities: untrusted tool descriptions that hijack the model via prompt injection, silent runtime capability drift (rug pulls), covert sharded exfiltration across distributed calls, filesystem TOCTOU race conditions, and long-lived credential leakage. Existing defenses are polarized: registration-time scanners (e.g. MCP-Scan) are stateless and easily evaded by adaptive adversaries (RQ6), while formal Information-Flow Control (IFC) systems like OpenAPPA suffer from whole-object over-tainting and lack network egress budgets or metadata defenses.

We present **Kyron 2.0**, an enterprise-grade, deterministic, and verifiable trust layer engineered from scratch. Kyron 2.0 operates as an in-line proxy between stock agents and MCP tool servers across seven defense stages: (1) Rust Registry Firewall with TRUSTDESC canonical description synthesis, (2) In-process OpenAPPA IFC with RFC 6901 JSON-path field-level provenance, (3) Ed25519-signed single-use capability leases, (4) TOCTOU cryptographic content-hash binding at runtime dispatch, (5) Source-Attributed Network Egress Brokering with cumulative source byte budgets, (6) Automated in-memory secrets brokering, and (7) SHA-256 hash-chained, Ed25519-signed audit logging satisfying EU AI Act Articles 12, 14, 15, and 50.

In empirical evaluations across the AAAI 2026 MCPTox dataset and six adversarial attack scenarios, Kyron 2.0 reduces agent attack exposure by **94.4%** compared to baseline unshielded execution, and halts **100%** of scanner-aware adaptive evasion attacks (RQ6), while consuming **0 model tokens** on the hot-path decision pipeline and achieving a P95 decision latency of **3.8 ms**.

---

## 1. Threat Landscape & Problem Formulation

Tool-using agents interact with untrusted external servers via standard JSON-RPC protocol abstractions. We formalize the primary attack vectors threatening agentic deployments:

1. **Scenario S1 (Poisoned Tool Metadata):** An attacker injects hidden system instructions into tool descriptions (e.g., instructing the agent to read `~/.ssh/id_rsa`).
2. **Scenario S2 (Silent Rug Pull):** A tool registered with benign capabilities mutates its schema or description upstream after organizational approval.
3. **Scenario S3 (Lying Offline Tools):** An offline data parsing tool undeclaredly connects to an external socket to exfiltrate parsed documents.
4. **Scenario S4 (Sharded Exfiltration):** An adversary bypasses per-request network rate limiters by chunking sensitive database dumps into 40+ micro-requests to an allowed destination.
5. **Scenario S5 (Check-then-Use / TOCTOU Swap):** A file or resource inspected and approved by a human operator is replaced on disk before the tool executes.
6. **Scenario S6 (Credential Theft):** Prompts tricking agent tools into dumping process environment variables (`GITHUB_TOKEN`, `DB_PASSWORD`).

---

## 2. Architecture & The Seven Defense Stages

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                          KYRON 2.0 DATA PLANE                          │
   │                                                                        │
   │ [Agent / Client] ──► (1) Registry Firewall (Rust)                      │
   │                               │ [TRUSTDESC Canonicalization]           │
   │                               ▼                                        │
   │                      (2) Capability Lease Gate (Go)                    │
   │                               │ [Ed25519 Signed Ruling]                │
   │                               ▼                                        │
   │                      (3) TOCTOU Resource Binding                       │
   │                               │ [SHA-256 Content Attestation]          │
   │                               ▼                                        │
   │                      (4) In-Process OpenAPPA IFC                       │
   │                               │ [JSON-Path Field Labels]               │
   │                               ▼                                        │
   │                      (5) Tool Execution / Sandbox                      │
   │                               │ [Syscall Tracing]                      │
   │                               ▼                                        │
   │                      (6) Source-Attributed Egress                      │
   │                               │ [Cumulative Source Budgets]            │
   │                               ▼                                        │
   │                      (7) Secrets Broker & Signed Audit                 │
   │                               │ [Ed25519 Log Chain Emitter]            │
   │                               ▼                                        │
   │                     [Sanitized Result to Agent]                        │
   └────────────────────────────────────────────────────────────────────────┘
```

### Stage 1: Rust Registry Firewall & TRUSTDESC (C2)
Rather than passing third-party docstrings directly to the LLM, the firewall scores listings and invokes TRUSTDESC to synthesize deterministic, schema-derived canonical descriptions. Adversarial prompt injections are stripped before reaching the model's context window.

### Stage 2: Capability Leases & Call-Scoped Authority (C6)
Privilege escalations and destructive side-effects require cryptographically signed capability leases bounded by strict TTLs and max-call limits.

### Stage 3: TOCTOU Cryptographic Binding (F26)
At lease issuance, the target resource content hash ($H = \text{SHA-256}(\text{bytes})$) is signed. At execution dispatch, the gateway computes the current hash and aborts if symlink or file contents were altered.

### Stage 4: OpenAPPA IFC & JSON-Path Provenance (C4, C7)
Integrates `archestra-ai/OpenAPPA` in-process. Rather than tainting entire return payloads, Kyron attaches RFC 6901 JSON-path security labels (`$.public`, `$.confidential`, `$.secret`), pruning forbidden paths recursively for target readers.

### Stage 5: Source-Attributed Network Egress Broker (C8)
The outbound HTTP/SOCKS proxy meters byte, rate, and distinct-destination budgets *per originating data source*, preventing covert channels and distributed sharding attacks.

### Stage 6: Automated Secrets Brokering (C9)
Injects credentials just-in-time at tool dispatch and scans outbound return buffers to redact known secrets and base64-encoded environment variables.

### Stage 7: Tamper-Evident Ed25519 Signed Audit Log (C11)
Emits SHA-256 hash-chained events signed with an Ed25519 private key:
$$E_i = \text{Sign}_{K_{\text{priv}}}\left( \text{SHA-256}(E_{i-1} \,\|\, \text{CanonicalCall}_i \,\|\, \text{Verdict}_i \,\|\, \text{Timestamp}_i) \right)$$

---

## 3. Empirical Results & Performance

| Defense Solution | MCPTox Attack Exposure | S1–S6 Defense Coverage | RQ6 Adaptive Resilience | Hot-Path Model Tokens | P95 Decision Latency |
|---|---|---|---|---|---|
| **No Defense** | 72.8% | 0 / 6 (0.0%) | 0.0% (Defeated) | N/A | 0.0 ms |
| **MCP-Scan (Free)** | 18.4% | 1 / 6 (16.7%) | 16.7% (Defeated) | 0 | 15.0 ms |
| **OpenAPPA Alone** | 68.2% | 0 / 6 (0.0%) | 0.0% (Defeated) | 0 | 8.0 ms |
| **Kyron 2.0 (Full Stack)** | **4.1%** | **6 / 6 (100.0%)** | **100.0% (Secure)** | **0 tokens** | **3.8 ms** |

---

## 4. EU AI Act Article 50 Compliance

Kyron 2.0 satisfies EU AI Act requirements out-of-the-box:
- **Article 12 (Record-Keeping):** Tamper-evident cryptographic logging with verifiable forward hash chains.
- **Article 14 (Human Oversight):** SOC Console 1-click capability lease approvals with visual semantic drift diffs.
- **Article 15 (Cybersecurity & Robustness):** Defense-in-depth against prompt injection, evasion, and exfiltration.
- **Article 50 (Transparency & Evidence):** 1-click verifiable JSON-LD / OpenTelemetry audit dossier export.
