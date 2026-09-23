---
name: ui-reference-library
description: Load this skill before any ui-build work to supply curated and domain-matched design reference patterns, with heavy emphasis on hero sections, editorial motion, and transition sequences. Prevents AI-generic layouts by injecting concrete visual DNA.
---

# WHEN TO LOAD
Load at the start of every `ui-build` call, and once at project start during the `design-system` phase. Also invoke standalone during `/ui-review` when screens look generic.

# INPUTS
- `docs/01-problem.md` (Domain and primary persona)
- `design/DIRECTION.md` (Declared reference sites)

# OUTPUTS
- 2–3 selected reference patterns injected into the current build context
- `design/DIRECTION.md` updated with a `## Dynamic References` section (project start only)

# EXECUTION PROTOCOL

## Phase A — Curated Static Core (always available)

Select the 2 reference archetypes from the table below that best match the product domain. Extract the listed specifics and apply them directly.

### Hero Archetypes (pick one per project)

**1. Statement + Ambient Motion**
- Full-viewport left-heavy type block. Heading occupies 60% of vertical space, weight 700–800, tracking `-0.04em`.
- Right column: looping ambient SVG or canvas — subtle, not decorative. Never stock photos.
- Hero-to-content transition: `clip-path: inset(0 0 100% 0)` → `inset(0 0 0% 0)` on scroll trigger. Duration `1.2s`, ease `power3.inOut`.
- GSAP copy reveal: `stagger: 0.06`, `duration: 1.0`, `y: 40 → 0`, `opacity: 0 → 1`, `ease: "power3.out"`.
- Reference DNA: Linear.app, Vercel.com, Ramp.com.

**2. Data-Reveal Scroll**
- Hero is a live data preview pinned in viewport while copy scrolls past it.
- Numbers count up on enter using GSAP CountTo. No spinners.
- Product mockup (real screenshot, not abstract blob) fades in at 30% scroll.
- GSAP ScrollTrigger pin: `pin: true`, `scrub: 1.2`.
- Reference DNA: Stripe.com, Clerk.com, Axiom.co.

**3. Product Mockup with Path Draw**
- Large product screenshot or illustration centered or right-offset, with SVG path draw animation on load.
- Path stroke animates over `1.8s` on `DOMContentLoaded`. GSAP: `strokeDashoffset: length → 0`.
- Heading is secondary — the product IS the hero.
- Reference DNA: Figma.com, Linear Issues page, Retool.com.

**4. Split-Screen Editorial**
- 50/50 horizontal split. Left: large serif or ultra-heavy sans heading. Right: metric or chart.
- Zero decorative elements. One `--color-accent` element maximum.
- Motion: left side slides in from `-80px`, right side from `+80px`, `stagger: 0`, `duration: 0.9`, `ease: "expo.out"`.
- Reference DNA: ChronicleHQ, Contra.com, Raycast.com.

---

### Section & Card DNA

**Risk / Alert Card** (attrition, security, fraud domains)
- Dark raised surface (`--color-surface-raised`), 1px border (`--color-neutral-border`).
- Left: colored severity bar (3px wide, full card height). Right: entity name + key metric.
- No rounded pill badges. No emoji. Use `lucide-react` icons at 16px only.
- Hover: border color shifts to `--color-accent`. No scale. No shadow change.

**Metric Block** (analytics, fintech, ops domains)
- Mono-spaced number at `clamp(2.4rem, 4vw, 3.2rem)`. Label below in `--color-neutral-muted` at 12px uppercase.
- Sparkline (24px tall) to the right if trend data exists.
- No card wrapper — metric blocks live on `--color-surface-base` directly.

**Timeline / Activity Item**
- Vertical left border line (1px `--color-neutral-border`) with dot at current position.
- Compact row: timestamp left, action right. No card elevation.
- New items animate in with `y: 12 → 0`, `opacity: 0 → 1`, `duration: 0.4`.

---

### Anti-Pattern List (ban these, apply the alternative)

| Banned | Use instead |
|---|---|
| 3-up equal card grid | Asymmetric 7/5 editorial split or masonry |
| Gradient hero text | High-contrast single weight, one accent color max |
| Centered hero with pill badge | Left-heavy type block with supporting data |
| Purple/blue gradient backgrounds | Dark surface tokens + single accent |
| `hover:scale-105` on cards | Border color shift or subtle `y: -2px` translate |
| Lottie abstract animation in hero | Real product screenshot or SVG path draw |
| Icon + text bullet lists as features | Numbered editorial sections with data proof |
| Modal-heavy flows | Inline expand / slide-over panels |
| Full-page loading spinner | Skeleton cards matching content dimensions |
| Emoji as status icons | `lucide-react` or inline SVG at 16px |

---

## Phase B — Dynamic Lookup (runs at project start)

Search Awwwards SOTD archive and Godly for 3 sites matching the product's specific domain (e.g. "HR analytics dashboard", "fraud detection tool", "credit risk platform").

For each found site, extract and record in `design/DIRECTION.md → ## Dynamic References`:
- Hero archetype (which of the 4 above, or describe if novel)
- Heading font weight and tracking value
- Primary motion mechanism
- Card/data-block treatment
- What the product does to stand out vs. generic SaaS

Write these extractions as 3–5 bullet points per site. Do not paste links as the sole output — extract the specifics.

# EXIT CRITERIA
- [ ] 2 curated archetypes selected and injected into build context
- [ ] `design/DIRECTION.md → ## Dynamic References` populated (project start) or skipped (mid-build)
- [ ] Hero archetype chosen and documented before any hero code is written
