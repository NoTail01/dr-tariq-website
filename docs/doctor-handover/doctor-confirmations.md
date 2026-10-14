# Details the doctor / clinic must confirm

Date: 2026-10-14 · Private document, not published on the site.

Nothing in this list is blocking local development. Nothing here is guessed:
where the site has no confirmed value, the field stays empty and inactive.

## 1. Clinic building and floor — CONFLICT OPEN

Three different wordings are on record and they must never be combined:

| Source | Wording | Site status |
| --- | --- | --- |
| Supplied brand image | خلف المستشفى التخصصي، مجمع الرياض الطبي، الطابق الأول | **Published** (client-supplied) |
| Secondary directory | مجمع بركة بلازا، الطابق B1، مقابل المستشفى التخصصي | Not published |
| Google Maps listing | Street address shows "Jaber Bin Hayyan St 37" inside "نصر تي بلازا"; the listing's "working place" field shows مجمع الرياض الطبي | Not published |

**Required:** a written confirmation of the current building and floor. Until
then the published wording stays exactly as supplied.

The Google Maps "Open in Maps" link already resolves to the clinic listing
**عيادة الدكتور طارق أبو حويج**, whose phone field matches the published
landline, and the embed and the link refer to the same place.

## 2. Working hours — MISSING

No verified opening hours exist in any source. The site therefore publishes
**no hours at all** rather than an approximation.

**Required (both languages):** the confirmed weekly schedule, and whether it
changes on Fridays/Saturdays, so it can be entered in Settings → Contact.

## 3. English title for the German Board

The site publishes "البورد الألماني" as **"German Board"**, without naming a
specialty, because no source names it.

**Required:** the exact specialty of the German Board in English (e.g.
Internal Medicine / Nephrology) — or confirmation that "German Board"
without a specialty is correct.

## 4. Optional channels

| Item | Current | Question |
| --- | --- | --- |
| Public email | Not published | Does the clinic want a public email address? |
| Instagram | Not published | Should a clinic Instagram profile be linked? |
| Facebook | Linked to the existing page | Is `facebook.com/DrTariqAbuHweij/` still the right page? |
| WhatsApp | Enabled on 0799101101 (confirmed October 2026) | Should the prefilled message be reworded? |
| Landline | Published as 065685354 | Still correct? |

## 5. Identity details worth a second look

- Professional title in Arabic is the full form
  "استشاري أمراض الباطنة والكلى وزراعة الكلى وضغط الدم" — please confirm it is
  the wording the clinic wants.
- The specialty hospital is referenced in the address only; no formal
  association with the hospital is claimed anywhere.
- No hospital switchboard number is published — only the clinic's own mobile
  and landline.

## 6. Articles — medical review

All **10** articles are published while awaiting medical review, and each one
carries a visible notice saying so. The doctor is asked to mark each one
**موافق / Approved** or **بحاجة إلى تعديلات / Needs changes** in the printable
copy ([`articles-review-copy.html`](./articles-review-copy.html)) or the
interactive package ([`../doctor-review/index.html`](../doctor-review/index.html)).

Once returned, the site team records each decision in the dashboard. The
server stamps the decision automatically; the browser cannot back-date it.

## 7. Before any public launch

| Item | Why |
| --- | --- |
| Final domain | `NEXT_PUBLIC_SITE_URL` still defaults to `http://localhost:3000`, so canonical URLs, Open Graph tags and the sitemap point at localhost |
| Supabase backend | Articles, settings and uploads are stored on the server filesystem; on ephemeral hosting they would be lost. Activate per [`../SUPABASE.md`](../SUPABASE.md) |
| `ADMIN_TOKEN` | Required for the production dashboard; without it every admin API returns 403 |
| Deployment status | Whether the GitHub repository is connected to auto-deploy on Vercel is **unverified** from this repository and must be checked in the Vercel dashboard |

## How to return your answers

Reply with the item numbers and the confirmed wording (Arabic + English where
relevant). No code change is needed for anything in sections 1–5 — they are
all editable from the dashboard by clinic staff.
