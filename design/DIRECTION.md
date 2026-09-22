# DIRECTION — Design System Blueprint & Visual Tokens

> **Awwwards Standard:** Master design guidelines for Hack Engine builds.
> Enforced mechanically via `TOKENS.css` and `scripts/checks/ui-audit.sh`.

---

## 1. Reference Sites
1. **Reference 1:** `https://linear.app` — High information density, precise 1px borders, muted dark theme.
2. **Reference 2:** `https://chroniclehq.com` — Fluid typography hierarchy and kinetic narrative cards.
3. **Reference 3:** `https://godly.website` — Asymmetric editorial layouts and high-contrast typography.

---

## 2. Master Palette (5 Tokens)
- `--color-surface-base`: `#0A0D12` (Base dark surface)
- `--color-surface-raised`: `#121722` (Elevated card background)
- `--color-neutral-muted`: `#7E8C9F` (Secondary text and metadata)
- `--color-neutral-border`: `#1C2433` (Subtle structural borders)
- `--color-accent`: `#2563EB` (Single energetic accent, used on <= 3 elements)

---

## 3. Typography & Motion Standards
- **Display Scale:** `clamp(3.2rem, 7vw, 6.2rem)` with `-0.03em` tracking.
- **Heading Scale:** `clamp(1.8rem, 3.5vw, 3rem)` with `-0.02em` tracking.
- **Motion:** Lenis smooth scrolling, GSAP character stagger reveals, clip-path card transitions.
