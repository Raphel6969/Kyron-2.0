# ⚡ Hack Engine OS

> **The Permanent, Repo-Resident Antigravity Operating System for Hackathons.**  
> *Takes an ambiguous Problem Statement and autonomously produces a demoable, deployed, documented, production-quality build that survives context resets, free-tier models, and team collaboration.*

---

## 🎯 What Is Hack Engine?

Hack Engine is not a standard application—it is a **pre-built operating system and mechanical harness** designed for Google Antigravity. It replaces fragile "prompt engineering" (pasting giant prompts into chat and watching context decay) with **Loop Engineering** (a state-machine operating system backed by living repository contracts and deterministic gate scripts).

### Why It Exists:
1. **Survives Context Wipes & Free Models:** When context compresses or an agent session resets, cold agents resume by reading only 3 files (~2,000 tokens): `STATE.md`, `PLAN.md`, and `ARCHITECTURE.md`.
2. **The Exit Code Is the Referee:** An agent cannot declare success from "reading code." A sub-task is complete **only when `make verify` exits 0**.
3. **Banishes Hackathon Clichés:** Mechanical gates auto-revert purple gradients, generic 3-up card grids, emoji icons, SQLite in production, deferred auth, and fake marketing numbers.

---

## 🚀 Quickstart: Bootstrapping a New Hackathon

Follow these steps to initialize a fresh hackathon project from Hack Engine:

### 1. Clone & Sever Engine History
Clone this repository into your new hackathon directory, **delete the `.git` folder**, and initialize a clean repository:

```bash
# Clone Hack Engine into your project directory
git clone https://github.com/Raphel6969/HackEngine.git my-hackathon-app
cd my-hackathon-app

# IMPORTANT: Remove the engine's git history to start fresh
# On Linux / macOS / WSL:
rm -rf .git

# On Windows PowerShell:
Remove-Item -Recurse -Force .git

# Initialize your new hackathon git repository
git init
git branch -M main
git add .
git commit -m "chore: bootstrap workspace from HackEngine OS"
```

---

## 🛠️ How to Use with Antigravity

### Step 1: Ingest the Problem Statement (`/ps`)
Open your fresh repository in Antigravity and trigger the `/ps` workflow:

```text
Load AGENTS.md. Run workflow: .agents/workflows/ps.md with the following:

Problem Statement: <Paste verbatim hackathon challenge text>
Constraints:
- Time Budget: 24h / 36h / 48h
- Team Size: 1-4
- Required Stacks/Sponsors: <e.g. Neon, Groq, Supabase, Render>
- Judging Rubric: <Paste evaluation criteria if published>
```

### Step 2: The Mandatory Human Checkpoint (Pause Once)
The engine executes `ps-decode`, `user-journey`, `impact-model`, and `solution-design`.  
It will **pause once** and present `docs/02-solution.md`:
- Review the proposed **technical moat / core differentiator**.
- Review the 90-second judge demonstration hook.
- Reply **"Approved"** (or adjust direction).

Once approved, the engine automatically locks `ARCHITECTURE.md`, generates `PLAN.md` with explicit phase budgets, divides team lanes in `HUMANS.md`, and scaffolds Phase 0.

### Step 3: Run the Autonomous Loop (`/next`)
Run `/next` in Antigravity:
```text
/next
```
**This is 90% of your interaction.** The agent executes the cycle unattended:
1. **Orients:** Reads `STATE.md`, `PLAN.md`, `ARCHITECTURE.md`.
2. **Recovers:** Finishes any half-done work in `## IN FLIGHT`.
3. **Picks Sub-Task:** Claims one sub-task from `PLAN.md`.
4. **Builds:** Implements feature against `.agents/checklists/dod.md`.
5. **Verifies:** Runs `make verify`. If tests fail, it fixes or triages.
6. **Commits:** Atomically commits `phase<N>.<M>: <what changed>`.
7. **Updates Memory:** Updates `STATE.md`, clears `IN FLIGHT`, and repeats.

---

## 📋 Operational Workflow Reference

| Workflow Command | File Path | When to Use & What It Does |
|---|---|---|
| **`/ps`** | `.agents/workflows/ps.md` | **Kickoff:** Decodes PS $\rightarrow$ differentiator $\rightarrow$ human pause $\rightarrow$ architecture $\rightarrow$ plan $\rightarrow$ team split. |
| **`/next`** | `.agents/workflows/next.md` | **Execution Loop:** Unattended atomic execution of sub-tasks. Run, walk away, and return. |
| **`/close-phase`** | `.agents/workflows/close-phase.md` | **Phase Boundary:** Runs `make verify-full`, critic audits, squash-merges, and tags `demo-ready-p<N>`. |
| **`/harden`** | `.agents/workflows/harden.md` | **Score Optimization:** Run around the 70% mark. Dispatches all 4 critics, ranks fixes by Score/Hour. |
| **`/ui-review`** | `.agents/workflows/ui-review.md` | **Visual Audit:** Takes headless PNG screenshots across 375/768/1440 viewports and scores craft $\ge 7/10$. |
| **`/unblock`** | `.agents/workflows/unblock.md` | **Human Resumption:** Run immediately after you provide a requested API key or decision in `NEEDS_YOU.md`. |
| **`/sitrep`** | `.agents/workflows/sitrep.md` | **Teammate Status:** Instant 10-line text snapshot: phase, clock, demo status, blockers, and next action. |
| **`/demo-prep`** | `.agents/workflows/demo-prep.md` | **Final 15% Lockdown:** Verifies public deployment, demo accounts, `make reset-demo`, and offline backup videos. |

---

## ⌨️ Makefile Commands & Specifications

Hack Engine ships with a master `Makefile` where the exit code is the sole referee:

```bash
# 1. Fast-Tier Verification (< 30s) — Runs on EVERY commit
make verify

# 2. Slow-Tier Verification — Runs at phase close and /harden
make verify-full

# 3. Pristine Demo Reset (< 5s) — Restores clean state & 30+ seeds
make reset-demo

# 4. Idempotent Database Seed — Loads 30+ realistic domain records
make seed

# 5. Local Development — Boots complete application stack
make dev

# 6. Deployment Verification — Audits production environment
make deploy
```

### Fast Tier vs. Slow Tier Breakdown

| Tier | Script | Included Gate Checks | Duration Target |
|---|---|---|---|
| **Fast Tier** | `scripts/verify.sh` | `state-lint`, `typecheck`, `lint`, `test-unit`, `ui-audit`, `ux-gate`, `hardening-gate`, `test-e2e` (smoke) | `< 30 seconds` |
| **Slow Tier** | `scripts/verify-full.sh` | Fast Tier + `ui-review-gate` ($\ge 7/10$), `impact-gate` ($\ge 6/10$ & `/impact`), `a11y` (axe-core), `perf` (Lighthouse) | `< 2 minutes` |

---

## 🛡️ The Four Quality Systems

Detailed thoroughly in [QUALITY.md](QUALITY.md):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE FOUR QUALITY SYSTEMS                        │
├───────────────────────┬────────────────────────────────────────────────┤
│ 1. Product/Usability  │ docs/UX.md + docs/COPY.md + ux-gate.sh         │
│                       │ Enforces 4 states per view, Journey 2 <= 2 cls │
├───────────────────────┼────────────────────────────────────────────────┤
│ 2. UI & Visual Craft  │ design/DIRECTION.md + TOKENS.css + ui-audit.sh │
│                       │ 5 color tokens, clamp typography, GSAP motion  │
├───────────────────────┼────────────────────────────────────────────────┤
│ 3. Impact/Defensibility│ docs/IMPACT.md + RUBRIC.md + impact-gate.sh   │
│                       │ Live /impact route, sourced arithmetic, limits │
├───────────────────────┼────────────────────────────────────────────────┤
│ 4. Hardening/Security │ docs/SECURITY.md + docs/OPS.md + hardening-gate│
│                       │ Postgres mandatory, authz test, reset-demo <5s │
└───────────────────────┴────────────────────────────────────────────────┘
```

---

## 🚫 Ten Strict Guardrails (Mined from Real Project Failures)

Hack Engine codifies hard lessons extracted from real past hackathon repositories:

| Past Mistake | Evidence Project | Mechanical Gate Enforced |
|---|---|---|
| **1. SQLite in Production** | Sentinel, Dossier, Aloorithm | `hardening-gate.sh` fails if any `.db` file exists outside `tests/` or if `sqlite:///` is in `.env.example`. |
| **2. Auth Deferred Indefinitely** | Nexus, Aloorithm | `security-baseline` requires a passing server-side tenant isolation test before Phase 1 can close. |
| **3. Mid-Hackathon Backend Rework** | Aloorithm, Distro | `architecture` requires `SCHEMA.md` and migrations to be green before endpoints are written. |
| **4. Multi-Stakeholder Scope Creep**| Aloorithm (8 roles), AEGIX | `solution-design` caps scope to **max 2 user personas**. Others are sent to `PLAN.md` Cut List. |
| **5. Live Third-Party API Outages** | Aloorithm HuggingFace outage | `demo-resilience` mandates boolean `ENABLE_<SERVICE>` flags and deterministic offline mock fallbacks. |
| **6. Stale Docs & Reactive Patching**| Sentinel, Aloorithm | `state-lint.sh` fails if docs are older than newest source files. Prohibits `*_REWORK_*` patch files. |
| **7. Impact Claims on Slides Only** | Sentinel, AEGIX | `impact-gate.sh` requires live `/impact` route computing numbers dynamically from database records. |
| **8. Soft Service Boundaries** | Nexus PII leaks, Orcheon | `architecture` requires an explicit Service Trust Matrix defining who reads which tables and keys. |
| **9. Exploding Governance Docs** | Sentinel (7 docs), Aloorithm (9)| `scaffold` consolidates state strictly into `STATE.md`, `PLAN.md`, and `ARCHITECTURE.md`. |
| **10. Demo on Localhost / Postman** | Distro, Sentinel | `hardening-gate.sh` fails if `localhost` appears in `DEMO.md`. 90s path must be public and click-only. |

---

## 📦 Pre-Debugged Stack Templates

Hack Engine includes three verified, production-ready stack scaffolds in `templates/`:

1. **`templates/stack-fastapi-react/` (Recommended Default)**
   - **Backend:** Python FastAPI, Pydantic v2, SQLAlchemy async, asyncpg, Uvicorn, Pytest.
   - **Frontend:** React 18, Vite 5, Tailwind CSS, Lucide Icons, GSAP, Lenis.
   - **Infra:** PostgreSQL 16, Docker Compose, `render.yaml` one-click deploy blueprint.
2. **`templates/stack-polyglot/` (High-Throughput / Complex Engines)**
   - **Topology:** FastAPI Gateway + Go/Chi Tool Gateway + Rust Axum Solver + Next.js 14.
3. **`templates/stack-node-react/` (Rapid Prototyping)**
   - **Topology:** Node.js ESM Express + React 18/Vite + Neon PostgreSQL.

---

## 👥 Human-Agent Collaboration Protocol

### The Non-Blocking Escalation Queue (`NEEDS_YOU.md`)
If the agent needs an API key, OAuth account, cloud credential, or product decision:
1. It **never stops** and **never asks questions in chat**.
2. It logs a numbered entry in `NEEDS_YOU.md` with:
   - What is needed.
   - Exact steps/URL to get it.
   - What will unblock once provided.
   - What the agent is working on in parallel meanwhile.
3. It marks the task `BLOCKED` in `STATE.md` and continues executing unblocked tasks.
4. When you provide the key, type `/unblock` to resume.

### Human Lane Reservations (`HUMANS.md`)
`HUMANS.md` divides file paths across teammates and autonomous agents:
- Paths claimed by a human collaborator are **strictly read-only** to the agent.
- Prevents catastrophic merge collisions on `main` during late-stage crunch.

---

## 📜 The Loop Contract (`AGENTS.md`)

```text
1. ORIENT. At session start read STATE.md, PLAN.md, ARCHITECTURE.md, and current PHASE-N.md.
2. RESUME SAFELY. If STATE.md is IN_PROGRESS, finish or abandon IN FLIGHT work first.
3. ONE UNIT. Work on exactly one sub-task from PLAN.md. Write IN FLIGHT before editing.
4. VERIFY OR IT DIDN'T HAPPEN. Sub-task complete only when `make verify` exits 0.
5. COMMIT. On verify-pass: git commit -m "phase<N>.<M>: <what changed>". Tag releases.
6. WRITE STATE. Update STATE.md, clear IN FLIGHT, refresh living contracts.
7. NEVER BLOCK ON ME. Append dependencies to NEEDS_YOU.md, mark BLOCKED, move to next task.
8. ANTI-THRASH. Same error 2x: write hypothesis in docs/debug/<slug>.md. 4x: escalate & move on.
9. CLOCK OVER SCOPE. Phase over budget by 50%: ship PLAN.md demo fallback, run budget-pivot.
10. MAIN IS ALWAYS DEMOABLE. Never merge a state that cannot be shown to a judge.
11. NO PLACEHOLDERS. No lorem ipsum, no TODO stubs in merged code, no mock database calls.
12. STAY OUT OF HUMAN LANES. Check HUMANS.md before editing. Claimed lanes are read-only.
13. QUALITY IS NOT OPTIONAL. Fast gates run every commit. Slow gates run at phase close.
14. HALT. Stop only when all phases DONE, clock exhausted, or all tasks blocked in NEEDS_YOU.
```

---

## 📄 License

MIT © Raphel. Built for elite hackathon performance.
