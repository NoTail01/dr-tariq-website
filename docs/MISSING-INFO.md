# Launch checklist — remaining confirmations

The doctor's identity, supplied photographs, branding, contact details and
Google Maps embed are implemented from verified sources. The items below
still require confirmation before public launch. None of them blocks local
development or the GitHub push.

## 1. Address conflict — decision required

Three different location wordings are on record:

| Source | Wording | Status |
| --- | --- | --- |
| Supplied brand image | خلف المستشفى التخصصي، مجمع الرياض الطبي، الطابق الأول | **Published on the site** (client-supplied wording) |
| Secondary directory (bizmideast.com) | مجمع بركة بلازا، الطابق B1، مقابل المستشفى التخصصي | Recorded here only — **not published** |
| Google Maps place listing (opened in browser, 2026-10-12) | Street address shown as "Jaber Bin Hayyan St 37" inside "نصر تي بلازا" (Nasr Plaza); the listing's "working place" field shows **مجمع الرياض الطبي** | Recorded — see §8 map verification |

- **Action:** confirm the current clinic building and floor with the clinic.
- The wordings must never be combined; the published wording stays exactly as
  supplied until the clinic confirms a change in writing.

## 2. WhatsApp availability

- The mobile number 0799101101 / +962799101101 is **not confirmed** to be
  WhatsApp-enabled.
- The prepared link `https://wa.me/962799101101` is stored in settings and the
  channel is visibly disabled ("WhatsApp not confirmed yet").
- **Action:** flip `contact.whatsappEnabled` to `true` in the admin dashboard
  (Settings) after the clinic confirms.

## 3. Opening hours

- No verified opening hours exist in any source. The Google Maps listing shows
  only a partial schedule (Sunday 10:00 open); the directory's hours are
  unconfirmed. Neither is published.
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
  `http://localhost:3000` (canonical URLs, sitemap and Open Graph tags use it).
- **Action:** set `NEXT_PUBLIC_SITE_URL` to the final domain before launch.

## 6. Supabase + production admin configuration

- Booking submissions and image uploads remain local-only; the request form
  states clearly that nothing is sent.
- Articles, settings and uploads persist to the **local filesystem** only —
  on Vercel the filesystem is ephemeral, so content writes would be lost.
- **Action:** activate the backend per `docs/SUPABASE.md`
  (`appointment_requests` table, Storage, admin auth), then set
  `ADMIN_TOKEN` for the production dashboard.

## 7. Production authentication — tested

Verified on a production build (`next build && next start`):

- Without `ADMIN_TOKEN`: every `/api/admin/*` read and write returns 403.
- With `ADMIN_TOKEN`: login requires the exact token (wrong token → 401),
  the session cookie is `HttpOnly; Secure; SameSite=lax`, and a forged
  `local-development` cookie is rejected with 401 on every protected
  endpoint (no development bypass in production).
- No token or service-role key appears in any client bundle.

## 8. Map verification (browser, 2026-10-12)

- The supplied embed loads inside the site and shows the clinic's area
  (Jaber Ben Hayyan St, Shmeisani, Amman).
- The "Open in Google Maps" link resolves to the place listing
  **عيادة الدكتور طارق أبو حويج** — the exact clinic name — and its phone
  field shows **(06) 568 5354**, matching the published clinic landline.
- Both links refer to the same place feature
  (`0x151ca194f8b5c4f5:0x590913a16577b185`, the embed's `!1s` id).
- The listing's street address building (Nasr Plaza) differs from the
  supplied wording (Al-Riyad Medical Complex), while its "working place"
  field shows مجمع الرياض الطبي — kept as an unresolved conflict (§1).
- The embed's center coordinates were NOT used as structured data, no
  opening hours were published, and the listing's 4.0 rating is not shown.

## 9. Optional content confirmations

- English translation of the hospital page title "استشاري أمراض الكلى"
  (the site publishes the fuller title from the supplied branding).
- A public email address, if the clinic wants an email channel.
- Specialty Hospital association (the hospital page implies but does not
  state the clinic's relationship to it) — not published.
