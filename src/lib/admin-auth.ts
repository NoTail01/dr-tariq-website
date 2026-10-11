import { createHash, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "dt_admin_session";

/**
 * Access rules for the dashboard:
 *
 * - local development (`next dev`): open, no password (mock dashboard);
 * - production builds: completely disabled unless `ADMIN_TOKEN` is set, and
 *   then only for a request carrying a matching signed session cookie.
 *
 * Supabase Auth replaces this layer when the backend is activated —
 * see docs/SUPABASE.md.
 */
export function isDashboardEnabled(): boolean {
  if (process.env.ADMIN_ENABLED === "false") return false;
  if (process.env.NODE_ENV !== "production") return true;
  return Boolean(process.env.ADMIN_TOKEN);
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function verifyToken(candidate: string, expected: string): boolean {
  if (!candidate || !expected) return false;
  return timingSafeEqual(digest(candidate), digest(expected));
}

/** Expected value of the session cookie for the current environment. */
function expectedSession(): string | null {
  if (process.env.NODE_ENV !== "production") return "local-development";
  const token = process.env.ADMIN_TOKEN;
  return token ? digest(token).toString("hex") : null;
}

export function sessionCookieValue(): string | null {
  return expectedSession();
}

export async function isAuthenticated(): Promise<boolean> {
  if (!isDashboardEnabled()) return false;
  // Local development stays open: the mock dashboard never needs a cookie.
  // Production still requires the signed session cookie (set by /api/admin/login).
  if (process.env.NODE_ENV !== "production") return true;
  const expected = expectedSession();
  if (!expected) return false;
  const store = await cookies();
  const candidate = store.get(ADMIN_SESSION_COOKIE)?.value ?? "";
  if (!candidate) return false;
  return verifyToken(candidate, expected);
}
