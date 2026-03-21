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

## Screen Patterns

### Dashboard (Übersicht)
Three stat tiles in a horizontal row, then active jobs, then "Zuletzt erstellt", then "Alle Aufträge →" link.

**Stat tiles:**
- Equal-width flex row, 8px gap
- Surface background, 14px radius, 1px border, 14px padding
- Value: 15px/700, tabular-nums, semantic color when applicable (paid → `#3D9B6B`, outstanding → `#E8A030`, neutral → text default)
- Label: 11px/400, textDim color — minimum font size for any label

**Section headers:**
- 11px/600, UPPERCASE, 1px letter-spacing, textDim — consistent with existing section label spec

**Active jobs section:**
- Jobs with status in {accepted, invoiced, quote_sent} — same card pattern with 2px amber left border

**Empty state:**
- Full-screen centered: greeting name, "Noch keine Aufträge" (17px/600), hint text (15px/400, textMid), centered

**Loading state:**
- Greeting text hidden (empty string), stat tile values show "—" — no skeleton, just placeholder dashes

---

### Job Detail

**Hero section:**
- Gesamtbetrag: 36px/700, tabular-nums, tracking -1.5px — first element on screen, full-width card
- Customer name below in 17px/600, description in 15px/400 muted
- VAT rate chip + doc numbers in 12px subtext

**Status timeline (5-dot tracker):**
- 5 stages: Entwurf · Angebot · Angenom. · Rechnung · Bezahlt
- Each stage: dot (8×8px circle) + label below (10px/400, textDim) + date above (11px/500, textMid) when reached
- Active/completed dot: amber `#E8A030`. Upcoming dot: border2 `#333333`
- Connecting lines between dots: 1px height, completed = amber, upcoming = border2
- Layout: horizontal, evenly spaced (justifyContent: 'space-around'), centered

**Line items:**
- Each item: description (15px/600) + quantity × unit price + subtotal (15px/400 muted)
- Net / VAT / Gross summary below, right-aligned, tabular-nums
- Gross total at 17px/600

**Photo attachments:**
- Horizontal scroll row of 60×60 thumbnails, 6px radius, 8px gap
- "+" add button at end of row: same 60×60 size, surface2 background, amber + icon
- Tap thumbnail → full-screen lightbox (black modal `rgba(0,0,0,0.92)`, tap to dismiss)

**Bottom action bar:**
- Surface background, 1px top border, 16px padding + `insets.bottom` safe area padding
- Primary CTA: full-width amber button (label changes per status — see Component Conventions)
- Secondary row: Bearbeiten + PDF share buttons side by side (secondary button style)

---

### Job List (Alle Aufträge)
- FlatList with 10px gap
- Same card pattern as dashboard, with date shown (12px/400 textDim below description)
- FAB bottom-right (54px, amber) for new job

---

### New Job (Voice/Text Input)
- Modal screen, full height
- Text area for voice/typed input: Surface2 background, 14px radius, 15px/400, min height 120px
- Mic button right-aligned: 44px circle, Surface2 background, amber mic icon
- Recording state: mic button pulses with amber ring (animation)
- After submit: loading spinner while Claude parses — no content yet
- On completion: auto-navigates to newly created job detail

---

### Firmenprofil
- Grouped sections (Firma, Kontakt, Steuer & Bank) as Surface cards, 14px radius
- Section title: 11px/600 UPPERCASE + 1px tracking, textDim
- Input fields: 15px/400, Surface2 background, 14px radius, 1px border2, 12px horizontal padding
- Save button: primary CTA (amber, 18px radius, full-width)

---

## Interaction States

### Loading
- Use "—" dashes for numeric values not yet fetched (stat tiles)
- Use `null` / return-early pattern for screens that need a record to render
- No skeleton screens — data loads fast enough on-device; instant render preferred
- Activity indicator (system spinner) for async operations (PDF generation, AI parsing, photo upload): shown in place of the button label or inline

### Empty States
- Every list screen has an empty state: centered in the full remaining space
- Pattern: title (17px/600) + hint (15px/400 muted, center-aligned) + primary action button where applicable
- Tone: warm and directive ("Tippe auf + um deinen ersten Auftrag anzulegen" — not "No items found.")
- Dashboard empty state includes the greeting name above the message

### Error States
- Validation errors: `Alert.alert()` with German title + specific message (Pflichtfeld, IBAN-Format, etc.)
- Save/network failures: Alert with retry option
- No inline red text below fields (clean form aesthetic)

### Disabled States
- Button: `backgroundColor: C.border2`, shadow removed, full opacity preserved
- No `cursor: not-allowed` (native handles this implicitly)

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
| 2026-03-21 | Safe area insets on all bottom bars | `useSafeAreaInsets` + `insets.bottom + 16` on job detail bottomBar and edit job saveBtn — prevents home indicator overlap on modern iPhones |
| 2026-03-21 | Font minimum: 11px labels, 12px meta | iOS readability floor — tile labels, tab labels, section headers all ≥ 11px; dates and subtext ≥ 12px |
| 2026-03-21 | Border radius scale enforced | Inputs and secondary buttons standardised to 14px (from 8px); addBtn in JobForm 10→14px — uniform application of the design scale |
| 2026-03-21 | Screen patterns documented | Added Dashboard, Job Detail, Job List, New Job, Firmenprofil screen patterns; Interaction States section |
