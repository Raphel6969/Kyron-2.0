# Workflow: /demo-prep — Final 15% Presentation Lockdown

Executed in the final 15% of the hackathon clock. Non-negotiable time reserved at planning time. Ensures the live demo is bulletproof, judges never see localhost, fallback recordings exist, and the pitch narrative matches running code.

## Step 1: Verify Public Production Deployment
- Confirm application is deployed to public URL (Render / Vercel / Railway).
- Query production `/healthz`: verify HTTP 200 with database connected status.
- Audit `DEMO.md`: confirm zero occurrences of `localhost` or `127.0.0.1`.

## Step 2: Seed Realistic Production Demo Accounts
- Execute remote seed script or invoke `/api/admin/seed` with production secret.
- Verify demo user accounts exist and possess rich historical data (30+ records).
- Test one-click "Try Demo as Guest" entry on the public landing page.

## Step 3: Rehearse 90-Second Judge Click-Path
- Execute the exact 4-step sequence from `DEMO.md`:
  * Step 1 (0:00–0:20): Hook on public production landing page.
  * Step 2 (0:20–0:50): Click to trigger core differentiator (<30s).
  * Step 3 (0:50–1:15): Open `/impact` route proving live arithmetic from DB.
  * Step 4 (1:15–1:30): Show audit trail and production architecture.
- Confirm total elapsed time is under 90 seconds.

## Step 4: Verify `make reset-demo`
- Test `make reset-demo` on deployment or staging environment.
- Confirm that dirty test data is cleared and pristine demo records return in < 5 seconds.

## Step 5: Upload Offline Screen-Recording Fallback
- Record an unlisted 3-minute video walkthrough (Loom / YouTube).
- Link the video URL directly in `DEMO.md`.
- Safeguards presentation if event venue Wi-Fi or cloud provider suffers an outage.

## Step 6: Synchronize Pitch Outline & README
- Verify `README.md` features:
  * Hero banner & live deployed link
  * 3-sentence elevator pitch & core differentiator
  * Architecture diagram matching `ARCHITECTURE.md`
  * Quick start instructions
- Verify `docs/pitch/outline.md` matches running numbers from `/impact`.

## Step 7: Final Slow-Tier Gate & Lock
- // turbo `make verify-full`
- // turbo `git commit -m "demo: final production lockdown and judge demo path verified"`
- // turbo `git tag -a "demo-ready-final" -m "Hackathon final submission ready"`
