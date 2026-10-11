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

## Hosting

The repository is hosted on GitHub at
`github.com/NoTail01/dr-tariq-website`. **No deployment pipeline is configured
or connected** — builds are run locally with `npm run build` and reviewed
before publishing.
