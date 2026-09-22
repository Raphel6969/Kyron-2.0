# DIRECTION — Design System & Visual Craft Blueprint

> **Anti-Slop Craft Standard:** Visual excellence wins hackathons.
> Strict discipline: 5 color tokens, fluid clamp typography, GSAP motion, and 3 named reference sites.
> Generic AI templates, purple gradient glows, and emoji icons are strictly banned.

---

## 1. Named Reference Sites (Declared Before Writing Any UI)
1. **Reference 1:** `<URL_and_name_e.g._linear.app_—_dense_editorial_rhythm_and_subtle_borders>`
2. **Reference 2:** `<URL_and_name_e.g._chroniclehq.com_—_fluid_typography_and_kinetic_cards>`
3. **Reference 3:** `<URL_and_name_e.g._godly.website_featured_site_—_high-contrast_typography>`

---

## 2. The 5 Color Tokens (Strict Palette Constraint)
*(Raw hex or arbitrary Tailwind color classes are banned. Map strictly to TOKENS.css).*

- **`--color-surface-base` (Near-Black / Off-White):** `<e.g._#0A0D12_—_never_pure_#000_or_#FFF>`
- **`--color-surface-raised` (Off-White / Deep Slate):** `<e.g._#12161F_—_deliberate_card_surface>`
- **`--color-neutral-muted` (Muted Neutral):** `<e.g._#717D96_—_secondary_text_and_meta>`
- **`--color-neutral-border` (Subtle Border):** `<e.g._#1E2638_—_structure_and_grid_lines>`
- **`--color-accent` (Single Purposeful Accent):** `<e.g._#2563EB_—_used_on_<=3_elements_per_screen>`

---

## 3. Typography Hierarchy & Fluid Clamp Scales
- **Display Face:** `<Named display font, e.g. 'Syne' or 'Space Grotesk' — chosen for architectural character>`
- **Body / Text Face:** `<Named text font, e.g. 'Plus Jakarta Sans' or 'Geist' — chosen for micro-legibility>`
- **Fluid Scales:**
  - **Hero Display:** `clamp(3.5rem, 8vw, 7rem)` with tracking `-0.03em`
  - **Section Heading:** `clamp(2rem, 4vw, 3.5rem)` with tracking `-0.02em`
  - **Body Text:** `clamp(1rem, 1.2vw, 1.125rem)` with line-height `1.6`
  - **Mono / Data:** `<Monospace font for numbers, code, and financial amounts>`

---

## 4. Motion Language (GSAP + ScrollTrigger + Lenis)
- **Kinetic Principles:**
  - Zero reliance on `hover:scale-*` as primary feedback.
  - Page-load word/character stagger reveals (`stagger: 0.04s, ease: 'power3.out'`).
  - Clip-path reveals on key cards and visual data assets (`clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'`).
  - Exactly one pinned narrative section during feature walkthrough.
  - Smooth kinetic scrolling powered by Lenis.

---

## 5. Layout & Grid Architecture
- **Grid:** 12-column responsive layout with visible column dividers or deliberate negative space.
- **Editorial Splits:** At least one asymmetric editorial 7/5 or 8/4 grid split on desktop.
- **Full-Bleed Moment:** At least one full-bleed interactive visual component breaking container boundaries.
