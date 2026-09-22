---
name: demo-prep
description: Load this skill during the final 15% of the hackathon clock to execute the demo-ready checklist, lock down the 90-second judge click-path, verify live public deployment, test make reset-demo, and upload offline backup video recordings.
---

# WHEN TO LOAD
Load during the final 15% of the allocated hackathon time, when running `/demo-prep`, or before presenting the project to evaluators.

# INPUTS
- `DEMO.md` (Judge walkthrough path)
- `.agents/checklists/demo-ready.md` (Readiness checklist)
- Public production deployment URL

# OUTPUTS
- Verified public deployment live on public URL (zero localhost references)
- Fully checked off `demo-ready.md` checklist
- Working `make reset-demo` tested live
- Screen recording backup link added to `DEMO.md`

# EXECUTION PROTOCOL

1. **Verify Live Public Deployment:**
   - Confirm application is deployed to public URL (Render / Vercel / Railway).
   - Test `/healthz` on production domain: verify HTTP 200.
   - Verify that `DEMO.md` references the public URL with zero `localhost` occurrences.

2. **Rehearse the 90-Second Judge Click-Path:**
   Walk `DEMO.md` exactly as written:
   - Step 1: Open landing page.
   - Step 2: Click to trigger the core differentiator in < 30 seconds.
   - Step 3: Open `/impact` to demonstrate live calculated metrics.
   - Step 4: Point to audit proofs or server-side security.
   - Time the walk: must finish in under 90 seconds.

3. **Verify `make reset-demo` on Production / Staging:**
   - Execute test mutations on live deployment.
   - Run `make reset-demo`.
   - Confirm demo accounts and 30+ seed records are restored cleanly in < 5 seconds.

4. **Verify Offline Fallback Video:**
   - Record or link a clean screen capture walkthrough (Loom / YouTube unlisted) in `DEMO.md`.
   - Ensures presentation succeeds even if event venue Wi-Fi fails completely.

5. **Execute Demo Ready Checklist:**
   Audit all boxes in `.agents/checklists/demo-ready.md`. Confirm every item is green.

# EXIT CRITERIA
- [ ] Production URL active and verified
- [ ] 90-second click path in `DEMO.md` rehearsed without error
- [ ] `make reset-demo` restores clean demo state in < 5s
- [ ] All `.agents/checklists/demo-ready.md` boxes checked
- [ ] `make verify-full` exits 0

# NEXT
Present project to judges with confidence.
