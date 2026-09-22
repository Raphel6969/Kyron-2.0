# ENGINE_BACKLOG — Lessons Learned & Upstream Improvements

> **Continuous Engine Refinement:** At the end of every hackathon, record what friction
> was encountered, what manual steps had to be performed, and what gates or skills
> should be added to improve Hack Engine for the next competition.

---

## Retrospective Log

### Build 001: Hack Engine OS Bootstrapping (September 2026)
- **Context:** Codified patterns from 10+ historical projects (Arcanix, Sentinel, Nexus, AEGIX, Orcheon, Aloorithm, Dossier, Distro, Veille).
- **Core Realizations Baked into Engine:**
  1. *SQLite in Production:* Blocked mechanically via `hardening-gate.sh`.
  2. *Deferred Auth:* Enforced tenant isolation test via `security-baseline`.
  3. *Unflagged Third-Party APIs:* Mandated `ENABLE_<SERVICE>` flags and mock fallbacks.
  4. *AI-Cliché Styling:* Banned purple gradients and emojis via `ui-audit.sh`.
  5. *State Layer Memory:* Replaced fragile chat memory with file-resident `STATE.md`, `PLAN.md`, `ARCHITECTURE.md`.
- **Planned Upstream Enhancements:**
  - [ ] Add pre-configured GitHub Actions workflow generator for automated CI/CD.
  - [ ] Add mobile Flutter template scaffold (`templates/stack-flutter-fastapi`).
  - [ ] Integrate automated `@axe-core/playwright` accessibility snapshot runner directly in fast tier if execution < 5s.
