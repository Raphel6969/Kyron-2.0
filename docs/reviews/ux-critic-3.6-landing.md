# UX Critic — Overview as Product Landing Experience

## Research anchors

- **Cloudflare One:** clear “safe adoption” positioning, composable architecture explanation, use-case sections, and measured outcomes before deep product detail.
- **Snyk AI Security Platform:** machine-speed headline, product diagram, prescriptive six-step operating path, and explicit differentiation between visibility, prevention, prioritization, and proof.
- **Awwwards editorial pattern:** left-led statement, restrained data visualization, asymmetric sections, and motion used to reveal product structure rather than decorate it.

## Applied to Kyron

- The overview now explains the product before exposing the console mechanics.
- The Agent → Kyron → Tools flow makes the trust boundary visible in one glance.
- The seven-stage list shows how a call is handled from discovery through signed evidence.
- The daily operating loop maps directly to company roles and recurring work.
- Live counts remain sourced from the control plane; no performance or impact number is invented in the UI.
- Honest limits are visible next to the dossier action so the product does not overclaim remote-server inspection.

## Verification

- `npm run build` — pass
- `bash scripts/checks/ui-audit.sh` — pass
- `bash scripts/checks/ux-gate.sh` — pass
- `bash scripts/verify.sh` — pass
- `bash scripts/verify-full.sh` — pass
