import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  adminPasswordHash,
  adminUsername,
  isAdminAuthConfigured,
} from "./admin-config";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
  type AdminSessionPayload,
} from "./admin-session";

export { ADMIN_SESSION_COOKIE } from "./admin-session";
export { isAdminAuthConfigured, isDashboardEnabled } from "./admin-config";

const encoder = new TextEncoder();
const MAX_BCRYPT_PASSWORD_BYTES = 72;

function constantTimeEqualText(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

/**
 * Verify the submitted username and password against server-only environment
 * variables. A bcrypt comparison always runs when configured, even for a
 * wrong username, so the two failure cases are not distinguishable by timing.
 */
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  if (!isAdminAuthConfigured()) return false;

  const passwordBytes = encoder.encode(password).length;
  if (passwordBytes === 0 || passwordBytes > MAX_BCRYPT_PASSWORD_BYTES) return false;

  const passwordMatches = await bcrypt.compare(password, adminPasswordHash());
  const usernameMatches = constantTimeEqualText(username.trim(), adminUsername());
  return usernameMatches && passwordMatches;
}

/** Read the signed session carried by the current request. */
export async function getAuthenticatedSession(): Promise<AdminSessionPayload | null> {
  if (!isAdminAuthConfigured()) return null;
  const store = await cookies();
  const value = store.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSession(value);
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getAuthenticatedSession()) !== null;
}

/** Server-side gate for protected dashboard pages. */
export async function requireAdminSession(): Promise<AdminSessionPayload> {
  const session = await getAuthenticatedSession();
  if (!session) redirect("/admin/login");
  return session;
}
