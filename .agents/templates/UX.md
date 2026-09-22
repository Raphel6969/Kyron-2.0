# UX — User Journey Maps & Interaction Contracts

> **Product Usability Contract:** Every interaction path must be accounted for.
> No dead ends, no unhandled loading states, and strict limits on click depth.

---

## 1. Journey 1: The Core Value Path (Primary Persona)
- **Actor:** `<primary_persona>`
- **Starting Point:** `<landing_page_or_dashboard>`
- **Objective:** `<primary_outcome_to_achieve>`
- **Maximum Allowed Clicks:** `<e.g._3_clicks>`

| Step # | Screen / Route | User Action | Expected System Response | Fallback / Error Behavior |
|---|---|---|---|---|
| 1 | `/` | `<clicks_cta>` | `<navigates_to_console>` | `<fallback_if_unauthenticated>` |
| 2 | `/console` | `<inputs_data_or_triggers_action>` | `<displays_live_result>` | `<inline_error_alert>` |
| 3 | `/console/result` | `<confirms_or_exports>` | `<downloads_or_saves_audit>` | `<retry_toast>` |

---

## 2. Journey 2: The Judge Verification Path (Evaluation Persona)
- **Actor:** Hackathon Judge (Short attention span, evaluating technical claims)
- **Starting Point:** `<production_url>`
- **Objective:** Verify differentiator and live impact calculation
- **Maximum Allowed Clicks:** `2 clicks`

| Step # | Screen / Route | User Action | Expected System Response | Fallback / Error Behavior |
|---|---|---|---|---|
| 1 | `/` | Click "Live Demo" or "Try Demo" | Loads console pre-seeded with realistic data | Instant guest token session |
| 2 | `/impact` | Inspects live arithmetic calculation | Displays real-time disparity reduction from DB | Pre-calculated fallback cache |

---

## 3. Journey 3: The Edge / Recovery Path
- **Actor:** `<user_encountering_network_or_system_failure>`
- **Starting Point:** `<active_workflow_screen>`
- **Objective:** Graceful degradation and recovery without lost state

| Step # | Screen / Route | Failure Injected | Visible User Feedback | Recovery Mechanism |
|---|---|---|---|---|
| 1 | `<active_route>` | Upstream API timeout | Non-blocking inline banner with retry action | Reverts to cached/deterministic fallback |
| 2 | `<active_route>` | Invalid payload submission | Specific field-level error highlight | Input preserved; user edits without reset |

---

## 4. Mandatory State Coverage per Route
Every registered route in `routes.json` must provide implementations for:
1. **Designed Empty State:** Clean typography and clear primary action when zero data exists.
2. **Skeleton Loading State:** Dimension-accurate placeholder shapes. **Spinners are banned.**
3. **Error State:** Human-readable diagnosis with a functional retry button.
4. **Success State:** Instant visual feedback with updated metrics.
