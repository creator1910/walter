# Design System — Walter

## Product Context
- **What this is:** A German-language iOS app for self-employed tradespeople (Handwerker). Create jobs, add line items, generate PDF Angebote and Rechnungen, track payment status, attach photos, manage your Firmenprofil.
- **Who it's for:** Sole traders and small craft businesses (Elektriker, Klempner, Fliesenleger, etc.) — using the app on the job site and at the desk.
- **Space/industry:** Field service management / invoicing. Competitors (Lexoffice, SevDesk) feel like desktop accounting software. Walter is mobile-first and premium.
- **Project type:** Native iOS app (React Native + Expo, Expo Router)
- **References:** ChatGPT iOS, Trade Republic — dark, focused, minimal. Amber as the single craftsman twist.

---

## Aesthetic Direction
- **Direction:** Dark-first, minimal — one warm accent. Like a precision instrument with a work light.
- **Decoration level:** None. No gradients, no textures, no patterns. Contrast and typography do all the work.
- **Mood:** A professional uses this. It's fast, it's focused, it doesn't get in the way. The amber CTA is the only thing that asks for your attention.

---

## Color

- **Approach:** Restrained — near-achromatic dark palette, one amber accent.

### Palette
| Role | Hex | Usage |
|---|---|---|
| **Background** | `#111111` | App background |
| **Surface** | `#1C1C1C` | Cards, modals |
| **Surface 2** | `#242424` | Elevated surfaces, input backgrounds |
| **Surface 3** | `#2C2C2C` | Pressed states, separators |
| **Text** | `#F5F4F2` | All primary text (warm white, not pure) |
| **Text Muted** | `#8A8A8A` | Secondary text, meta info, labels |
| **Text Dim** | `#4A4A4A` | Section labels, placeholders, doc numbers |
| **Border** | `#2A2A2A` | Card edges, dividers |
| **Border 2** | `#333333` | Input borders, stronger separators |
| **Amber** | `#E8A030` | Accent / CTA — the only warm color |
| **Amber Dim** | `#C48828` | Amber hover/pressed state |
| **Paid** | `#3D9B6B` | Bezahlt badge, success states |
| **Error** | `#D95535` | Validation errors, destructive actions |

### Status badge colors
| Status | Background | Text / Dot |
|---|---|---|
| draft / Entwurf | `#242424` | `#8A8A8A` |
| quote_sent / Angebot | `#1E2530` | `#6B9FD4` |
| accepted / Angenommen | `#1A2E24` | `#5DBF8C` |
| invoiced / Rechnung | `#2E2010` | `#E8A030` |
| paid / Bezahlt | `#1A2E24` | `#3D9B6B` |

### Light mode
Same structure, inverted:
- Background: `#F5F5F3`, Surface: `#FFFFFF`, Surface 2: `#F0EFED`
- Text: `#111111`, Muted: `#6B6B6B`, Dim: `#B0B0B0`
- Border: `#E5E4E0` — amber and semantic colors unchanged

---

## Typography

**Font: DM Sans** — more character than Inter, cleaner than system, excellent at all weights. Load via Google Fonts or embed as asset.

Fallback stack: `'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif`

### Scale
| Role | Size | Weight | Notes |
|---|---|---|---|
| Hero number (Gesamtbetrag) | 36px | 700 | tabular-nums, tracking -1.5px — first thing visible on detail screen |
| Screen title | 22px | 700 | Nav bar heading, tracking -0.5px |
| Card name / job title | 15px | 600 | Most important string in a list row |
| Body | 15px | 400 | Descriptions, notes — muted color |
| Subtext / meta | 12px | 400 | Address, phone, doc number, date |
| Section labels | 11px | 600 | UPPERCASE + 1px tracking + dim color |
| Badges | 12px | 500 | Pill-shaped status indicators |

All currency values and document numbers: `fontVariantNumeric: 'tabular-nums'`

---

## Spacing

- **Base unit:** 8px
- **Density:** Comfortable — 44px minimum touch targets (iOS HIG)
- **Screen padding:** 16–18px horizontal
- **Card padding:** 15–16px
- **Card gap:** 8–10px between cards

### Scale
| Token | Value |
|---|---|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |

---

## Border Radius

| Element | Radius |
|---|---|
| Buttons (primary) | 18px |
| Cards | 14px |
| Inputs | 14px |
| Secondary buttons | 14px |
| Status badges (pills) | 100px |
| FAB / avatar / circular | 9999px |
| Small chips | 8px |

---

## Layout

- **Approach:** Grid-disciplined — strict vertical rhythm, card-based, no horizontal scrolling.
- **Hero number placement:** On the job detail screen, the Gesamtbetrag appears at the top before the scroll area — like Trade Republic puts the portfolio value.
- **Active job indicator:** Jobs that need action (accepted, invoiced) get a 2px amber left border on their card.

---

## Motion

- **Approach:** Minimal-functional. This is a tool — never waste the user's time.
- **Duration:** 200ms max. Instant where possible.
- **Easing:** ease-out for enter, ease-in for exit
- **What gets animation:** System screen transitions (push/pop, modal), button press opacity (0.85)
- **What stays instant:** List items, badge updates, form field focus

---

## Component Conventions

### Primary CTA button
Full-width, amber `#E8A030` background, `#111` text, 16px semibold, 18px radius, 16px padding. This is the only amber-filled element — reserve it for the single most important action on screen.

### Secondary buttons
`#242424` background, white text, 14px radius. Used for PDF sharing, Bearbeiten, etc.

### Job cards
`#1C1C1C` background, 14px radius, no visible shadow (dark UI, elevation via background steps). Active jobs get `border-left: 2px solid #E8A030`.

### FAB (new job)
52–54px circle, amber background, `#111` `+` glyph, amber glow shadow `rgba(232,160,48,0.4)`.

### Status progression
draft → quote_sent → accepted → invoiced → paid

Primary CTA label changes per status:
- draft → "Angebot versenden"
- quote_sent → "Als angenommen markieren"
- accepted → "Rechnung stellen"
- invoiced → "Als bezahlt markieren"

---

## Anti-Patterns — Never Do These

- No gradients (background, button, or otherwise)
- No pure white or light backgrounds as default — this is a dark-first app
- No emoji icons — render as `?` boxes on simulator; use drawn View components
- No purple, no blue primary — amber is the only accent
- No centered layout for data screens — left-align everything
- No uniform border radius — use the scale

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-03-20 | Dark-first (`#111111`) | ChatGPT / Trade Republic reference — focused, premium, no visual noise |
| 2026-03-20 | Amber `#E8A030` accent | Single warm accent on a dark achromatic base — the craftsman twist. Like a work light. |
| 2026-03-20 | DM Sans | More character than Inter, cleaner than serif — works at every weight |
| 2026-03-20 | Hero number at top of detail screen | Gesamtbetrag is what tradespeople care about most — surfaces it immediately like TR does with portfolio value |
| 2026-03-20 | Pill-shaped status badges | Compact, readable, consistent with dark premium app conventions |
| 2026-03-20 | Initial design system created | Created by /design-consultation — dark/amber direction chosen over forest green and kraft paper alternatives |
