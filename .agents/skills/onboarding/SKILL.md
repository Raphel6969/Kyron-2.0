---
name: onboarding
description: Load this skill to design the zero-data first-run experience, configure pre-seeded demo accounts, implement purposeful empty states, and ensure judges never land on an unhelpful blank screen.
---

# WHEN TO LOAD
Load during Phase 1/2 when implementing user authentication, dashboard landing experiences, first-time user flows, or when preparing guest demo access.

# INPUTS
- `docs/UX.md` (Journey 1 and 2 specifications)
- `docs/COPY.md` (Registered empty state copy)
- `SCHEMA.md` (Seed data models)

# OUTPUTS
- Configured guest/demo account credentials in `.env.example`
- Implemented `<EmptyState>` components across all major views
- One-click "Try Demo as Guest" button on landing screen

# EXECUTION PROTOCOL

1. **Configure Deterministic Demo Persona:**
   - Create a pre-seeded account profile (e.g. "Acme Enterprise Corp" or "Demo Operator").
   - Populate with rich historical activity (at least 30+ transactions, past logs, or telemetry records) so dashboards render populated charts on first load.

2. **Implement Guest Entry Hook:**
   - Add a prominent "Explore Demo / Launch Console" button on the landing page.
   - Bypasses tedious signup/login barriers by issuing a demo guest token with read/execute permissions.

3. **Design Purposeful Empty States:**
   When user filters produce 0 results or a fresh tenant is created:
   - Render a custom SVG illustration or minimal architectural icon.
   - Display clear headline and subtext from `docs/COPY.md`.
   - Provide an immediate primary action (e.g. "Generate Sample Data", "Run Initial Scan").
   - **Never leave a bare white or empty container.**

4. **Verify First-Run Flow:**
   Test unauthenticated access: confirm landing -> one click -> fully populated, interactive dashboard in < 2 seconds.

# EXIT CRITERIA
- [ ] Demo user account seeded and documented in `.env.example`
- [ ] One-click guest demo entry functional on landing screen
- [ ] Empty states implemented for all data lists and tables
- [ ] `make verify` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
