# QUALITY.md — The Four Quality Systems

Hack Engine engineers out the fatal hackathon failure mode: *"Looks like a hackathon project, not a product."*

Quality is not an afterthought or an aesthetic opinion. It is enforced through **four mechanical systems**. Each system has a binding contract file, operating skills, a read-only critic agent, and an automated gate script that fails the build if violated.

---

## The Four Systems Matrix

| Quality System | Contract File | Operating Skills | Critic Agent | Automated Gate Script |
|---|---|---|---|---|
| **1. Product / Usability** | `docs/UX.md`<br>`docs/COPY.md` | `user-journey`<br>`copy-system`<br>`onboarding`<br>`ux-audit` | `ux-critic`<br>*(Flash model)* | `scripts/checks/ux-gate.sh`<br>*(Enforces 4 states, click limits, no alerts)* |
| **2. UI & Visual Craft** | `design/DIRECTION.md`<br>`design/TOKENS.css`<br>`design/COMPONENTS.md` | `design-system`<br>`ui-build`<br>`component-inventory`<br>`motion-pass` | `ui-critic`<br>*(Flash model via screenshots)* | `scripts/checks/ui-audit.sh` *(Fast)*<br>`scripts/checks/ui-review-gate.sh` *(Slow: >=7/10)* |
| **3. Impact & Defensibility** | `docs/IMPACT.md`<br>`RUBRIC.md` | `impact-model`<br>`instrumentation`<br>`feasibility-dossier`<br>`pitch-builder` | `judge-sim`<br>*(Pro model)* | `scripts/checks/impact-gate.sh`<br>*(Verifies /impact route & Honest Limits)* |
| **4. Implementation & Hardening** | `docs/SECURITY.md`<br>`docs/OPS.md` | `security-baseline`<br>`observability`<br>`data-integrity`<br>`perf-budget`<br>`demo-resilience` | `code-critic`<br>*(Pro model)* | `scripts/checks/hardening-gate.sh`<br>*(Zero SQLite in prod, authz, reset-demo)* |

---

## 1. Product & Usability System
- **The Problem:** Hackathon projects are full of dead ends, confusing jargon, missing loading states, and 10-click mazes that lose judges in 30 seconds.
- **The Contract (`docs/UX.md` & `docs/COPY.md`):**
  * Maximum 2 clicks to reach the core differentiator in Journey 2 (Judge Path).
  * Every data view must implement 4 states: designed empty, skeleton loading, error with retry, and success.
  * Banned marketing fluff: "Powered by AI", "Seamless", "Click here" replaced with domain-literate terms.
- **Enforcement:** `ux-gate.sh` scans for raw alerts and missing states; `ux-critic` traces journeys via Playwright.

---

## 2. UI & Visual Craft System (Awwwards / Godly Tier)
- **The Problem:** Generic AI templates, purple gradient glowing buttons, emoji icons, and repeated 3-up card grids look amateurish and lose visual credibility.
- **The Contract (`design/DIRECTION.md` & `TOKENS.css`):**
  * Strict 5-color token palette wired into Tailwind custom properties (raw palettes literally do not resolve).
  * Fluid `clamp()` typography with tracking `-0.02em` to `-0.03em` on display steps.
  * GSAP character/word staggers and Lenis smooth scrolling (zero lazy `hover:scale-*`).
  * Asymmetric editorial grid (7/5 or 8/4 column splits) with at least one full-bleed interactive moment.
  * Three real reference websites declared before any styling is written.
- **Enforcement:** `ui-audit.sh` auto-reverts banned CSS patterns on every commit; `ui-critic` reviews PNG screenshots rendered by `capture.spec.ts` across 375/768/1440 viewports and scores >= 7/10.

---

## 3. Impact & Defensibility System
- **The Problem:** Teams retrofit unverified market claims onto a slide deck at hour 34. Critical judges dismantle the arithmetic in 30 seconds during Q&A.
- **The Contract (`docs/IMPACT.md` & `RUBRIC.md`):**
  * Sourced status-quo baseline from an authoritative report or benchmark.
  * Explicit, non-handwaving arithmetic formulas with named variables.
  * Mandatory "Honest Limits" section naming our weakest assumption first to disarm cynical judges.
  * Live `/impact` route computing numbers dynamically from seeded database records.
- **Enforcement:** `impact-gate.sh` checks for `/impact` in `routes.json` and "Honest Limits" in `IMPACT.md`; `judge-sim` simulates an adversarial judge scoring `RUBRIC.md` criteria >= 6/10.

---

## 4. Implementation & Hardening System
- **The Problem:** Projects crash during live judging: SQLite databases locked, external APIs timing out, missing credentials, broken migrations, or user A seeing user B's data.
- **The Contract (`docs/SECURITY.md` & `OPS.md`):**
  * PostgreSQL mandatory from Phase 0; committed `.db` files strictly banned.
  * Server-side tenant authorization with an automated unit test proving isolation.
  * Deep `/healthz` endpoint checking database pool reachability.
  * `make reset-demo` restoring pristine demo state and 30+ seed rows in < 5 seconds.
  * Circuit-breaker boolean feature flags (`ENABLE_<SERVICE>`) on every 3rd-party API with mock fallbacks.
  * `DEMO.md` pointing exclusively to deployed production URLs (zero `localhost` references).
- **Enforcement:** `hardening-gate.sh` runs on every commit; `code-critic` reviews git diffs against security standards.
