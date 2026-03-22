# Design System — Walter

## Product Context
- **What this is:** A German-language iOS app for self-employed tradespeople (Handwerker). Create jobs, add line items, generate PDF Angebote and Rechnungen, track payment status, attach photos, manage your Firmenprofil.
- **Who it's for:** Sole traders and small craft businesses (Elektriker, Klempner, Fliesenleger, etc.) — using the app on the job site and at the desk.
- **Space/industry:** Field service management / invoicing. Competitors (Lexoffice, SevDesk) feel like desktop accounting software. Walter is mobile-first and premium.
- **Project type:** Native iOS app (React Native + Expo, Expo Router)

---

## Creative North Star: The Analytical Monolith

This system moves beyond standard SaaS aesthetics by treating the user interface as a high-end editorial piece. It is characterized by immense breathing room, hyper-precise typography, and a "monolithic" structural approach where content blocks feel carved out of a singular space. Unlike typical dashboards that rely on cluttered grids, this system uses intentional asymmetry and vast negative space to frame AI-driven insights as premium, authoritative artifacts. The goal is to make data feel not just informative, but inevitable and transparent.

The system supports both **light mode** and **dark mode**, determined by device settings. Both modes share the same editorial identity — only the tonal palette inverts.

---

## Aesthetic Direction
- **Direction:** Brutally Minimal / Editorial
- **Decoration level:** Minimal — typography and tonal layering do all the work
- **Mood:** Clinical yet sophisticated. Data as premium artifact. A high-end financial report, not a SaaS dashboard.

---

## Typography

- **Display/Hero:** Geist 700 — technical, monospaced-influenced proportions convey the AI-centric nature of the product
- **Headline:** Geist 600 — primary anchor for content blocks
- **Body:** Inter 400 — maximum readability in data-heavy contexts
- **UI/Labels:** Inter 600, ALL-CAPS, +0.05em letter spacing — signifies "System Data"
- **Data/Numbers:** Geist 700, `font-variant-numeric: tabular-nums`
- **Loading:** Google Fonts CDN (Geist + Inter)

### Scale
| Role | Size | Weight | Tracking | Font |
|------|------|--------|----------|------|
| Display-LG | 3.5rem (56px) | 700 | -0.02em | Geist |
| Headline-MD | 1.75rem (28px) | 600 | -0.01em | Geist |
| Headline-SM | 1.25rem (20px) | 600 | normal | Geist |
| Body | 1rem (16px) | 400 | normal | Inter |
| Body-SM | 0.875rem (14px) | 400 | normal | Inter |
| Label-SM | 0.6875rem (11px) | 600 | +0.05em | Inter, ALL-CAPS |
| Data | 1.125rem (18px) | 700 | normal | Geist, tabular-nums |

---

## Color

### Approach: Restrained Monochromatic
One primary color (black or white, mode-dependent) with no warm accent. Status colors (green, amber, red) are the ONLY chromatic elements in the entire UI. This makes them extraordinarily powerful signals.

### Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#000000` | High-authority CTAs, structural anchors, primary buttons |
| `on_primary` | `#FFFFFF` | Text on primary buttons |
| `surface` | `#F9F9F9` | Base background |
| `surface_low` | `#F3F3F3` | Slightly elevated sections |
| `surface_container` | `#EEEEEE` | Container backgrounds |
| `surface_high` | `#E8E8E8` | Secondary buttons, chips, elevated UI |
| `surface_highest` | `#E2E2E2` | Highest tonal elevation |
| `surface_card` | `#FFFFFF` | Cards floating on container backgrounds |
| `on_surface` | `#1A1C1C` | Primary text |
| `on_surface_variant` | `#5E5E5E` | Secondary text, descriptions |
| `outline` | `#747878` | Tertiary text, labels, input underlines |
| `outline_variant` | `#C4C7C7` | Ghost borders (at 15% opacity) |
| `primary_container` | `#1C1B1B` | Signature gradient endpoint |
| `success` | `#2D7A4F` | Paid status |
| `warning` | `#8A6D00` | Invoiced/pending status |
| `error` | `#BA1A1A` | Error states, destructive actions |

### Dark Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#FFFFFF` | High-authority CTAs, structural anchors, primary buttons |
| `on_primary` | `#000000` | Text on primary buttons |
| `surface` | `#0F0F0F` | Base background |
| `surface_low` | `#141414` | Slightly elevated sections |
| `surface_container` | `#1A1A1A` | Container backgrounds |
| `surface_high` | `#212121` | Secondary buttons, chips, elevated UI |
| `surface_highest` | `#282828` | Highest tonal elevation |
| `surface_card` | `#141414` | Cards floating on surface base |
| `on_surface` | `#E6E6E6` | Primary text (off-white, never pure white) |
| `on_surface_variant` | `#8A8A8A` | Secondary text |
| `outline` | `#5A5A5A` | Tertiary text, labels, input underlines |
| `outline_variant` | `#3A3A3A` | Ghost borders (at 15% opacity) |
| `primary_container` | `#1C1B1B` | Signature gradient endpoint |
| `success` | `#4ADE80` | Paid status (brightened for dark bg) |
| `warning` | `#FBBF24` | Invoiced/pending status (brightened) |
| `error` | `#FF6B6B` | Error states (brightened) |

### Color Rules

1. **No warm accent color.** There is no amber, blue, or purple primary. The only chromatic elements are semantic status colors.
2. **Status colors are rare and powerful.** Because they're the only color in a monochromatic UI, they carry enormous visual weight. Use them only for their semantic meaning.
3. **Never use pure gray (#808080).** Always use the specific neutrals from the token set.
4. **Links use `primary` with underline**, not blue.

---

## Elevation & Depth: Tonal Layering

Traditional drop shadows are replaced by **Ambient Luminance** and **Tonal Layering**.

### The Layering Principle
Depth is achieved by stacking surface tokens:
- *Base:* `surface` — the canvas
- *Level 1:* `surface_low` — subtle lift
- *Level 2:* `surface_card` — cards and floating content

### The "No-Line" Rule
**1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined exclusively through background color shifts. A `surface_card` section sits directly against a `surface` or `surface_container` background to define its territory.

Exception: **Input fields** use a bottom-only underline in `outline_variant` at 40% opacity for their resting state.

### Ambient Shadows
When an element must float (e.g., a dropdown), use:
- Light mode: `box-shadow: 0 4px 40px rgba(0,0,0,0.04)`
- Dark mode: `box-shadow: 0 4px 40px rgba(255,255,255,0.03)`

### The "Ghost Border" Fallback
If a container requires definition against an identical background (e.g., white card on white section):
- `outline_variant` at **15% opacity**

### Glassmorphism (floating nav, modals)
- Light: `rgba(255,255,255,0.8)` + `backdrop-blur: 16px`
- Dark: `rgba(20,20,20,0.8)` + `backdrop-blur: 16px`

### Signature Texture
For hero sections or high-impact data visualizations: subtle linear gradient from `primary` to `primary_container` at 45°. Adds a "lithic" quality that flat colors cannot replicate.

---

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable — the Monolith breathes
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)
- **Macro-spacing between sections:** Use `3xl` (64px) or more. When in doubt, increase white space.

---

## Layout
- **Approach:** Asymmetric editorial on larger screens, single-column on mobile
- **Max content width:** 375px phone viewport (iOS)
- **Border radius hierarchy:**
  - Cards, containers: `16px` (lg)
  - Buttons, pills: `9999px` (full)
  - Chips, small elements: `10px` (md)
  - Input fields: `0px` (no radius — underline-only style)

---

## Motion
- **Approach:** Minimal-functional
- **Primary button hover:** `scale(1.02)` — no color change, preserving the monolith feel
- **Easing:** enter: `ease-out`, exit: `ease-in`, move: `ease-in-out`
- **Duration:** micro: 50-100ms, short: 150-250ms, medium: 250-400ms
- **Transitions:** Only `transform` and `opacity` — never animate layout properties

---

## Components

### Buttons
- **Primary:** Background: `primary`, Text: `on_primary`, Radius: `full` (9999px)
- **Secondary:** Background: `surface_high`, Text: `on_surface`, Radius: `full`
- **Hover/Press:** Scale 1.02x (primary), opacity 0.85 (secondary)
- **Disabled:** `surface_high` background, `outline` text

### Input Fields
- **Styling:** No background fill. No border. Bottom-only underline in `outline_variant` at 40% opacity.
- **Focus:** Underline transitions to `primary` at 100% opacity.
- **Error:** `error` color for underline and helper text.
- **Form fields:** Uniform card background — no alternating row colors.

### Cards & Lists
- **Rule: No divider lines.** Separate list items using `spacing-lg` (24px) or background color shifts between `surface` and `surface_low`.
- **Data Cards:** `surface_card` background with `lg` (16px) corner radius.
- **Job Cards:** `surface_card` on `surface` base. No borders, no shadows. Tonal lift only.

### Chips / Badges
- **Status badges:** Semantic color at 12% opacity background, full semantic color text. Radius: `full`.
- **Action chips:** `primary` text on `surface_highest` background. No border.

### Icons
- **Style:** Stroke-based SVG, 2px stroke width, `currentColor`
- **No emoji.** Emoji render as `?` boxes on the simulator. All icons must be drawn `<View>` components or SVG.
- **Icon buttons:** 44px touch target, `surface_high` circle background

### Bottom Navigation
- **Glassmorphism:** Semi-transparent surface with backdrop-blur
- **Active indicator:** `primary` color
- **No top border line** — the glass effect defines the boundary

### FAB (Floating Action Button)
- `primary` background, `on_primary` text
- 52px circle, ambient shadow
- Bottom-right positioning

---

## Screen Patterns

### Dashboard
1. **Greeting** — Geist 700, Headline-MD size, left-aligned
2. **Stat tiles row** — 3 tiles, `surface_card` on `surface` base, Geist 700 tabular-nums for values
3. **Section labels** — Label-SM (ALL-CAPS, tracked)
4. **Job cards** — `surface_card`, customer name + status badge + description
5. **Glassmorphism bottom nav**

### Job Detail
1. **Hero amount** — Geist 700, Display-LG size (or 2.25rem on mobile), left-aligned, tabular-nums
2. **Customer + status** — Body-SM, `on_surface_variant`
3. **Icon action row** — `surface_card` background, 4 icon buttons (PDF, Bearbeiten, Teilen, Mehr)
4. **Timeline** — Dot indicators: `primary` for completed, `outline_variant` for pending
5. **Line items** — Inside `surface_card` container, no divider lines between items
6. **Totals** — `surface_card` block, gross amount in bold

### New Job (Voice/Text Input)
1. **Title** — Headline-SM, left-aligned
2. **Hint text** — Body-SM, `on_surface_variant`
3. **Pill input container** — `surface_card`, radius 20px, min-height 140px
4. **Mic button** — Inset top-right, `surface_high` circle, `primary` capsule icon
5. **Submit button** — Full-width primary pill button

### Forms (Firmenprofil, Auftrag bearbeiten)
1. **Section labels** — Label-SM above each card group
2. **Form cards** — `surface_card` containers, fields stacked vertically
3. **Field style** — Label-SM above, underline input below. **No alternating row colors.**
4. **VAT chips** — `surface_high` default, `primary` when active
5. **Add button** — Dashed outline in `outline_variant`, `primary` text

### Job List
1. **Title** — Headline-SM
2. **Search bar** — `surface_card`, rounded, placeholder text
3. **Job cards** — Same as dashboard cards
4. **FAB** — Bottom-right, `primary` circle with "+"

---

## Dark/Light Mode Implementation

Use React Native's `useColorScheme()` hook to detect device preference. Theme tokens should be structured as:

```typescript
const lightTokens = { ... };
const darkTokens = { ... };

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTokens : lightTokens;
}
```

All components reference tokens via the theme hook. No hardcoded colors.

---

## Do's and Don'ts

### Do:
- **Do** use macro-spacing between sections (48-64px minimum)
- **Do** treat data amounts as art — Geist 700, tabular-nums, prominent positioning
- **Do** use tonal layering for depth — cards on surfaces, surfaces on backgrounds
- **Do** keep the monochromatic discipline — status colors are the only exception
- **Do** use bottom-border-only inputs — the editorial signature of this system

### Don't:
- **Don't** use 1px dividers to separate content — use background shifts or spacing
- **Don't** use alternating row colors in forms — uniform card background only
- **Don't** use drop shadows for elevation — use tonal layering
- **Don't** use emoji as icons — they render as `?` on the simulator
- **Don't** use gradients on buttons or backgrounds (except the signature texture)
- **Don't** use blue for links or primary actions — use `primary` (black/white) with underline
- **Don't** use pure white (#FFFFFF) for text in dark mode — use off-white (#E6E6E6)
- **Don't** use warm accent colors (amber, orange, etc.) — the Monolith is purely monochromatic

---

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-22 | Replaced dark/amber system with Analytical Monolith | Editorial authority, premium feel, device-adaptive light/dark mode |
| 2026-03-22 | Geist + Inter typography | Technical precision (Geist) meets readability (Inter) |
| 2026-03-22 | No warm accent color | Monochromatic discipline makes status colors maximally powerful |
| 2026-03-22 | No alternating row colors in forms | Uniform card background with underline inputs provides cleaner rhythm |
| 2026-03-22 | Primary inverts between modes | Black (light) ↔ White (dark) maintains authority in both contexts |
