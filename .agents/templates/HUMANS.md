# HUMANS — Team Ownership & Lane Reservations

> **Strict 40-line cap.** The agent treats any path claimed by a human teammate as READ-ONLY.
> If the agent requires changes in a claimed lane, it MUST append to `NEEDS_YOU.md`.
> Never overwrite or edit across a human collaborator's files.

---

## 1. Lane Allocations
| Role / Person | Claimed Path(s) | Mode | Notes |
|---|---|---|---|
| **Lead (Human)** | `design/DIRECTION.md`, `ARCHITECTURE.md` | Human Read/Write | Architectural & design direction |
| **Backend B** | `<services/data_pipeline/*>` | Human Read/Write | Custom ETL or data integration |
| **Frontend C** | `<src/components/custom_view/*>` | Human Read/Write | Presentation or deck polish |
| **Glue D** | `<docs/pitch/*>` | Human Read/Write | Pitch deck and submission collateral |
| **Agent** | `<src/core/*>`, `<backend/app/*>`, `<tests/*>` | Agent Active Lane | Automated features, tests, migrations |

---

## 2. Shared Boundary Contracts (Require Mutual Sign-Off)
- `API.md` (Both agent and human must adhere to schemas)
- `SCHEMA.md` (Database migrations managed via PRs)
- `routes.json` (Route manifest synced before UI testing)

---

## 3. Conflict Resolution
If an agent sub-task requires editing a path claimed above:
1. Stop before editing.
2. File request in `NEEDS_YOU.md` quoting the target line numbers.
3. Mark sub-task `status: BLOCKED` and pick next unblocked task.
