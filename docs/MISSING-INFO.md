# Launch checklist — remaining confirmations

The doctor's identity, supplied photographs, branding, contact details and
Google Maps embed are now implemented from verified sources. The items below
still require confirmation before public launch. None of them blocks local
development or the GitHub push.

## 1. Address conflict — decision required

Two different locations are on record:

| Source | Wording | Status |
| --- | --- | --- |
| Supplied brand image | خلف المستشفى التخصصي، مجمع الرياض الطبي، الطابق الأول | **Published on the site** (client-supplied wording) |
| Secondary directory (bizmideast.com) | مجمع بركة بلازا، الطابق B1، مقابل المستشفى التخصصي | Recorded here only — **not published** |

- **Action:** confirm the current clinic building and floor with the clinic.
- The two addresses must never be combined; the published wording stays as
  supplied until the clinic confirms a change in writing.

## 2. WhatsApp availability

- The mobile number 0799101101 / +962799101101 is **not confirmed** to be
  WhatsApp-enabled.
- The prepared link `https://wa.me/962799101101` is stored in settings and the
  channel is visibly disabled ("WhatsApp not confirmed yet").
- **Action:** flip `contact.whatsappEnabled` to `true` in the admin dashboard
  (Settings) after the clinic confirms.

## 3. Opening hours

- No verified opening hours exist in any source. The directory's hours are
  unconfirmed and are not published.
- **Action:** collect confirmed hours (AR + EN) and set them in Settings.

## 4. Original logo file

- The current emblem is a faithful crop of the supplied brand reference image
  (`public/images/logo-emblem.png` + transparent variant). The original
  reference file is preserved unmodified.
- **Action:** if the clinic supplies the original transparent logo
  (SVG/PNG), replace `branding.logoUrl` / `branding.logoUrlDark` in Settings —
  no code change needed. The crop looks sharp at navbar sizes, so the crop is
  provisionally acceptable.

## 5. Final domain

- The site builds locally; `NEXT_PUBLIC_SITE_URL` still defaults to
  `http://localhost:3000`.
- **Action:** set `NEXT_PUBLIC_SITE_URL` to the final domain (used for
  canonical URLs, sitemap, Open Graph) before launch.

## 6. Supabase + production admin configuration

- Booking submissions and image uploads remain local-only; the request form
  states clearly that nothing is sent.
- **Action:** activate the backend per `docs/SUPABASE.md`
  (`appointment_requests` table, Storage, admin auth), then set
  `ADMIN_TOKEN` for the production dashboard.

## 7. Optional content confirmations

- English translation of the hospital page title "استشاري أمراض الكلى"
  (the site publishes the fuller title from the supplied branding).
- A public email address, if the clinic wants an email channel.
- Specialty Hospital association (the hospital page implies but does not
  state the clinic's relationship to it) — not published.
