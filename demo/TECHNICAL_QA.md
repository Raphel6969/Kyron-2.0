# Kyron 2.0 — Technical Pitch & Judge/Investor Q&A Sheet

Use these concise, evidence-backed technical answers during live Q&A or follow-up deep dives.

---

### Q1. "Why not just use an LLM-as-a-judge or guardrails prompt to inspect tool calls?"
**Answer:**
1. **Economic & Latency Failure:** Running a secondary LLM on every tool call adds 300–1,500ms latency and burns 400+ tokens per hop. At 10M annual tool calls, that turns into tens of thousands of dollars and sluggish UX. Kyron's 7-stage hot path runs deterministically in **3.8ms p95 with 0 model tokens**.
2. **Adaptive Vulnerability:** In MCPTox (AAAI 2026), stronger reasoning models follow poisoned instructions *more* faithfully (up to **72.8% attack success**). An LLM judge is susceptible to the exact same prompt injection vector it tries to stop. Kyron strips raw descriptions using **TRUSTDESC** schema synthesis and enforces cryptographic SHA-256 pinning and network egress quotas that cannot be talked around.

---

### Q2. "How is Kyron 2.0 different from free tools like MCP-Scan or Archestra's OpenAPPA?"
**Answer:**
- **MCP-Scan** only scans static tool descriptions/hashes at rest. It is completely blind to runtime attacks: undeclared outbound sockets (**S3**), 40-call sharded exfiltration (**S4**), post-approval file swaps (**S5 TOCTOU**), and process env credential dumps (**S6**).
- **OpenAPPA** handles in-flight information flow tracking, and in fact **Kyron integrates OpenAPPA** in our Rust policy crate (`core/openappa-adapter`). However, OpenAPPA alone trusts tool metadata implicitly and lacks network egress budgets or a secrets vault — leaving **68.2% MCPTox exposure** unchecked.
- **Kyron's Moat** is the deterministic combination across all 7 stages: Tool Trust + OpenAPPA IFC + Source-Attributed Egress Broker + In-Memory Secrets Vault + TOCTOU Resource Binding + Ed25519 Signed Audit Trail — dropping exposure to **4.1%**.

---

### Q3. "Why build the gateway from scratch in Go + Rust instead of Envoy or an API gateway?"
**Answer:**
Off-the-shelf HTTP proxies (Envoy, Kong, NGINX) don't understand **MCP (Model Context Protocol)** JSON-RPC framing over bidirectional `stdio` subprocess pipes and HTTP/SSE streams, nor can they maintain **trajectory-scoped, data-source-attributed byte budgets** across 40+ fragmented requests or perform **DNS-rebinding-safe dialer pinning** per agent session.
- **Go (`gateway/`)** terminates MCP clients cleanly over `stdio` and `/sse`, enforces SSRF-safe egress dialing (`broker.go`), and manages short-lived JIT secrets (`secrets/broker.go`).
- **Rust (`core/`)** executes deterministic policy/label lattice math (`openappa-adapter`), SHA-256 manifest pinning (`pinning/`), and OS namespace/TOCTOU attestation (`attest/`).
- **Python FastAPI (`control/`)** handles off-hot-path management: SQL/PostgreSQL state, Google/GitHub OAuth, TOML compilation, and EU AI Act exports.

---

### Q4. "What happens if an attacker evades the static risk scanner with paraphrased prompt injection?"
**Answer:**
We specifically test this in our **RQ6 Adaptive Red-Team suite** (`eval/adaptive_redteam.py`, exposed at `GET /v1/eval/adaptive-redteam`). Even if a paraphrased prompt bypasses regex/heuristic scoring:
1. **Structural Isolation Holds:** `TRUSTDESC` replaces upstream descriptions with a deterministic contract projection; the model never reads unpinned upstream prose.
2. **Egress & Lease Boundaries Hold:** Even a compromised model cannot reach undeclared external domains, exceed per-source byte/call quotas, access un-leased sensitive tools, or read un-redacted tokens from the Secrets Broker.

---

### Q5. "What is your honest weakest technical assumption?"
**Answer:**
*(Directly from `docs/IMPACT.md` — Honest Limits)*:
Remote third-party SaaS MCP servers are black boxes; Kyron cannot inspect internal RAM or syscalls inside a vendor's remote cloud container. Our current mitigation is strict **perimeter metering** (inputs, schema projections, output redaction, JSON-path provenance, and gateway network egress budgets). Our production roadmap extends this with mutual TLS server attestation and vendor-signed tool manifests.

---

### Q6. "How easy is it for an engineering team to deploy and connect real agents today?"
**Answer:**
- **Zero Agent Code Changes:** Stock Claude Desktop, Cursor, CrewAI, or LangChain agents point at `kyron-gateway stdio -- <cmd>` or `http://<host>/sse`. Ready-to-copy snippets are in `configs/` and the UI **Agent Connect** tab.
- **Single-Container Cloud Deploy:** Root `Dockerfile` + `render.yaml` bundle the React UI, Go Gateway, and Python Control Plane behind Nginx on `$PORT`, with automatic PostgreSQL support (or instant in-memory fallback) and Google/GitHub OAuth 2.0 built in.
