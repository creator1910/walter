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

## ~~P4: Shared JobCard component~~ ✓ Done 2026-03-22

Built: `components/JobCard.tsx` — shared card with photo background (0.13 opacity, bleeding in from right with L→R gradient wipe at 65%), normalised to show amount in both dashboard and jobs list.

---

## P4: Shared Icon component

**What:** Extract a shared `<Icon>` component (or icon library) from inline drawn-View icons across the app (mic in new-job.tsx, PDF/Edit/Share/Mehr in job/[id].tsx).

**Why:** As drawn icons multiply, each file draws its own versions independently. A shared set ensures visual consistency and makes future icon updates a single change.

**Pros:** Single source of truth for icon shapes and sizing.
**Cons:** Small abstraction cost; icons are simple enough that drift risk is low.
**Context:** Added during the 2026-03-21 redesign (icon row feature). Inline drawing is fine for now — refactor when a 3rd screen needs its own set of icons.
**Depends on:** Icon row feature ships first.
**Priority:** P5

---

## P3: Offline / no-network handling for photo analysis

**What:** When the user taps "Analysieren" without a network connection, detect the offline state before calling the Claude API and show a meaningful message instead of a generic error.

**Why:** The target user is a tradesperson at a Baustelle — construction sites frequently have spotty signal. Today a network error looks the same as any other error. The ideal behavior is to detect offline state, save the photos + text locally, and offer to retry automatically when connectivity returns.

**Pros:** Dramatically improves reliability in the core use case (on-site job creation).
**Cons:** Requires `@react-native-community/netinfo` or equivalent; adds state for "pending analysis" jobs.
**Context:** Added during /plan-eng-review of Photo + Voice feature (2026-03-22). Currently the fetch throws on network failure and the generic retry button appears — acceptable for v1 but a real pain point for the target user. Consider pairing with a "save draft" feature.
**Effort:** M → with CC+gstack: S
**Priority:** P3
**Depends on:** Photo + Voice feature ships first.

---

## P4: Vision API cost tracking

**What:** Track how often the vision API ("Analysieren") is called and roughly what it costs. Optionally surface in Settings.

**Why:** Vision API calls with 3 photos cost significantly more than text-only job creation. For a solo tool the cost is absorbed, but awareness is useful as usage grows.

**Pros:** Surfaces unexpected cost spikes; allows future rate-limiting or user awareness.
**Cons:** Adds local tracking state; marginal value for a solo tool.
**Context:** Open Question #2 from Photo + Voice design doc (2026-03-22). Captured as P4 — low priority, worth revisiting if API costs become noticeable.
**Effort:** S → with CC+gstack: XS
**Priority:** P4
**Depends on:** Photo + Voice feature ships first.

---

## P2: GoBD Audit Trail

**What:** Replace the `is_locked` boolean with a proper audit trail — store a SHA-256 hash of each invoice's content at the time of issuance, in an append-only `invoice_audit_log` table. Optionally display a "Dieses Dokument wurde nicht verändert" verification status in the job detail screen.

**Why:** German GoBD compliance requires not just preventing edits, but proving a document has not been altered since finalization. The current `is_locked` flag prevents future edits but cannot prove the document wasn't altered before the lock was set. This becomes legally relevant when charging German businesses and when tax authorities request audit evidence.

**Pros:** Full GoBD compliance; builds trust with business customers; relatively simple (SHA-256 of the invoice HTML or JSON at lock time).
**Cons:** Adds a Postgres table and a cloud function call at invoice issuance; once set, the hash is permanent.
**Context:** Added during /plan-eng-review of cloud backend (2026-04-12). Current `is_locked` is adequate for beta. Required before App Store GA or charging customers.
**Effort:** M → with CC+gstack: S
**Priority:** P2
**Depends on:** Cloud backend (Supabase) shipping first.

---

## P4: Parallel photo upload

**What:** Switch photo uploads in `lib/photos.ts` from sequential to `Promise.all()` — upload all photos for a job simultaneously instead of one by one.

**Why:** With 5 photos, sequential upload blocks job save for the combined upload time (network-dependent). Parallel uploads reduce wall-clock time to the slowest single upload.

**Pros:** Better UX, especially on spotty mobile connections where one photo might be fast and another slow.
**Cons:** Higher peak bandwidth; more concurrent connections to Supabase Storage.
**Context:** Added during /plan-eng-review of cloud backend (2026-04-12). Sequential is acceptable for beta. Worth fixing when photo upload is a perceptible delay.
**Effort:** S → with CC+gstack: XS
**Priority:** P4
**Depends on:** Cloud backend (lib/photos.ts) shipping first.

---

## P4: Kunde wiederverwenden

**What:** When creating a new job, offer to pick an existing customer from previous jobs instead of re-typing name/address/phone.

**Why:** Most tradespeople have repeat customers. Re-typing is friction and introduces inconsistency.

**Effort:** S → with CC+gstack: XS
**Priority:** P3
**Depends on:** Nothing
