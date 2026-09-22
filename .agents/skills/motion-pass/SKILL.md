---
name: motion-pass
description: Load this skill in the final polish phase or during /ui-review to implement GSAP stagger reveals, Lenis smooth scrolling, clip-path transitions, and eliminate cheap hover-only effects.
---

# WHEN TO LOAD
Load during Phase 3, during `/ui-review`, or in the final 15% polish pass to transform static UI into an Awwwards-caliber kinetic experience.

# INPUTS
- `design/DIRECTION.md` (Motion principles)
- Frontend client components (`src/` or `app/`)
- GSAP and Lenis libraries

# OUTPUTS
- Lenis smooth-scroll initialization script
- GSAP stagger entrance animations on headlines and cards
- One pinned narrative section along the feature walkthrough

# EXECUTION PROTOCOL

1. **Initialize Lenis Smooth Scroll:**
   Configure Lenis in root client layout:
   ```javascript
   import Lenis from 'lenis';
   const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
   function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
   requestAnimationFrame(raf);
   ```

2. **Implement Headline Word/Char Stagger Reveals:**
   Animate primary display headlines on load using GSAP:
   - Split text into words or characters.
   - Animate `y: 40, opacity: 0` -> `y: 0, opacity: 1` with `stagger: 0.04s, ease: 'power3.out'`.

3. **Implement Clip-Path Media & Card Reveals:**
   Add clip-path entrance triggers on critical data visualizations and cards:
   - `clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'`
   - Trigger via ScrollTrigger when element enters viewport.

4. **Implement Exactly One Pinned Narrative Section:**
   Pin a 3-step feature demonstration section as user scrolls, transitioning metrics or step diagrams sequentially.

5. **Purge Cheap Hover Scaling:**
   Audit and eliminate `hover:scale-105` and similar lazy CSS transitions. Replace with subtle border brightness shifts (`transition-colors duration-200`) and kinetic click response.

# EXIT CRITERIA
- [ ] Lenis smooth scrolling active on all major routes
- [ ] Headline stagger animations verified
- [ ] Exactly one pinned narrative section implemented
- [ ] `bash scripts/checks/ui-audit.sh` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
