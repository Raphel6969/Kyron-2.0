# HUMANS — Team Ownership & Lane Reservations

> **Strict 40-line cap.** The agent treats any path claimed by a human teammate as READ-ONLY.
> If the agent requires changes in a claimed lane, it MUST append to `NEEDS_YOU.md`.
> Never overwrite or edit across a human collaborator's files.

---

## 1. Lane Allocations

| Role / Person | Claimed Path(s) | Mode | Notes |
|---|---|---|---|
| **Lead / Product (@Saswat)** | `docs/pitch/*`, `design/DIRECTION.md` | Human Read/Write | Pitch narrative, product strategy, slide deck |
| **Agent (@Antigravity)** | `core/*`, `gateway/*`, `control/*`, `ui/*`, `lab/*`, `eval/*`, `tests/*` | Agent Active Lane | Custom gateway, Rust core, FastAPI, SOC UI, tests |

---

## 2. Shared Boundary Contracts (Require Mutual Sign-Off)
- `ARCHITECTURE.md` (System service topology and interfaces)
- `API.md` (MCP gateway framing and REST endpoints)
- `SCHEMA.md` (Database schemas and Rust core types)
- `PLAN.md` (Milestone deliverables and phase exit criteria)

---

## 3. Conflict Resolution
If an agent sub-task requires editing a human-claimed path:
1. Stop before editing.
2. File request in `NEEDS_YOU.md` quoting target line numbers.
3. Mark sub-task `status: BLOCKED` and proceed immediately to next unblocked task.
