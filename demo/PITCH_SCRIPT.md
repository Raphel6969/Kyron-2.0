# Kyron 2.0 — 3:45 Video Demo & Technical Pitch Script

**Target Duration:** 3 minutes 45 seconds
**Screen Setup:** Split Screen — Left 65% = Browser (`http://127.0.0.1:5173/console` or `https://kyron-2-0.onrender.com/console`) · Right 35% = Terminal
**Pre-Recording Step:** Run `.\scripts\reset-demo.ps1` (for local) and start on the **Landing Page** (`/`). Confirm the green **`LIVE SYNC`** indicator is active in the console header.

---

## Beat 1 — The Hook & Problem Statement (0:00 – 0:30)
**On Screen:** Kyron 2.0 Landing Page (`/`) showing the live architecture flow.

**What to Say:**
> "Enterprise teams want AI agents that use real tools — Postgres, GitHub, Kubernetes, Slack. Today, 67% to 89% of those pilots fail security review because:
> 1. In **MCPTox (AAAI 2026)**, tool-description poisoning achieves up to a **72.8% attack success rate** — and stronger reasoning models obey poisoned instructions *more* faithfully.
> 2. **Silent egress research** shows agents bypass per-call filters **95% of the time** by chunking secrets across dozens of tiny calls.
>
> Wrapping an LLM-as-a-judge adds hundreds of milliseconds, doubles token spend, and still gets prompt-injected.
> **This is Kyron 2.0: a deterministic trust layer in Go, Rust, and Python with zero model tokens on the hot path and sub-4ms p95 latency.**"

**Action (0:28):** Click **Launch Verification Console** → enter as **Enterprise Security Lead** (`/console`).

---

## Beat 2 — Running a Real Live Agent via MCP SSE (0:30 – 1:30)
**On Screen:** Console **Cryptographic Trail (`05`)** open on left; Terminal on right.

**Action (0:35):** First show the **before vs after** drop-in wrapper on a real standalone SQLite/CSV MCP project (`demo/acme_ops_project/`):
```bash
# 1. Baseline vulnerability (zero Kyron protection)
python demo/acme_ops_project/agent_app.py --mode unprotected

# 2. Wrap the EXACT same MCP server with Kyron's stdio gateway (0 code changes!)
python demo/acme_ops_project/agent_app.py --mode kyron
```
Point out on screen:
- In `--mode unprotected`, the raw `vendor_sync_telemetry` injection leaks into `tools/list`, plaintext `GITHUB_TOKEN` & `AWS_ACCESS_KEY_ID` dump to the model, and the poisoned call succeeds.
- In `--mode kyron`, **without changing one line of `mcp_server.py`**:
  - `vendor_sync_telemetry` is auto-scanned, quarantined (`Risk 95%`), and **vanishes from `tools/list`** (`TRUSTDESC`), while appearing live in **Tool Registry**!
  - `query_invoices` runs cleanly against SQLite (`2.7ms`) and streams green `ALLOW` to **Cryptographic Trail**.
  - `system_diagnostics` secrets are scrubbed in-flight to `[KYRON_REDACTED_SECRET]` (`1.0ms`).
  - Attempting to call `vendor_sync_telemetry` returns `-32000 Policy violation` (`0.7ms`) and streams red `BLOCK` live to the UI!

Next run the interactive SSE agent:
```bash
python demo/run_real_agent.py
```

**What Happens Live on Screen:**
- **Task 1–2 (MCP SSE + TRUSTDESC):** The real agent connects to Kyron's custom Go Gateway over SSE and calls `tools/list`. **Point out:** `time:get_time`, `currency:converter`, and `system:raw_exec` are completely hidden from the agent via Dynamic Tool Projection!
- **Task 3 (Benign Queries):** Agent executes `postgres:execute_select_query` and `finance:check_ledger_balance`. **Watch the UI:** Green **`ALLOW`** events stream straight into **Cryptographic Trail** automatically via `LIVE SYNC`!
- **Task 4 (Live Poisoning Quarantine - S1):** Third-party vendor tool `demo-vendor:billing_export` arrives with hidden SSH key theft instructions. Kyron quarantines it (`Risk 95%`), synthesizes a clean `TRUSTDESC` stub with **0 model tokens**, and blocks `time:get_time`. **Watch the UI:** Top card **`02 / QUARANTINED`** increments live, Tool Registry red badge jumps, and the **`BLOCK`** event appears in Cryptographic Trail!

**Action (1:20):** Click **Tool Registry (`02`)** → click **Diff** on `demo-vendor:billing_export` (or `currency:converter`) to show the side-by-side attacker payload vs safe `TRUSTDESC` output.

---

## Beat 3 — Interactive Human-in-the-Loop Capability Lease (1:30 – 2:15)
**On Screen:** Browser switches to **Authority Queue (`03`)**; Terminal is paused on **Task 5**.

**What to Say:**
> "Look at the terminal — our agent detected a memory leak in `payment-worker` and needs `k8s:restart_deployment`. Kyron refuses direct blind execution and pauses the agent, posting a call-scoped request live to our **Authority Queue**."

**Action (1:45):** In the Browser UI, click **`Grant Capability Lease`** on the live pending request (`k8s:restart_deployment`).

**What Happens Live on Screen:**
- The terminal agent immediately picks up the **Ed25519-signed single-use lease** (`max_calls=1`), dispatches `k8s:restart_deployment` over MCP SSE, and prints the live Kubernetes restart result!
- Top card **`03 / ACTIVE LEASES`** increments live on screen!

---

## Beat 4 — TOCTOU Swaps, Sharded Exfiltration & RQ6 Proof (2:15 – 3:05)
**On Screen:** Agent **Task 6** completes (`TOCTOU violation caught` + live `BLOCK` event appears in UI). Next run:
```bash
python demo/run_live_demo.py --case 3
python demo/run_live_demo.py --case 4
```

**What to Say:**
> "Static scanners fail runtime attacks. Watch **Case 3 & 4**:
> - When an attacker swaps `/tmp/monthly_report.txt` for `/etc/shadow` post-approval, Kyron catches the SHA-256 content mismatch deterministically (**TOCTOU defense**).
> - Across our **RQ6 Adaptive Red-Team suite**, homoglyphs, split payloads, base64 smuggling, and 16-byte sharded micro-egress bypass static scanners **100% of the time**, while Kyron stops **100% of them with 0% attack exposure**.
> - And when an agent hits a block, our **Memoized Recovery Engine** returns a deterministic recovery plan (`auto_substitute`) using **0 LLM tokens**, while **JSON-Path Provenance** prunes sensitive fields like `$.customer.ssn`."

---

## Beat 5 — EU AI Act Article 50 Evidence & Zero-Change Agent Connect (3:05 – 3:45)
**On Screen:** Browser clicks **Cryptographic Trail (`05`)** → click **Download Article 50 Dossier** → click **Agent Connect (`02`)** (showing Claude Desktop, Cursor, LangChain snippets & live trigger buttons).

**What to Say:**
> "Every allow, block, and lease ruling is SHA-256 hash-chained and Ed25519-signed — exportable in one click as an **EU AI Act Article 50** compliance dossier.
> Connecting stock Cursor, Claude Desktop, or LangChain agents takes one line of config with **zero agent code changes**.
> Kyron 2.0 drops MCPTox attack exposure from **72.8% down to 4.1%**, consumes **0 model tokens** on the hot path in **3.8ms p95**, and runs cleanly in Docker or on Render. Thank you."
