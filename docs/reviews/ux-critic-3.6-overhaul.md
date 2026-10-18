# UX Critic — Phase 3.6 Operator Console Overhaul

## Product direction

The console now follows an operator-control-room layout rather than a generic dashboard:

- Persistent left rail on desktop; off-canvas navigation on mobile.
- A compact operator header separates workspace context from system state.
- The main content uses asymmetric editorial spacing and dense data surfaces for security leads, platform engineers, and auditors.
- Teal is reserved for trusted/active states, with amber for approvals and soft red for quarantine or blocked activity against a slate-black foundation.
- GSAP animates only shell and content entry; `prefers-reduced-motion` disables it.

## Usability checks

| Requirement | Result |
|---|---|
| Primary operator navigation | Persistent named sections with active state, counts, keyboard arrows, Home/End, and mobile drawer |
| Risk triage | Registry keeps search, state filters, readable risk reason, semantic diff, approve, and block actions |
| Evidence path | Audit remains one navigation action away and retains export behavior |
| Failure recovery | Existing skeleton, error, empty, retry, and success flows remain intact |
| Motion | GSAP entrance transitions only; no hover-scale, decorative gradients, or model-generated visual filler |
| Responsive behavior | Desktop rail, tablet compression, and mobile drawer/horizontal content behavior are covered by existing viewport checks |

## Verification

- `npm run build` — pass
- `bash scripts/checks/ui-audit.sh` — pass
- `bash scripts/checks/ux-gate.sh` — pass
- `bash scripts/verify.sh` — pass
- `bash scripts/verify-full.sh` — pass
