/**
 * Server-safe configuration for Supabase Auth and the admin allowlist.
 *
 * No service-role key is read here. The publishable key is public by design;
 * the allowlist itself is server-only and fails closed when absent or invalid.
 */

import type { CookieOptions } from "@supabase/ssr";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SupabaseAuthConfig = {
  url: string;
  key: string;
};

export type AdminIdentity = {
  id: string;
  email: string | null;
};

/** Public project URL + publishable/anon key needed to use Supabase Auth. */
export function supabaseAuthConfig(): SupabaseAuthConfig | null {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    ""
  )
    .trim()
    .replace(/\/+$/, "");
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  ).trim();

  if (!url || !/^https?:\/\//i.test(url) || !key) return null;
  return { url, key };
}

/**
 * Explicit administrator IDs. A single malformed entry disables the whole
 * allowlist: a typo must never widen access.
 */
export function allowedAdminUserIds(): string[] {
  const raw = process.env.ADMIN_ALLOWED_USER_IDS ?? "";
  const ids = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (ids.some((id) => !UUID.test(id))) return [];
  return Array.from(new Set(ids));
}

export function isAllowedAdminUserId(id: string | undefined | null): boolean {
  if (!id) return false;
  const normalized = id.trim().toLowerCase();
  return UUID.test(normalized) && allowedAdminUserIds().includes(normalized);
}

/** Build a narrow admin identity from verified Supabase JWT claims. */
export function adminIdentityFromClaims(
  claims: { sub?: unknown; email?: unknown } | null | undefined,
): AdminIdentity | null {
  if (
    !supabaseAuthConfig() ||
    !claims ||
    typeof claims.sub !== "string" ||
    !isAllowedAdminUserId(claims.sub)
  ) {
    return null;
  }
  return {
    id: claims.sub.trim().toLowerCase(),
    email: typeof claims.email === "string" ? claims.email : null,
  };
}

/** True only when login can work and at least one admin is explicitly allowed. */
export function isAdminAuthConfigured(): boolean {
  return supabaseAuthConfig() !== null && allowedAdminUserIds().length > 0;
}

/** Cookie rules applied wherever Supabase Auth writes session cookies. */
export function secureAuthCookieOptions(options: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}
