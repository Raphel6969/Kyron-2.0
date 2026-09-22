# COMPONENTS — Component Catalog & Composition Rules

> **Composition Standard:** UI must be built from a strict, cohesive inventory of primitives.
> Ad-hoc styling, copy-pasted raw DOM nodes, and emoji icon sets are banned.

---

## 1. Core Primitives Inventory
| Component | Props / Interface | Permitted Variants | States Supported |
|---|---|---|---|
| `<Button>` | `variant, size, isLoading, icon, children` | `primary`, `secondary`, `danger` | Default, Active, Focus, Disabled, Loading |
| `<Card>` | `variant, padding, children` | `surface`, `raised`, `interactive` | Default, Hover (subtle border shift) |
| `<Badge>` | `variant, size, children` | `neutral`, `accent`, `destructive` | Static |
| `<Skeleton>` | `variant, width, height` | `line`, `block`, `circle` | Animated shimmer (deliberate pulse) |
| `<MetricCard>` | `label, value, delta, sparklineData` | `standard`, `highlighted` | Empty, Loading, Populated |

---

## 2. Forbidden Component Anti-Patterns
- **Generic 3-Up Feature Cards:**
  The `rounded-2xl + shadow-xl + p-6` card repeated identically 3 times across a row is banned.
- **Emoji as Icons:**
  Emojis in place of vector SVG iconography are banned. Use `lucide-react` or custom SVG paths.
- **Spinners in Data Views:**
  Floating circular spinners over blank backgrounds are banned. Use layout-accurate `<Skeleton>` components.
- **Floating Modals for Core Actions:**
  Critical user flows must be embedded directly in the page layout or slide-over sheets, not modal popups.

---

## 3. Composition Rules
1. **Typography Pairing:**
   A `<Card>` title must use the secondary display step with `-0.02em` tracking. Body uses font-normal.
2. **Spacing Grid:**
   Padding and margins strictly adhere to 4px multiples (`p-2`, `p-4`, `p-6`, `p-8`). Never arbitrary pixels.
3. **Interactive Focus:**
   Every clickable element must provide an explicit focus ring (`focus-visible:ring-2 focus-visible:ring-accent`).
