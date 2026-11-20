# Admin dashboard authentication

The dashboard at `/admin` uses Supabase Auth email-and-password accounts. There
is no username, password hash, local credential file, default account, or
development bypass. Every page, server action, and `/api/admin/*` endpoint stays
locked until Supabase Auth is configured and the signed-in User ID is on an
explicit server-side allowlist.

Accounts are created and managed only in **Supabase Dashboard → Authentication
→ Users**. The application never creates users, accepts sign-ups, or reads a
password.

## 1. Create the administrator in Supabase

1. Open the Supabase project → **Authentication → Users → Add user**.
2. Choose email and password, set a strong unique password, and confirm the
   account if Supabase requires email confirmation.
3. Copy the new user's **User UID** from the Users table.
4. Repeat only for staff who need dashboard access.

In **Authentication → Providers → Email** (and **Authentication → Settings**),
keep **Allow new users to sign up / Enable signups** disabled. Staff accounts
must only be created by a Supabase project administrator. Email confirmation
may stay enabled for account verification; it does not grant dashboard access.

## 2. Allowlist the User UID

Set `ADMIN_ALLOWED_USER_IDS` to a comma-separated list of the exact User UIDs:

    ADMIN_ALLOWED_USER_IDS=11111111-1111-4111-8111-111111111111,22222222-2222-4222-8222-222222222222

Every entry must be a valid UUID. A single malformed entry disables the whole
allowlist instead of widening access. A Supabase user who signs in correctly but
is not listed is immediately signed out and receives `403 not_authorized`.

Removing a UID from this variable revokes that user's dashboard access on the
next request, without any change to Supabase data. Suspending or deleting the
user in Supabase also ends access.

## 3. Variables

| Variable | Where | Required | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public (or server-only `SUPABASE_URL`) | Yes | Project URL from Supabase → Project Settings → API. Trailing slashes are accepted. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Yes* | Publishable key from Supabase → Project Settings → API. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted for older projects. |
| `ADMIN_ALLOWED_USER_IDS` | **server only** | Yes | Comma-separated Supabase Auth User UUIDs. Never prefix with `NEXT_PUBLIC_`. |
| `SUPABASE_URL` | server only | Backend | Existing content/booking backend URL; also acts as the auth URL fallback. |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Backend | Never prefix with `NEXT_PUBLIC_`; never commit or expose to browser code. |

\* One publishable/anon key variable is required. The public key is safe to ship
to a browser; it is not an authorization credential. The allowlist and
service-role key must remain server-only.

On Vercel: **Project → Settings → Environment Variables**:

1. Add `NEXT_PUBLIC_SUPABASE_URL` (Production and Preview as needed).
2. Add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, or the legacy
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the same project.
3. Add `ADMIN_ALLOWED_USER_IDS` with the User UID(s).
4. Keep the existing server-only `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` for articles, settings, uploads, and booking.
5. Remove the obsolete `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_TOKEN`,
   and `ADMIN_ENABLED` variables.
6. Redeploy so the new variables are baked into the deployment.

Do not put real values in `.env.local` in the repository. For local development,
copy `.env.example` to the gitignored `.env.local` and enter test-project values
there only.

## 4. Session and request behaviour

- Login posts `email` and `password` to `/api/admin/login`, which calls
  Supabase `signInWithPassword`. Invalid credentials always return the same
  generic `401` message.
- After sign-in, the freshly issued JWT is verified locally with
  `getClaims()`; neither the cookie nor `data.user` is treated as proof of
  identity. The claims' `sub` must match the allowlist.
- Supabase SSR stores the session in `HttpOnly`, `SameSite=Lax` cookies, with
  `Secure` in production. The proxy refreshes them on dashboard pages.
- Every protected page/layout, server action, and API re-verifies signed claims
  and the allowlist before doing work. A stale or forged cookie is rejected.
- Logout calls Supabase `signOut({ scope: "local" })` and clears the cookies.
  Signing out in Supabase or removing the UID from the allowlist ends access.
- Login is limited to 5 attempts per 15 minutes per client IP, per instance.
  Configure an additional edge/WAF rate limit on the deployed domain.
- All state-changing admin requests must carry a same-origin `Origin` header.
- A broken or partial configuration fails closed: login, pages, and APIs are
  unavailable rather than falling back to an open dashboard.
- The service-role key is imported only in server-side content/backend code and
  is never used by `createServerClient()` or sent to the browser.

## 5. Verification checklist

- Visit `/admin/login` with no configuration: the dashboard is disabled and
  admin APIs return `403`.
- Try an unknown email/wrong password: generic `401`, no session cookie.
- Try a valid Supabase user not in `ADMIN_ALLOWED_USER_IDS`: `403
  not_authorized`, no usable session.
- Sign in as an allowlisted user: `/admin` and all dashboard URLs work.
- Sign out: revisiting `/admin` redirects to `/admin/login`; admin APIs return
  `401` without a session.
- Send a cross-site POST: `403 csrf`.
