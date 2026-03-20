# TODOS

Items deferred from plan reviews. Pick these up after the current sprint ships.

---

## P1: Company Profile / Firmenprofil

**What:** Settings screen where the tradesperson enters their company details: name, address, IBAN, Steuernummer (tax ID), and optionally a logo. Data is saved to AsyncStorage and auto-fills PDF headers/footers.

**Why:** Required for legally valid German Angebote and Rechnungen under §14 UStG. Without it, Walter's PDFs are anonymous documents, not usable for tax purposes.

**Pros:** Turns Walter into a legally compliant invoicing tool. One-time setup, benefits every future job.

**Cons:** Adds a settings screen and storage key. PDF template needs to be aware of whether profile is filled in.

**Context:** This was the most impactful item deferred from the 2026-03-20 CEO plan review. The PDF generation feature (in-sprint) generates documents but leaves header/footer blank until this is built. The PDF template should be designed with placeholder company fields from day 1 so this slots in cleanly.

**Effort:** M → with CC+gstack: S (~30 min)
**Priority:** P1
**Depends on:** PDF generation must ship first (provides the template to fill)

---

## P2: Photo Attachments

**What:** Add/view photos on a job detail screen. Use expo-image-picker to take or select photos (before/after work, materials, site conditions). Store as file URIs in AsyncStorage alongside the job.

**Why:** Tradespeople use photos for proof of work, customer dispute resolution, and quality documentation. It's a daily workflow, not a nice-to-have.

**Pros:** High practical value; expo-image-picker is standard Expo. Photos could later be embedded in PDFs or shared alongside them.

**Cons:** Storage grows with photos; base64 in AsyncStorage is inefficient — should use expo-file-system for actual file storage, only URIs in AsyncStorage.

**Context:** Deferred from 2026-03-20 CEO review. When building this, use expo-file-system (not base64 in AsyncStorage) to store photo files. Store only the file URI in the Job object.

**Effort:** M → with CC+gstack: S (~20 min)
**Priority:** P2
**Depends on:** Nothing — can be built any time after edit flow lands
