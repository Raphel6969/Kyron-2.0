# Kyron 2.0 — 3–4 Minute Product Demo & Technical Pitch Kit

This directory contains everything needed to record a crisp, deterministic **3:30–4:00 minute product demo and technical pitch** showcasing Kyron 2.0 working end-to-end against real attack vectors — **locally** or against your **deployed Render web service**.

---

## Directory Structure

```text
demo/
├── README.md                  # This setup & pre-flight checklist
├── PITCH_SCRIPT.md            # Timed 3:45 video recording script + click-path + voiceover
├── TECHNICAL_QA.md            # Technical Q&A defense sheet (architecture, benchmarks, limits)
├── run_live_demo.py           # Master live-demo runner (interactive or auto, local or Render)
├── payloads/
│   ├── malicious_mcp_tool.json      # S1 poisoned MCP manifest payload
│   ├── rugpull_friday_update.json   # S2 silent Friday manifest mutation payload
│   └── strict_policy_demo.toml      # Declarative TOML policy for Policy Studio demo
└── cases/
    ├── common.py                              # Shared HTTP + timing + formatting helpers
    ├── case1_semantic_drift_and_trustdesc.py  # S1/S2: Poisoning, Rug Pull, TRUSTDESC (0 tokens)
    ├── case2_toctou_and_capability_lease.py   # S5/C6: TOCTOU File Swap + Single-Use Lease
    ├── case3_egress_and_sharded_exfil.py      # S3/S4: Sharded Exfil Call #41 Block + SSRF
    ├── case4_zero_token_recovery_provenance.py# C5/C7/C3: 0-Token Recovery + PII Filter + TOML
    └── case5_audit_chain_eu_ai_act.py         # C11: SHA-256 Chain + Ed25519 Article 50 Dossier
```

---

## Pre-Flight Checklist Before Recording

### Option A: Local Recording (Fastest — Sub-millisecond APIs + Live Gateway)
1. **Reset database to pristine seeded state** (< 5 seconds):
   - Windows PowerShell: `.\scripts\reset-demo.ps1`
   - Linux/macOS/Git Bash: `bash scripts/reset-demo.sh`
2. **Confirm services are running**:
   - UI Console: `http://127.0.0.1:5173`
   - Control API: `http://127.0.0.1:8001` (`/healthz`)
   - Protocol Gateway: `http://127.0.0.1:8080` (`/healthz`)
3. **Run pre-flight smoke check**:
   ```bash
   python demo/run_live_demo.py --auto --keep-state
   ```
   Then reset again before hitting Record:
   ```powershell
   .\scripts\reset-demo.ps1
   ```

### Option B: Live Cloud Recording (Render Web Service)
Point the demo runner directly at your live Render deployment (`https://kyron-2-0.onrender.com`, which routes `/`, `/v1/*`, `/sse`, `/message` over HTTPS):
```bash
python demo/run_live_demo.py --base-url https://kyron-2-0.onrender.com --interactive
```

---

## Recording Modes

- **Interactive Presenter Mode** *(recommended while screen-recording)*:
  ```bash
  python demo/run_live_demo.py --interactive
  ```
  Pauses cleanly between Case 1 through Case 5 so you can narrate and show the matching screen in the SOC Console (`http://127.0.0.1:5173/console`).

- **Single Case Execution** *(useful for retakes of one specific segment)*:
  ```bash
  python demo/run_live_demo.py --case 1
  python demo/run_live_demo.py --case 2
  python demo/run_live_demo.py --case 3
  python demo/run_live_demo.py --case 4
  python demo/run_live_demo.py --case 5
  ```

- **Automated Verification Run** *(executes all 5 cases + Gateway agent handshake in ~3 seconds)*:
  ```bash
  python demo/run_live_demo.py --auto
  ```
