# Kyron 2.0 — 3:45 Video Demo & Technical Pitch Script

**Target Duration:** 3 minutes 45 seconds (fits cleanly inside a 3–4 minute slot)
**Screen Setup:** Left/Main 70% = Browser (`http://127.0.0.1:5173` or Render URL) · Right 30% or Alt-Tab = Terminal (`python demo/run_live_demo.py --interactive`)
**Pre-Recording Step:** Run `.\scripts\reset-demo.ps1` and start on the **Landing Page** (`/`).

---

## Beat 1 — The Hook & Problem Statement (0:00 – 0:30)
**On Screen:** Kyron 2.0 Landing Page (`/`) showing the animated interception diagram (`Agent -> Protocol Gateway -> 7 Deterministic Gates -> Tool Server`).

**What to Say:**
> "Enterprise teams want AI agents that use real tools — GitHub, Postgres, AWS, Slack. Today, 67% to 89% of those pilots get blocked by security reviews. Why? Two empirical failures:
> 1. In the **MCPTox benchmark (AAAI 2026)**, tool-description poisoning achieved up to a **72.8% attack success rate** — and smarter reasoning models actually obey poisoned instructions *more* faithfully.
> 2. **Silent egress research** shows agents can drip-exfiltrate secrets across dozens of tiny tool calls, bypassing per-call firewalls **95% of the time**.
>
> Most startups solve this by wrapping an LLM-as-a-judge around every call — burning double the tokens, adding hundreds of milliseconds, and still getting prompt-injected.
> **This is Kyron 2.0: a deterministic trust layer in Go, Rust, and Python with zero model tokens on the hot path and sub-4 millisecond p95 latency.**"

**Action (0:28):** Click **Launch Verification Console** → select **Enterprise Security Lead** (or OAuth login) to enter `/console`.

---

## Beat 2 — Command Overview & Semantic Drift Firewall (0:30 – 1:15)
**On Screen:** Command Center (`01 / Operations`) → click **Tool Registry** (`02 / Security Controls`).

**What to Say:**
> "Every tool server sits behind Kyron's custom **MCP Protocol Gateway**. Look at the Tool Registry: we have 30+ verified enterprise tools, and right away two tools are held in **QUARANTINE**: `time:get_time` (Risk 92%) and `currency:converter` (Risk 88%)."

**Action (0:45):** Click **Diff** on `currency:converter` (or `time:get_time`) to open the **Semantic Drift Inspection Modal**.

**What to Say:**
> "This is a classic **Monday-to-Friday rug pull**. On Monday, `converter` was cryptographically pinned with SHA-256. On Friday, the upstream server silently mutated the description to steal exchange arbitrage or forward user tokens.
> Kyron catches the SHA-256 hash mismatch instantly, quarantines the tool, and uses **TRUSTDESC** to project a safe, schema-derived canonical description to the LLM — so the model *never* reads the attacker's raw text."

**Action (1:05):** Switch briefly to terminal and press **Enter** to run **Case 1** (`case1_semantic_drift_and_trustdesc.py`), scanning a brand-new poisoned `billing_export` tool live via `POST /v1/tools/scan`, then click the refresh icon in Tool Registry to watch `demo-vendor:billing_export` appear in **QUARANTINED** state live.

---

## Beat 3 — Defeating TOCTOU Swaps, Sharded Exfiltration & Capability Leases (1:15 – 2:10)
**On Screen:** Terminal runs **Case 2** & **Case 3**; then switch Browser to **Authority Queue** and **Network Egress**.

**Action (1:15):** Press **Enter** in terminal to run **Case 2** (`case2_toctou_and_capability_lease.py`).

**What to Say:**
> "Static scanners like MCP-Scan stop at manifest inspection. They fail completely on runtime exploits.
> Watch **Case 2 — TOCTOU Resource Binding**: An agent gets approval to read `/tmp/monthly_report.txt`. Between approval and execution, an attacker swaps the file with `/etc/shadow`. Kyron binds the SHA-256 content hash at approval time via `/v1/resources/bind` and re-verifies at execution via `/v1/resources/verify` — catching the swap deterministically in under 3 milliseconds."

**Action (1:35):** In the Browser, click **Authority Queue** (`03`) and click **Grant Capability Lease** on `k8s:restart_deployment`.

**What to Say:**
> "For high-risk operations like restarting Kubernetes production pods, Kyron issues an **Ed25519-signed, single-use, call-scoped capability lease** — expiring in 120 seconds and consumed atomically on dispatch."

**Action (1:50):** Press **Enter** in terminal to run **Case 3** (`case3_egress_and_sharded_exfil.py`), then click **Network Egress** (`04`) in the Browser.

**What to Say:**
> "Next, **Case 3 — Sharded Exfiltration & SSRF**. Suppose an attacker chunks a customer database across 40 tiny 2-byte requests to an *allowed* domain. Kyron's custom **Go Egress Broker** tracks cumulative byte and call budgets *per data source* per trajectory — shutting down call #41 automatically while blocking cloud metadata SSRF (`169.254.169.254`) at socket dial time."

---

## Beat 4 — Zero-Token Recovery, Provenance Filtering & Declarative Policy (2:10 – 2:55)
**On Screen:** Terminal runs **Case 4**; Browser clicks **Policy Studio** (`06`).

**Action (2:10):** Press **Enter** in terminal to run **Case 4** (`case4_zero_token_recovery_provenance.py`).

**What to Say:**
> "When a policy blocks an agent, typical gateways return a dead-end error that sends the LLM into an expensive retry loop.
> Kyron's **Memoized Recovery Engine** looks up the violation by an 8-dimension composite state fingerprint and returns a deterministic remediation plan (`auto_substitute` or `chunk_and_compress`) consuming **0 model tokens**.
> At the same time, our **JSON-Path Provenance Filter** prunes sensitive fields like `$.customer.ssn` before the payload ever reaches an unauthorized reader."

**Action (2:38):** In the Browser, click **Policy Studio** (`06`) and click **Validate & Compile** → **Hot Reload Active Policy**.

**What to Say:**
> "Security teams author rules as signed, versioned **TOML policy bundles** — compiled and hot-reloaded into the gateway with zero downtime."

---

## Beat 5 — Cryptographic Evidence (EU AI Act Art. 50) & Real Agent Connect (2:55 – 3:35)
**On Screen:** Terminal runs **Case 5**; Browser clicks **Cryptographic Trail** (`05`) and **Agent Connect** (`02`).

**Action (2:55):** Press **Enter** in terminal to run **Case 5** (`case5_audit_chain_eu_ai_act.py`) — which exports the signed trail via `/v1/audit/export` and tests the live Go MCP Gateway `/healthz` + JSON-RPC `initialize` / `tools/list` / `tools/call`.

**Action (3:10):** Click **Cryptographic Trail** (`05`) → point to the SHA-256 `prev_hash` links and Ed25519 signatures → click **Download Article 50 Dossier**. Then click **Agent Connect** (`02`) showing drop-in configs for **Claude Desktop**, **Cursor**, and **LangChain**.

**What to Say:**
> "Every decision is sealed into an immutable, SHA-256 hash-chained and Ed25519-signed audit trail — exportable in one click as an **EU AI Act Article 50** compliance dossier.
> And adoption takes one config line: stock agents in Claude Desktop, Cursor, or LangChain connect directly via stdio or HTTP/SSE with **zero agent code changes**."

---

## Beat 6 — Summary & Technical Moat Close (3:35 – 3:45)
**On Screen:** Return to **Command Center** (`01`) showing the 5 live telemetry cards + 7-stage pipeline.

**What to Say:**
> "In head-to-head evaluation on MCPTox, Kyron 2.0 cuts attack exposure from **72.8% down to 4.1%** — a 94% reduction — with **zero model tokens** on the hot path and **3.8ms p95 latency**. Deployable in one Docker container on Render or Kubernetes. Thanks for watching."
