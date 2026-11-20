import { redirect } from "next/navigation";

import { createSupabaseAuthClient } from "./supabase-auth-client";
import {
  adminIdentityFromClaims,
  isAdminAuthConfigured,
  type AdminIdentity,
} from "./supabase-auth-config";

export { isAdminAuthConfigured, type AdminIdentity } from "./supabase-auth-config";

/**
 * Verify the Supabase session on the server and apply the explicit admin
 * allowlist. getClaims() validates the JWT signature; the cookie alone is
 * never trusted as proof of identity.
 */
export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  if (!isAdminAuthConfigured()) return null;

  try {
    const supabase = await createSupabaseAuthClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error) return null;
    return adminIdentityFromClaims(data?.claims);
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getAdminIdentity()) !== null;
}

/** Server-side gate for every protected dashboard page. */
export async function requireAdminUser(): Promise<AdminIdentity> {
  const admin = await getAdminIdentity();
  if (!admin) redirect("/admin/login");
  return admin;
}
