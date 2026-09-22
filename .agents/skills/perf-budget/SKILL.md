---
name: perf-budget
description: Load this skill in Phase 3 or during /harden to audit Core Web Vitals, enforce bundle size limits (<1.5MB), execute performance audits, and optimize frontend rendering bottlenecks.
---

# WHEN TO LOAD
Load during Phase 3 hardening passes, before final phase closure, or whenever frontend bundle sizes grow noticeably.

# INPUTS
- Frontend build configuration and production artifacts (`dist/` or `.next/`)
- `routes.json` (Target URLs for performance scanning)
- `scripts/checks/perf.sh`

# OUTPUTS
- Production bundle size report (<1.5MB ceiling)
- Performance optimization passes applied (dynamic imports, asset minification)
- Green execution of `scripts/checks/perf.sh`

# EXECUTION PROTOCOL

1. **Audit Production Build Artifacts:**
   Run production build: `npm run build` in frontend directory.
   - Inspect output bundle sizes.
   - Flag any JavaScript chunk exceeding 500KB or total initial bundle exceeding 1.5MB.

2. **Apply Code-Splitting & Lazy Loading:**
   For heavy dependencies (e.g. charts, syntax highlighters, PDF generators):
   - Replace direct static imports with dynamic lazy imports (`React.lazy()` or Next.js `dynamic()`).
   - Move non-critical dialogs and modals to deferred chunks.

3. **Audit Core Web Vitals:**
   - **Largest Contentful Paint (LCP):** Target < 2.5s. Preload critical fonts declared in `design/DIRECTION.md`.
   - **Cumulative Layout Shift (CLS):** Target < 0.1. Ensure image and skeleton elements have explicit aspect ratios and dimensions.
   - **Interaction to Next Paint (INP):** Target < 200ms. Debounce intensive state calculations.

4. **Execute Performance Gate:**
   Run `bash scripts/checks/perf.sh`.

# EXIT CRITERIA
- [ ] Total production bundle size within budget (<1.5MB)
- [ ] No un-split heavy libraries loaded on initial page load
- [ ] `bash scripts/checks/perf.sh` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
