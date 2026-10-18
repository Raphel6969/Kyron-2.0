# UX — User Journey Maps & Interaction Contracts

> **Product Usability Contract:** Every interaction path must be accounted for.
> No dead ends, no unhandled loading states, and strict limits on click depth.

---

## 1. Journey 1: Security Lead Tool Approval & Drift Triage (Primary Persona)
- **Actor:** Enterprise Security / AppSec Lead
- **Starting Point:** `/console` (SOC Console Dashboard)
- **Objective:** Review flagged/quarantined tools, inspect semantic diffs for a changed tool, and approve or block with 1 click.
- **Maximum Allowed Clicks:** `3 clicks`

| Step # | Screen / Route | User Action | Expected System Response | Fallback / Error Behavior |
|---|---|---|---|---|
| 1 | `/console` | Clicks on "Quarantine Queue" alert badge | Navigates to `/console/registry?filter=quarantined` displaying flagged tools | Empty state: "Zero quarantined tools. Registry healthy." |
| 2 | `/console/registry` | Clicks on tool row `crm.get_customer` (flagged for drift) | Opens side-by-side semantic visual diff drawer highlighting mutated schema & description | In-drawer error banner if diff cannot be computed |
| 3 | `/console/registry` | Clicks "Approve & Sign Pin" button | Emits Ed25519 signature, commits pin, moves tool to `Active`, shows confirmation toast | Revert toast with actionable remediation error |

---

## 2. Journey 2: The Judge Verification Path (Evaluation Persona)
- **Actor:** Technical Judge / Auditor evaluating Kyron 2.0 claims
- **Starting Point:** Production Deployed URL (`/`)
- **Objective:** Verify zero-model deterministic decision latency (< 5ms) and live impact telemetry.
- **Maximum Allowed Clicks:** `2 clicks`

| Step # | Screen / Route | User Action | Expected System Response | Fallback / Error Behavior |
|---|---|---|---|---|
| 1 | `/` | Clicks "Live Interactive SOC Console" | Instant auto-login into pre-seeded guest session at `/console` with 30+ live tools | Instant demo guest credentials |
| 2 | `/impact` | Clicks "Quantified Impact" navigation tab | Renders dynamic arithmetic calculations, live attack mitigation counters, and token savings | Displays cached telemetry snapshot with warning tag |

---

## 3. Journey 3: The Edge / Recovery Path (Agent Developer Persona)
- **Actor:** Agent Developer / Platform Engineer whose agent triggered a policy block
- **Starting Point:** Agent terminal / IDE receiving a Kyron refusal payload
- **Objective:** Understand the block, review the legal recovery route, and request temporary capability lease.

| Step # | Screen / Route | Failure Injected | Visible User Feedback | Recovery Mechanism |
|---|---|---|---|---|
| 1 | Terminal / Client | Agent requests call exceeding source egress budget | Returns structured JSON error: `KYRON_POLICY_VIOLATION: egress.source_budget_exceeded` with approval URL | Clear remediation instructions; zero unhandled crashes |
| 2 | `/approvals/req_01J...` | Developer clicks approval URL | Opens scoped capability lease grant card pre-populated with required constraints | Form validation with instant feedback |
| 3 | `/approvals/req_01J...` | Clicks "Request 1-Hour Lease" | Dispatches request to SOC approval queue; returns webhook callback token | Non-blocking retry banner |

---

## 4. Mandatory State Coverage per Route

Every registered frontend route in `routes.json` must implement all four UI states:

1. **Designed Empty State:** Clean typography, friendly illustration, and a clear primary action button when zero records exist.
2. **Skeleton Loading State:** Dimension-accurate placeholder shapes matching the target component layout. **Spinners are banned.**
3. **Error State:** Human-readable diagnosis of the failure, exact HTTP or RPC status code, and a functional retry action.
4. **Success State:** Clear visual confirmation, kinetic state update, and updated metric counters.
