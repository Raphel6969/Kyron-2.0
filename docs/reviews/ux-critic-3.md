# UX Critic — Phase 3 Console Usability Pass

## Findings addressed

- The console now exposes a persistent page title and workspace breadcrumb, so an operator always knows which control-plane surface is active.
- Navigation is usable on narrow screens and supports Arrow, Home, and End keys with `aria-selected` and `aria-current` state.
- The overview's next-step cards are semantic buttons rather than clickable `div` elements, reducing dead ends for keyboard and assistive-technology users.
- Registry and policy selectors expose their state through `aria-pressed`.
- The drift inspection surface is a labelled modal dialog with a visible focus ring system shared by buttons, links, inputs, and selects.
- The overview no longer renders a fabricated blocked-call count. It reads `/v1/reports/summary` and shows an honest loading dash or zero when the API is unavailable.

## Journey checks

| Journey | Result |
|---|---|
| Security lead: overview → registry → drift → approve | 3 clicks; action remains reachable from the registry row and drift modal |
| Judge: console → differentiator views | 1 click from overview to Registry, Egress, or Audit; live blocked-call metric comes from the API |
| Error recovery | Registry, approvals, and audit retain inline error messages with retry actions |

## Verification

- `npm run build` — pass
- `bash scripts/checks/ui-audit.sh` — pass
- `bash scripts/checks/ux-gate.sh` — pass
- `bash scripts/verify.sh` — pass
