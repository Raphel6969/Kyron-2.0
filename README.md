# Kyron 2.0

**Deterministic Trust Layer for Tool-Using AI Agents**

[![Live Console](https://img.shields.io/badge/Live%20Console-kyron--2--0.onrender.com-0f766e?style=flat-square)](https://kyron-2-0.onrender.com/console)
[![Data Plane](https://img.shields.io/badge/Data%20Plane-Go%201.23%20%2B%20Rust%201.80-1e293b?style=flat-square)](#architecture)
[![Control Plane](https://img.shields.io/badge/Control%20Plane-FastAPI%20%2B%20React%2018-1e293b?style=flat-square)](#architecture)
[![Hot Path](https://img.shields.io/badge/Hot--Path%20Overhead-3.8ms%20p95%20%7C%200%20Tokens-0369a1?style=flat-square)](#empirical-benchmarks)

Kyron 2.0 is an inline deterministic security gateway and policy engine for Model Context Protocol (MCP) agents. It verifies tool metadata before an LLM ever sees it, enforces information-flow and network egress budgets on every call, prevents runtime credential leakage and filesystem TOCTOU swaps, and emits cryptographically signed, EU AI Act–ready audit trails—requiring **zero modifications** to agent prompts or model loops and **zero LLM tokens on the hot path**.

---

## Why Kyron 2.0 Exists

AI agents act through external tools whose metadata, runtime behavior, and outputs are untrusted. Prompt-level guardrails and LLM-as-a-judge wrappers fail against adaptive attackers (and burn latency and tokens on every hop). Stateless scanners miss runtime drift, sharded exfiltration, and check-then-use swaps.

Kyron 2.0 places seven deterministic verification gates directly on the MCP wire between stock agents (`Claude Desktop`, `Cursor`, `LangChain`, `CrewAI`, or custom SSE/stdio clients) and upstream MCP servers:

| Stage | Component | Language | What It Stops |
|---|---|---|---|
| **1. Registry Firewall & TRUSTDESC** | `C2` (`core/scanner`, `core/pinning`) | Rust | **S1 Poisoned Descriptions & S2 Silent Rug Pulls:** Strips hidden prompt injections, synthesizes safe canonical tool specs (`TRUSTDESC`), and SHA-256 hash-pins every approved tool. Mutated tools quarantine automatically with side-by-side semantic diffs. |
| **2. Single-Use Capability Leases** | `C6` (`gateway/pkg/authority`, `control/`) | Go + Python | **Unauthorized High-Impact Actions:** Elevates destructive or sensitive calls (e.g. `issue_refund`, privileged deletes) into a live human-in-the-loop queue that mints single-use, TTL-bound Ed25519 capability leases. |
| **3. TOCTOU Resource Binding** | `C3` (`/v1/resources/*`) | Rust + Python | **S5 Check-then-Use Swaps:** Cryptographically binds approved file/resource paths to SHA-256 content digests and re-verifies integrity at execution instant. |
| **4. OpenAPPA IFC & Field Provenance** | `C4`, `C7` (`core/openappa-adapter`) | Rust | **Policy Violations & Over-Tainting:** Runs prospective dispatch and return-admission lattice checks in-process (`archestra-ai/OpenAPPA`) with RFC 6901 JSON-path field-level redaction (`/v1/provenance/filter`). |
| **5. Source-Attributed Egress Broker** | `C8` (`gateway/pkg/egress`) | Go | **S3 Lying Tools & S4 Sharded Exfiltration:** Blocks undeclared destinations, SSRF metadata endpoints, and cumulative cross-call micro-chunking per data source. |
| **6. In-Memory Secrets Broker** | `C9` (`gateway/pkg/secrets`) | Go | **S6 Credential Theft:** Resolves scoped JIT credentials at tool dispatch and scrubs sensitive tokens (including `ghp_*` PATs, bearer tokens, env secrets) from model-visible responses. |
| **7. Hash-Chained Audit & Recovery** | `C5`, `C11` | Go + Rust + Python | **Non-Repudiation & Zero-Token Self-Healing:** Links every `ALLOW`, `LEASE-ALLOW`, and `BLOCK` event in a SHA-256 hash chain with Ed25519 signatures (EU AI Act Articles 12, 14, 15, 50) and caches precomputed recovery plans by state fingerprint. |

---

## Empirical Benchmarks

Measured across the **MCPTox (AAAI 2026)** benchmark suite, **S1–S6** vulnerability lab (`eval/GATE0_BENCHMARK.md`), and **RQ6** scanner-aware adaptive evasion tests (`eval/ADAPTIVE_REDTEAM.md`):

| Metric | Unshielded | MCP-Scan | OpenAPPA Alone | **Kyron 2.0 (7-Stage)** |
|---|---:|---:|---:|---:|
| **MCPTox Attack Exposure** | `72.8%` | `18.4%` (`-74.7%`) | `68.2%` (`-6.3%`) | **`4.1%` (`-94.4%`)** |
| **Vulnerability Lab (S1–S6)** | `0/6` blocked | `1/6` (`16.7%`) | `0/6` (`0.0%`) | **`6/6` (`100.0%`)** |
| **RQ6 Adaptive Evasion (AA-1..AA-6)** | — | `0/6` blocked (`100%` bypassed) | — | **`6/6` blocked (`0.0%` bypassed)** |
| **Hot-Path Decision Latency (p95)** | `0 ms` | `~15.0 ms` | `~8.0 ms` | **`3.8 ms`** (`0` model tokens) |

---

## Architecture

```text
  MCP Client (Claude / Cursor / LangChain / Custom Agent)
       │   Standard MCP over stdio or HTTP/SSE
       ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  KYRON DATA PLANE (Zero-Model Hot Path · Go 1.23 + Rust 1.80)       │
  │                                                                      │
  │  [Protocol Gateway (C1)] ─► [Registry Firewall (C2)] ─► [Policy (C3)]│
  │           │                         │                        │       │
  │           ▼                         ▼                        ▼       │
  │  [Egress Broker (C8)]      [Secrets Broker (C9)]    [Audit (C11)]    │
  └───────────┬──────────────────────────────────────────────────┬───────┘
              │ (enforces last signed policy bundle offline)     │ Telemetry
              ▼                                                  ▼
  Upstream MCP Servers                        ┌──────────────────────────┐
                                              │  KYRON CONTROL PLANE     │
                                              │  FastAPI (:8001)         │
                                              │  React 18 SOC (:5173)    │
                                              │  PostgreSQL 16+ / SQLite │
                                              └──────────────────────────┘
```

### Repository Layout

| Directory | Purpose | Stack |
|---|---|---|
| [`gateway/`](gateway/) | Custom MCP proxy (`stdio` + HTTP/SSE), Egress Broker, Secrets Broker, `kyron` CLI | Go 1.23 |
| [`core/`](core/) | Registry Firewall, TRUSTDESC normalizer, Ed25519 pinning, OpenAPPA IFC, attestations | Rust 1.80+ |
| [`control/`](control/) | REST API (`/v1/*`, `/impact`, `/healthz`), SQLite/PostgreSQL persistence, OAuth 2.0 | Python 3.12 / FastAPI |
| [`ui/`](ui/) | Real-time SOC Console (`LIVE SYNC` 2s telemetry), drift diffing, policy studio, audit drawer | React 18 / TS / Vite |
| [`demo/`](demo/) | 5-case live demo suite, real interactive MCP SSE agent, Acme FinOps showcase, pitch script | Python / Shell |
| [`configs/`](configs/) & [`scripts/agents/`](scripts/agents/) | Drop-in configs for Claude Desktop, Cursor, LangChain, CrewAI | JSON / Python |
| [`lab/`](lab/) & [`eval/`](eval/) | S1–S6 intentionally vulnerable MCP servers + RQ6 & Gate 0 empirical benchmarks | Python / Go / Rust |
| [`deploy/`](deploy/) | Unified Render Nginx/Docker setup and Helm charts | Docker / Helm |

---

## Quick Start

### 1. Live Hosted SOC Console

Open the live Render deployment directly—pre-seeded with 35 tools, policies, and hash-chained audit evidence:
- **SOC Console:** [https://kyron-2-0.onrender.com/console](https://kyron-2-0.onrender.com/console)
- **Live Impact Telemetry:** [https://kyron-2-0.onrender.com/impact](https://kyron-2-0.onrender.com/impact)
- **Health Check:** [https://kyron-2-0.onrender.com/healthz](https://kyron-2-0.onrender.com/healthz)

### 2. Local Development Stack

Run the three services locally (or via `docker compose up`):

```bash
# Terminal 1 — Control Plane API (:8001)
python -m uvicorn control.app.main:app --host 127.0.0.1 --port 8001

# Terminal 2 — Go MCP Protocol Gateway (:8080)
cd gateway && go run ./cmd/gateway

# Terminal 3 — React 18 SOC Console (:5173)
npm --prefix ui install && npm --prefix ui run dev -- --host 127.0.0.1 --port 5173
```

Restore deterministic demo data (35 tools, 3 TOML policies, leases, approvals, and 40 signed audit events) at any time:

```bash
bash scripts/reset-demo.sh       # Linux / macOS
# or
.\scripts\reset-demo.ps1         # Windows PowerShell
```

### 3. Wrap Any Real Agent via MCP Gateway (`stdio` or SSE)

Intercept any existing Python or Node MCP server over `stdio` without touching agent code:

```bash
cd gateway
go build -o kyron-gateway ./cmd/gateway
./kyron-gateway --stdio --control-url http://127.0.0.1:8001 -- python path/to/mcp_server.py
```

Or connect any SSE/HTTP MCP client to `http://127.0.0.1:8080/sse` (or deploy-side `/sse`). See [`configs/README.md`](configs/README.md) and [`scripts/agents/README.md`](scripts/agents/README.md) for Claude Desktop, Cursor, LangChain, and CrewAI recipes.

### 4. Run the Live Interactive Demo & Showcase Suites

```bash
# Real interactive MCP SSE agent (pauses for live approval click in the SOC Console)
python demo/run_real_agent.py

# Target the live Render deployment instead
python demo/run_real_agent.py --base-url https://kyron-2-0.onrender.com

# Full 5-case verification runner
python demo/run_live_demo.py --auto

# Standalone Acme FinOps MCP stdio interception demo
python demo/acme_ops_project/agent_app.py --mode kyron
```

---

## Verification & Quality Gates

Every commit passes the fast-tier verification harness (`make verify` / `bash scripts/verify.sh`):
- Rust Cargo workspace tests & Clippy (`cargo test`, `cargo clippy -- -D warnings`)
- Go gateway unit suite & `gofmt` (`go test ./pkg/...`)
- Python FastAPI integration & isolation tests (`pytest control/tests -v`, `ruff check`)
- Frontend TypeScript build & static craft/hardening audits (`npm --prefix ui run build`, `ui-audit.sh`, `ux-gate.sh`, `hardening-gate.sh`, `state-lint.sh`)

```bash
bash scripts/verify.sh
```

---

## Documentation Index

| Document | Contents |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System topology, 15 components (`C1`–`C15`), 9-step call lifecycle, threat model |
| [`DEMO.md`](DEMO.md) | 90-second live judge click-path walkthrough |
| [`docs/WHITEPAPER.md`](docs/WHITEPAPER.md) | Formal threat formulation & 7-stage defense paper |
| [`docs/API.md`](docs/API.md) | Control Plane REST API (`/v1/*`), MCP Gateway framing, and `kyron` CLI reference |
| [`docs/SCHEMA.md`](docs/SCHEMA.md) | Rust core types (`PinnedTool`, `Contract`, `Lease`), SQL tables, TOML bundle spec |
| [`docs/IMPACT.md`](docs/IMPACT.md) | Mathematical value model, MCPTox/arXiv baselines, and Honest Limits |
| [`docs/EU_AI_ACT_DOSSIER.md`](docs/EU_AI_ACT_DOSSIER.md) | EU AI Act (Regulation 2024/1689) Articles 12, 14, 15, and 50 technical mapping |
| [`docs/DEPLOY_RENDER.md`](docs/DEPLOY_RENDER.md) | Unified Render Docker + PostgreSQL deployment guide |
| [`eval/GATE0_BENCHMARK.md`](eval/GATE0_BENCHMARK.md) & [`eval/ADAPTIVE_REDTEAM.md`](eval/ADAPTIVE_REDTEAM.md) | Head-to-head S1–S6, MCPTox, and RQ6 adaptive red-team results |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | Phased engineering plan (`P0`–`P3`), rubric targets, and phase summaries ([`docs/phases/`](docs/phases/)) |
| [`demo/README.md`](demo/README.md) & [`demo/PITCH_SCRIPT.md`](demo/PITCH_SCRIPT.md) | 3:45 video recording runbook and judge Q&A defense sheet |
