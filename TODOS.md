# TODOS

Items deferred from plan reviews. Pick these up after the current sprint ships.

---

## ~~P1: Company Profile / Firmenprofil~~ ✓ Done 2026-03-20

Built: Firmenprofil screen (gear/hamburger button on job list), fields for name, address, phone, email, Steuernummer, IBAN, BIC. Auto-fills PDF headers and footers.

---

## ~~P2: Photo Attachments~~ ✓ Done 2026-03-20

Built: Photo grid on job detail screen. expo-image-picker (library + camera), expo-file-system/legacy for storage. Tap to lightbox, long-press to delete.

---

## P3: Dashboard / Übersicht

**What:** A summary screen showing revenue by status (open quotes, outstanding invoices, paid this month), and a count of jobs per status.

**Why:** As job count grows, tradespeople need a quick financial overview without opening individual jobs.

**Effort:** M → with CC+gstack: S
**Priority:** P3
**Depends on:** Nothing

---

## P4: Shared JobCard component

**What:** Extract a shared `<JobCard>` component from the inline card rendering in `app/jobs.tsx` and `app/(tabs)/index.tsx`.

**Why:** Both the dashboard (active jobs section) and the full jobs list render job cards with the same structure: customer name, status badge, amber left border for active jobs. Currently inline in both files — can drift if one changes styling.

**Pros:** Single source of truth for job card styling; change once, applies everywhere.
**Cons:** Minor abstraction overhead; cards are currently simple enough that drift is low risk.
**Context:** After the tab nav + dashboard ships, there will be two separate card renderers. This TODO is a follow-up cleanup once the app stabilizes.
**Depends on:** Tab nav + dashboard (P3) ships first.
**Priority:** P4

---

## P4: Kunde wiederverwenden

**What:** When creating a new job, offer to pick an existing customer from previous jobs instead of re-typing name/address/phone.

**Why:** Most tradespeople have repeat customers. Re-typing is friction and introduces inconsistency.

**Effort:** S → with CC+gstack: XS
**Priority:** P3
**Depends on:** Nothing
