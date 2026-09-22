---
name: design-system
description: Load this skill in Phase 1 before building any UI to establish design/DIRECTION.md, generate TOKENS.css, lock in the 5 color tokens, wire fluid clamp typography, and configure Tailwind to ban raw palettes.
---

# WHEN TO LOAD
Load during Phase 1 prior to authoring any frontend views or components, or when initiating a complete visual overhaul to meet Awwwards craft standards.

# INPUTS
- `docs/01-problem.md` (Product personality and domain tone)
- `.agents/templates/DIRECTION.md`
- Frontend project configuration (`tailwind.config.js` or `package.json`)

# OUTPUTS
- Instantiated `design/DIRECTION.md` with 3 declared reference sites
- `design/TOKENS.css` defining the 5 color tokens and fluid clamp scales
- Tailwind configuration wired to custom properties (disabling raw colors)

# EXECUTION PROTOCOL

1. **Declare 3 Authentic Reference Sites:**
   Identify 3 real award-winning reference websites (e.g. from Awwwards, Godly, Land-book, Httpster) before writing any styling code. Record exact visual lessons in `DIRECTION.md`.

2. **Lock In the 5 Color Tokens:**
   Populate `design/TOKENS.css`:
   - `--color-surface-base`: Deep near-black or warm off-white (never `#000` or `#fff`).
   - `--color-surface-raised`: Elevated card and container background.
   - `--color-neutral-muted`: Secondary metadata and subtle descriptions.
   - `--color-neutral-border`: Structural 1px division borders.
   - `--color-accent`: Single high-energy accent token (used on <= 3 elements per screen).

3. **Configure Fluid Typography Scales:**
   Wire fluid `clamp()` values into CSS custom properties:
   - Display Step: `clamp(3.5rem, 8vw, 7rem)` with tracking `-0.03em`.
   - Section Heading: `clamp(2rem, 4vw, 3.5rem)` with tracking `-0.02em`.
   - Body: `clamp(1rem, 1.2vw, 1.125rem)` with line-height `1.6`.

4. **Wire Tokens into Tailwind Configuration:**
   Map theme colors in `tailwind.config.js` to read from CSS custom properties. Ensure raw palette names (e.g. `purple-600`, `blue-500`) do not resolve or trigger `ui-audit.sh` failures.

5. **Install Smooth Motion Primitives:**
   Configure Lenis smooth scroll and GSAP script tags/dependencies in the frontend package.

# EXIT CRITERIA
- [ ] `design/DIRECTION.md` instantiated with 3 reference sites
- [ ] `design/TOKENS.css` defines the 5 color tokens and clamp typography
- [ ] Tailwind configuration wired to tokens
- [ ] `bash scripts/checks/ui-audit.sh` exits 0

# NEXT
Execute `component-inventory` and `ui-build` skills.
