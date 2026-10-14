# Supabase backend activation guide

The site runs fully without a backend: booking requests show a clear
"nothing was transmitted" notice, admin writes go to the local filesystem,
and uploads are stored under `public/uploads/`. This guide describes how to
move **articles, settings and uploads** onto Supabase.

Nothing here requires a code change. Everything is driven by two
environment variables.

## 1. Variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | server only | Project URL (`https://<project-ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Service-role key — **never prefix with `NEXT_PUBLIC_`**, never commit |
| `NEXT_PUBLIC_SUPABASE_URL` | optional, public | Alternative way to supply the project URL |

`SUPABASE_URL` may fall back to `NEXT_PUBLIC_SUPABASE_URL`.
`SUPABASE_SERVICE_ROLE_KEY` is only ever read on the server, inside
`src/lib/supabase.ts`, so it never reaches a client bundle.

**Both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be set** for the
backend to be considered configured; one without the other is ignored.

## 2. Schema

Run [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql)
in the Supabase SQL editor (or `supabase db push`). It creates:

| Object | Contents |
| --- | --- |
| `public.articles` | one row per article: `id`, `slug`, `status`, `is_demo`, `updated_at`, `data` (full article JSON) |
| `public.site_settings` | a single row (`id = 'site'`) holding the whole settings object in `data` |
| Storage bucket `uploads` | public read, server-only write |

Row Level Security is enabled with **no policies** on both tables, so only
the service-role key used by the server can read or write them. The
anon/public key can do nothing.

The migration is idempotent — safe to run repeatedly.

## 3. Behaviour once configured

| Area | Local (no backend) | Supabase configured |
| --- | --- | --- |
| Articles read | `content/articles.json` | `public.articles` (falls back to the local file on a network error) |
| Articles write | local JSON, **development only** | upsert on `id` (idempotent) |
| Article delete | local JSON, **development only** | row deleted from `public.articles` |
| Settings read | `content/settings.json` | `public.site_settings` |
| Settings write | local JSON, **development only** | single-row upsert |
| Uploads | `public/uploads/`, **development only** | Supabase Storage `uploads` bucket, public URL returned |
| `NODE_ENV=production` with no backend | writes **refused** with HTTP 503 | — |

That last row is deliberate: in production the filesystem is ephemeral, so a
save that appears to work would silently disappear on the next deploy.
Instead the API answers `503` with an explanatory message and the dashboard
shows it.

Drafts and every other content are protected the same way in both modes —
the public pages only ever call the read path.

## 4. Migrating existing content

```bash
export SUPABASE_URL=https://<project-ref>.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

node scripts/migrate-to-supabase.mjs --dry-run   # inspect, changes nothing
node scripts/migrate-to-supabase.mjs             # import
```

`scripts/migrate-to-supabase.mjs` is repeatable:

- writes a timestamped backup to `.local-backups/` before touching anything;
- upserts on the article `id`, so running it twice changes nothing;
- **never overwrites an existing remote row** unless you pass `--force`,
  and even then only when the local copy is the newer one;
- never deletes anything remotely;
- refuses to start without credentials, and prints the exact
  `export …` lines to use so no secret is ever typed into a chat.

## 5. Booking requests

`src/lib/booking-backend.ts` POSTs to `/rest/v1/appointment_requests` with
these columns (unchanged from the initial release):

```sql
create table appointment_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  contact_method text not null,      -- 'phone' | 'whatsapp' | 'email'
  contact_value text not null,
  preferred_time text,               -- nullable, free text
  message text                        -- nullable, free text
);

alter table appointment_requests enable row level security;
-- No policies: only the service-role key (server) may read or insert.
```

With the variables set, the booking API returns `sent: true` and the form
labels the submission as transmitted.

## 6. Admin authentication

`src/lib/admin-auth.ts` uses a signed session cookie compared against
`ADMIN_TOKEN`:

- `isDashboardEnabled()` returns `false` in production unless `ADMIN_TOKEN`
  is set — there is no open development dashboard in a production build;
- `guardAdmin()` rejects every `/api/admin/*` call with 403 in that case;
- with a token, login requires the exact token, and the cookie is
  `HttpOnly; Secure; SameSite=lax`;
- the service-role key is never sent to the browser.

Supabase Auth replaces this layer like this:

1. Replace the cookie check in `expectedSession()` with a `supabase.auth.getUser()`
   call using the `Authorization: Bearer` header.
2. Keep `isDashboardEnabled()` returning `false` when no provider is
   configured, so the dashboard is never open in production.
3. Store the Supabase JWT server-side instead of `ADMIN_TOKEN`.

Until that migration is done, production access requires `ADMIN_TOKEN`
(`src/app/admin/login` exchanges it for the session cookie).

## Privacy

Patient details are never logged: `booking-backend.ts` logs only the HTTP
status on failure. Keep the service-role key out of the client bundle and
out of git at all times. `.env.example` documents every variable and holds
no values.
