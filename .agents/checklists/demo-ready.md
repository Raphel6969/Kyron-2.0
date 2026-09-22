# Demo Ready Checklist (Final 15% Lockdown)

> **Final Submission Standard:** Run by `/demo-prep` before final judging or submission.
> If any item is unchecked, execute the corresponding contingency fallback.

---

## 1. Production Deployment & Resilience
- [ ] Application is deployed and live on a public URL (Render / Vercel / Fly).
- [ ] `DEMO.md` contains the public production URL with zero `localhost` references.
- [ ] `make reset-demo` tested live; restores clean state and demo seeds in < 5 seconds.
- [ ] All 3rd-party integrations have verified `ENABLE_<SERVICE>` flags and seeded fallbacks.

## 2. Judge Path & Credibility
- [ ] 90-second judge click-path in `DEMO.md` rehearsed end-to-end without touching terminal.
- [ ] First click from landing page lands directly on the core technical differentiator.
- [ ] `/impact` route live and calculating verified arithmetic from seeded database events.
- [ ] `docs/IMPACT.md` has sourced baseline and explicit "Honest Limits" section.

## 3. Visual Craft & Experience
- [ ] All routes rendered cleanly at 375px (mobile), 768px (tablet), and 1440px (desktop).
- [ ] Zero AI clichés: no purple glow buttons, no generic 3-up cards, no emojis as icons.
- [ ] GSAP reveals and Lenis smooth scroll active without layout shifts or jank.
- [ ] Designed empty states, skeletons, and error boundaries verified across all views.

## 4. Fallback Assets
- [ ] Unlisted HD video walkthrough (screen recording with audio) uploaded and linked in `DEMO.md`.
- [ ] Pitch outline and slide deck synchronized with live app numbers.
- [ ] Repository `README.md` clean, informative, with architecture diagram and live URL.
