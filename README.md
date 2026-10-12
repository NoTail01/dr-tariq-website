# Dr Tariq Abu Hweij — website

Bilingual (Arabic / English) website for Dr Tariq Abu Hweij, built with Next.js.

- **Public site** — `/en` (LTR) and `/ar` (RTL): home, about, blog, booking.
  Root `/` redirects to the preferred language.
- **Admin dashboard** — `/admin`: article editor, settings, media uploads.
  Open in `next dev`; disabled in production unless `ADMIN_TOKEN` is set.
- **Backend-optional** — booking submissions and uploads run locally until
  Supabase credentials are configured (`docs/SUPABASE.md`).

## Getting started

```bash
cp .env.example .env.local   # optional — everything works without it
npm run dev
```

- Site: http://localhost:3000
- Dashboard (development only): http://localhost:3000/admin

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest suite |

## Identity & content policy

All doctor facts are verified against sources listed in
`src/content/SOURCES.md` (Specialty Hospital doctor profile + the supplied
brand reference image). Nothing is invented: the German Board is published
without naming its specialty, the WhatsApp channel stays disabled until
confirmed, and no reviews or success rates are ever published.

## Supplied assets

| File | Use |
| --- | --- |
| `public/images/dr-tariq-portrait.png` | Authentic portrait (home + about), served unmodified |
| `public/images/dr-tariq-brand-reference.png` | Original brand reference — preserved, never used directly as a logo |
| `public/images/logo-emblem.png` | Faithful crop of the kidney emblem (navbar badge) |
| `public/images/logo-emblem-transparent.png` | Same emblem, transparent background (footer) |
| `public/images/dr-tariq-portrait-800.webp` | Optional optimized derivative |

The brand palette (`#0097F3` and accessible shades) was sampled from the
brand reference and lives in `src/app/globals.css` as `brand-*` tokens.

## Documentation

- `src/content/SOURCES.md` — source ledger; no medical fact ships without one.
- `docs/MISSING-INFO.md` — launch checklist (address conflict, WhatsApp, hours, logo, domain, backend).
- `docs/GOOGLE.md` — optional GA4 / GTM / Search Console / Maps setup.
- `docs/SUPABASE.md` — activating the booking/storage/auth backend.

## Dashboard (`/admin`, development or with `ADMIN_TOKEN`)

The dashboard is used by clinic staff, so its chrome carries an **AR/EN
language switch** (persisted per browser, shared across all pages) —
labels for the shell, settings, article editor, articles list and login
are translated in `src/components/admin/dashboard-dict.ts`.

Editable from the dashboard (single system, no duplicate admin):

| Area | Where |
| --- | --- |
| Biography + qualifications (per language) | Settings → "Doctor biography & qualifications" |
| Contact numbers (mobile/landline, national + international) | Settings → Contact |
| WhatsApp activation flag (off until confirmed) | Settings → Contact |
| Address, working hours (empty stays inactive) | Settings → Contact |
| Google Maps embed + open-in-Maps link | Settings → Google Maps |
| Brand color, emblem assets | Settings → Branding |
| Social links | Settings → Social links |
| Articles: drafts, publishing, SEO fields, cover image + alt | Articles / editor |

Unsaved edits are protected by a visible banner plus a `beforeunload`
guard in both the settings page and the article editor. Saving reports
success only after the server confirms the write, and changes appear on
the public site immediately (no server restart).

Validation rules enforced server-side: only `google.com/maps/embed` URLs
are accepted for the map, WhatsApp never activates implicitly, brand
colors must be hex, and publishing an article requires title, slug,
excerpt and body in **both** languages (so a missing translation can
never produce a broken link).

Persistence: articles and settings are JSON files under `content/`, and
uploaded images go to `public/uploads/`. On Vercel the filesystem is
ephemeral — see `docs/SUPABASE.md` before enabling deployment.

## Hosting

The repository is hosted on GitHub at
`github.com/NoTail01/dr-tariq-website`. **No deployment pipeline is configured
or connected** — builds are run locally with `npm run build` and reviewed
before publishing.
