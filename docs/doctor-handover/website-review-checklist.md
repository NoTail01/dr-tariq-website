# Website review checklist — Dr Tariq Abu Hweij

Date: 2026-10-14 · Private document, not published on the site.

Everything below was verified locally in `next dev` and in a production build
(`next build && next start`). Nothing here is a promise about content the
clinic has not yet confirmed — those items are in
[`doctor-confirmations.md`](./doctor-confirmations.md).

## 1. Public site

| # | Check | Result |
| --- | --- | --- |
| 1 | Arabic site opens RTL at `/ar` | Pass |
| 2 | English site opens LTR at `/en` | Pass |
| 3 | `/` redirects to the visitor's preferred language | Pass |
| 4 | Home, About, Blog, Appointments pages render in both languages | Pass |
| 5 | Blog shows no articles: all 10 are held (draft / pending review) | Pass |
| 6 | Article URLs return 404 while review is pending (no public article pages) | Pass |
| 7 | Language switch keeps the current page | Pass |
| 8 | Every internal link in every article resolves to a real article | Pass (automated test) |
| 9 | Google Maps embed renders the clinic area | Pass |
| 10 | "Open in Google Maps" points to the clinic listing | Pass |
| 11 | Published clinic numbers produce working `tel:` links | Pass |
| 12 | WhatsApp links are disabled; published phone numbers still produce `tel:` links | Pass |
| 13 | No WhatsApp buttons are rendered until written confirmation exists | Pass |
| 14 | Appointment wording is "contact the clinic", never "book/confirmed" | Pass |
| 15 | 404 for an unknown article returns a real 404 (not a soft 404) | Pass |
| 16 | Demo/template articles are hidden entirely in production | Pass |
| 17 | No broken asset, script or stylesheet requests | Pass |
| 18 | Sitemap and robots.txt generate correctly | Pass |
| 19 | No console errors in the production server log | Pass |

## 2. Content truthfulness

| # | Check | Result |
| --- | --- | --- |
| 20 | All 10 articles are **held as drafts** | Pass |
| 21 | No medical approval is recorded for any article | Pass |
| 22 | An article with pending review is never publicly visible, even if published | Pass |
| 22b | Pending templates never carry a doctor-review badge | Pass |
| 23 | No pending-review badge appears publicly because the pages are hidden | Pass |
| 23b | Demo templates keep their "not medical content" + pending badges | Pass |
| 24 | No article is attributed to the doctor as author or reviewer | Pass |
| 25 | Articles are credited to the website editorial team | Pass |
| 26 | Each article cites its source (NIDDK / NHS) and links to it | Pass |
| 27 | No BlogPosting structured data is emitted while review is pending | Pass |
| 28 | No review timestamp exists until the doctor records a decision | Pass |
| 29 | A review timestamp can only be set by the server, never by the browser | Pass |
| 30 | No success rates, patient counts, ratings or guarantees are published | Pass |

## 3. Dashboard

| # | Check | Result |
| --- | --- | --- |
| 31 | Dashboard requires username + password authentication | Pass |
| 32 | Dashboard is fully disabled until both credential variables are set (403 everywhere) | Pass |
| 33 | Wrong username or password is rejected with a generic 401 | Pass |
| 34 | Session cookie is `HttpOnly; Secure; SameSite=lax` | Pass |
| 35 | Forged or expired session cookies are rejected | Pass |
| 36 | Drafts are never visible to visitors | Pass |
| 37 | Publishing alone never exposes an article; approval is required for public visibility | Pass |
| 38 | Approval is a separate action that records its own timestamp | Pass |
| 39 | Dashboard interface is fully bilingual (AR/EN) | Pass |
| 40 | Unsaved changes are guarded by a banner + `beforeunload` | Pass |
| 41 | Saving reports success only after the server confirms the write | Pass |
| 42 | Settings validation rejects non-embed map URLs and non-hex colors | Pass |
| 43 | WhatsApp stays off until written confirmation; the admin toggle is read-only | Pass |

## 4. Backend and deploy safety

| # | Check | Result |
| --- | --- | --- |
| 44 | Site works with no Supabase credentials at all | Pass |
| 45 | With credentials, articles/settings/uploads move to Supabase automatically | Implemented, needs a real project to run against |
| 46 | In production with no backend, writes are refused with 503 rather than silently lost | Pass (automated test) |
| 47 | Service-role key is never sent to a client bundle | Pass |
| 48 | No secrets in git; `.env.example` documents every variable with no values | Pass |
| 49 | Migration script never overwrites remote data without `--force` | Pass |
| 50 | Migration is idempotent and backs the local store up first | Pass |

## 5. Automated checks

| # | Check | Result |
| --- | --- | --- |
| 51 | `npm run test` - 127 passing (14 suites) | Pass |
| 52 | `npx tsc --noEmit` | Pass |
| 53 | `npm run lint` | Pass |
| 54 | `npm run build` | Pass |

## Not verified

- **Vercel account/project settings** — no `vercel` CLI is installed and no
  `.vercel/` project link exists in this repository, so Git-connected
  auto-deploy could not be confirmed either way. Treat deployment status as
  **unverified** and check it in the Vercel dashboard.
- **Supabase behaviour against a live project** — the code path is complete
  and unit-tested, but no credentials were supplied, so no live round trip
  has been performed.
