---
name: component-inventory
description: Load this skill to audit, construct, and maintain the component catalog in design/COMPONENTS.md, eliminate duplicated ad-hoc DOM structures, and enforce reusable primitive contracts.
---

# WHEN TO LOAD
Load during Phase 1/2 when authoring foundational UI primitives (`Button`, `Card`, `Badge`, `Skeleton`, `MetricCard`), or during `/harden` to refactor inconsistent component patterns.

# INPUTS
- `design/DIRECTION.md` (Visual tokens)
- `.agents/templates/COMPONENTS.md`
- Frontend components directory (`src/components/` or `app/components/`)

# OUTPUTS
- Instantiated `design/COMPONENTS.md` registering all reusable UI components
- Verified library of reusable primitives

# EXECUTION PROTOCOL

1. **Implement Core Primitives Library:**
   Build and standardize essential UI primitives:
   - `<Button>`: Variants: `primary`, `secondary`, `destructive`. Handles `isLoading` and disabled states.
   - `<Card>`: Variants: `surface`, `raised`, `interactive`. Strict 4px padding grid (`p-4`, `p-6`).
   - `<Badge>`: High-contrast status indicators with semantic color accents.
   - `<Skeleton>`: Shimmer effect matching true component dimensions.
   - `<MetricCard>`: Live stat container with label, value, delta, and optional sparkline.

2. **Purge Ad-Hoc DOM Elements:**
   Scan frontend components. Replace duplicated inline card wrappers or button classes with the standardized primitives from `COMPONENTS.md`.

3. **Enforce Composition Discipline:**
   - Ban generic 3-up card grids repeated identically.
   - Ban emoji icons inside buttons or headings.
   - Ensure all interactive elements include visible focus rings (`focus-visible:ring-2 focus-visible:ring-accent`).

4. **Update `design/COMPONENTS.md`:**
   Document props, interfaces, and variant options for every created primitive.

# EXIT CRITERIA
- [ ] `design/COMPONENTS.md` instantiated and up to date
- [ ] Primitives library implemented with TypeScript interfaces
- [ ] `bash scripts/checks/ui-audit.sh` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
