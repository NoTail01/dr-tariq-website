# Supabase backend activation guide

The site runs fully without a backend: booking requests show a clear
"nothing was transmitted" notice and admin uploads stay on the local disk.
This guide describes the single path to activate Supabase (Postgres,
Storage, Auth).

## 1. Variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | server only | Project URL (`https://<ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Service-role key — **never prefix with `NEXT_PUBLIC_`, never commit** |

`SUPABASE_URL` may fall back to `NEXT_PUBLIC_SUPABASE_URL`, and
`SUPABASE_SERVICE_ROLE_KEY` stays server-side in all cases.

## 2. `appointment_requests` table

`src/lib/booking-backend.ts` POSTs to `/rest/v1/appointment_requests` with
these columns:

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

Once the variables are set, the booking API returns `sent: true` and the UI
labels the submission as transmitted.

## 3. Image storage

`POST /api/admin/upload` currently writes to `public/uploads/`. To switch to
Supabase Storage, insert into the `storage.objects` table of the `uploads`
bucket (create it in the dashboard, make it public for read-only delivery)
before the local `fs.writeFile` branch, and return the public object URL
instead of `/uploads/<name>`. SVG stays rejected in both modes.

## 4. Admin authentication

`src/lib/admin-auth.ts` currently uses a signed session cookie compared
against `ADMIN_TOKEN`. Supabase Auth replaces it like this:

1. Replace the cookie check in `verifyToken`/`expectedSession` with a
   `supabase.auth.getUser()` call using the `Authorization: Bearer` header.
2. Keep `isDashboardEnabled()` returning `false` when no provider is
   configured so the dashboard is never open in production.
3. Store the Supabase JWT (server-side) instead of `ADMIN_TOKEN`.

Until that migration is done, production access requires `ADMIN_TOKEN`
(`src/app/admin/login` exchanges it for the session cookie).

## Privacy

Patient details are never logged: `booking-backend.ts` logs only the HTTP
status on failure. Keep the service-role key out of the client bundle and
out of git at all times.
