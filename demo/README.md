# Kyron 2.0 — 3–4 Minute Product Demo & Technical Pitch Kit

This directory contains everything needed to record a crisp, deterministic **3:30–4:00 minute product demo and technical pitch** showcasing Kyron 2.0 working end-to-end with **real live UI auto-updates** — **locally** or against your **live Render web service** (`https://kyron-2-0.onrender.com/console`).

---

## Directory Structure

```text
demo/
├── README.md                  # Setup & pre-flight checklist
├── PITCH_SCRIPT.md            # Timed 3:45 video recording script + click-path + voiceover
├── TECHNICAL_QA.md            # Technical Q&A defense sheet (architecture, benchmarks, limits)
├── run_real_agent.py          # REAL interactive MCP SSE Agent (pauses for your UI click!)
├── run_live_demo.py           # 5-case API + Gateway verification suite
├── payloads/
│   ├── malicious_mcp_tool.json      # S1 poisoned MCP manifest payload
│   ├── rugpull_friday_update.json   # S2 silent Friday manifest mutation payload
│   └── strict_policy_demo.toml      # Declarative TOML policy for Policy Studio demo
└── cases/
    ├── common.py                              # Shared HTTP + timing + formatting helpers
    ├── case1_semantic_drift_and_trustdesc.py  # S1/S2: Poisoning, Rug Pull, TRUSTDESC (0 tokens)
    ├── case2_toctou_and_capability_lease.py   # S5/C6: TOCTOU File Swap + Single-Use Lease
    ├── case3_egress_and_sharded_exfil.py      # S3/S4/RQ6: Adaptive Red-Team + Trace Replay
    ├── case4_zero_token_recovery_provenance.py# C5/C7/C3: 0-Token Recovery + PII Filter + TOML
    └── case5_audit_chain_eu_ai_act.py         # C11/C1: SHA-256 Chain + Ed25519 + Live MCP SSE
```

---

## Best Way to Record: Side-by-Side Real Agent + Live Auto-Sync Console

The SOC Console automatically polls telemetry every **2 seconds** (`LIVE SYNC` indicator in header), so every action performed by an external agent or terminal script **appears live on screen without hitting Refresh**:

### Option A: Live Local Recording (Instant Latency + Latest Gateway Sink)
1. Reset DB cleanly (< 5s):
   ```powershell
   .\scripts\reset-demo.ps1
   ```
2. Open browser to `http://127.0.0.1:5173/console` (place on left 65% of screen).
3. Run the real interactive MCP SSE agent (place terminal on right 35%):
   ```bash
   python demo/run_real_agent.py
   ```
   *(Optional: pass `--llm openai` with `OPENAI_API_KEY` or `--llm gemini` with `GEMINI_API_KEY` to show a live LLM choosing tools through Kyron!)*
4. When the agent hits **Task 5**, it **pauses in the terminal** and pushes a live request to **Authority Queue (03)**. Click **Grant Capability Lease** in the browser UI — watch the terminal agent receive the signed lease and complete execution live!

### Option B: Live Cloud Recording (`https://kyron-2-0.onrender.com/console`)
Once your latest `main` build is deployed on Render:
```bash
python demo/run_real_agent.py --base-url https://kyron-2-0.onrender.com
```
Or run the 5-case automated suite:
```bash
python demo/run_live_demo.py --base-url https://kyron-2-0.onrender.com --interactive
```
