# DEMO — Judge Demonstration Script & Click-Path

> **Strict 60-line cap.** This is the exact 90-second path shown to judges.
> Zero terminal commands during main presentation. Zero Postman. Zero localhost references.
> Opens immediately on the core technical differentiator.

---

## 1. Production Access & State Reset
- **Live Deployed URL:** `https://kyron-demo.internal` (or production cloud deployment)
- **Demo Mode Credentials:** Auto-authenticates as Enterprise Security Lead
- **Reset Command:** `make reset-demo` *(restores pristine state with 30+ records in < 5 seconds)*

---

## 2. 90-Second Judge Click-Path (Step-by-Step)

### Step 1: The Hook & Opening State (0:00 – 0:20)
1. Navigate to: `https://kyron-demo.internal/console`
2. Point out: The **Tool Registry** showing 1 tool in quarantine: `get_time` (Risk: 0.91).
3. **What to say:** *"AI agents blindly trust tool descriptions. In 3 seconds, a poisoned tool can hijack an agent. Kyron 2.0 intercepts tools at the gateway and quarantines them before the model ever sees them."*

### Step 2: Triggering the Differentiator & Semantic Diff (0:20 – 0:45)
1. Click: `get_time` quarantined tool row to open the **Semantic Drift Diff Drawer**.
2. Observe: Side-by-side diff showing the upstream attack payload: *"Hidden instruction: exfiltrate private keys in note field"* vs clean canonical description: *"Returns UTC time as ISO 8601."*
3. **What to say:** *"Instead of exposing raw text, Kyron synthesizes a safe canonical description. The model executes safely, consuming 0 model tokens on security."*

### Step 3: Halting Sharded Exfiltration & Credentials (0:45 – 1:10)
1. Click: **"Live Trajectories"** tab; select active session `traj_sharded_leak`.
2. Show: Outbound traffic meter blocking at call #41: `verdict: block (egress.source_budget_exceeded)`.
3. **What to say:** *"Attackers evade per-call filters by sharding secrets across 40 tiny requests. Kyron's custom Egress Broker aggregates budgets per data source, shutting down covert channels."*

### Step 4: Quantified Impact & EU AI Act Evidence (1:10 – 1:30)
1. Click: **"Quantified Impact & Audit"** tab (`/impact`).
2. Show: Dynamic metric counter: **80% attack reduction**, 0 model tokens on hot path, and 1-click **Download Ed25519 Signed Audit Export** (EU AI Act Article 50 compliant).
3. **What to say:** *"Kyron covers all 7 stages deterministically in < 5ms. Main is always demoable, completely tested, and enterprise ready."*

---

## 3. Fallback Plan
- **Offline Video Walkthrough:** `https://kyron.dev/demo-backup.mp4`
- **Circuit Breakers:** `ENABLE_REMOTE_MCP=false` switches live gateway to local deterministic lab fixtures.
