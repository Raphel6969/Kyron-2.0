---
name: ui-build
description: Load this skill whenever building or refining a frontend page or screen view to enforce the Definition of Done (DoD), implement the 4 required states, eliminate placeholders, and verify responsiveness across 375/768/1440 viewports.
---

# WHEN TO LOAD
Load whenever implementing a new UI route, page view, or major frontend feature component.

# INPUTS
- `design/DIRECTION.md` and `design/TOKENS.css`
- `design/COMPONENTS.md`
- `.agents/checklists/dod.md` (Definition of Done)

# OUTPUTS
- Fully implemented page component adhering to `dod.md`
- Visual capture test in `tests/visual/capture.spec.ts` passing
- Route entry in `routes.json`

# EXECUTION PROTOCOL

1. **Anchor to Product DNA Before Writing Any Code (Mandatory):**
   - Load skill `ui-reference-library`: select 2 matching reference archetypes for the product domain. Record which hero archetype is chosen.
   - Read `design/CONTEXT.md` (written by `ui-context-inject`): extract the layout constraint, emotional register, and motion constraints for this product. If `design/CONTEXT.md` does not exist yet, invoke `ui-context-inject` first.
   - Only proceed to DoD execution after both inputs are internalized.

2. **Review DoD Standard for Pages (Mandatory Lookup):**
   A page is done when it satisfies:
   - [ ] All four states: designed empty / skeleton loading / error / success — no spinners
   - [ ] Real seeded content, no lorem ipsum, no placeholder avatars
   - [ ] A motion primitive from TOKENS.css, zero hover-only interaction
   - [ ] Keyboard reachable, visible focus ring, contrast >= 4.5:1, correct at 375/768/1440
   - [ ] Page title, meta description, OG image
   - [ ] One Playwright assertion on a user-visible outcome

2. **Implement Layout & Grid Structure:**
   - Use 12-column responsive layout with an asymmetric editorial split (e.g. 7/5 or 8/4 columns).
   - Use CSS custom properties from `TOKENS.css` exclusively.

3. **Implement the 4 States:**
   - **Empty State:** Layout renders actionable instructions and button when collection is empty.
   - **Loading State:** Accurate `<Skeleton>` cards mimicking populated content dimensions.
   - **Error State:** Human-readable diagnosis card with active retry handler.
   - **Success State:** Seamless in-place updates with kinetic confirmation.

4. **Audit Anti-Patterns:**
   - Zero emojis used as icons (use `lucide-react` or SVG).
   - Zero generic 3-up card rows or centered hero pill badges.
   - Zero raw hover:scale effects.

5. **Register and Capture:**
   Add route to `routes.json`. Run visual capture to verify at 375px, 768px, and 1440px.

# EXIT CRITERIA
- [ ] Page satisfies all 6 DoD checklist requirements
- [ ] Route registered in `routes.json`
- [ ] `bash scripts/checks/ui-audit.sh` and `bash scripts/checks/ux-gate.sh` exit 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
