/**
 * Server-only admin credential configuration.
 *
 * Values are read from the environment at request time; nothing is cached
 * here and no credential is ever written to disk by the application.
 */

const BCRYPT_HASH = /^\$2[aby]\$(\d{2})\$[./A-Za-z0-9]{53}$/;
const MIN_BCRYPT_COST = 10;
const MAX_BCRYPT_COST = 15;

export function adminUsername(): string {
  return (process.env.ADMIN_USERNAME ?? "").trim();
}

export function adminPasswordHash(): string {
  return process.env.ADMIN_PASSWORD_HASH ?? "";
}

export function isValidAdminPasswordHash(hash: string): boolean {
  const match = BCRYPT_HASH.exec(hash);
  if (!match) return false;
  const cost = Number(match[1]);
  return Number.isInteger(cost) && cost >= MIN_BCRYPT_COST && cost <= MAX_BCRYPT_COST;
}

/**
 * True only when a private dashboard can actually authenticate. A broken or
 * half-configured environment fails closed: login, pages and APIs stay shut.
 */
export function isAdminAuthConfigured(): boolean {
  if (process.env.ADMIN_ENABLED === "false") return false;

  const username = adminUsername();
  if (username.length < 3 || username.length > 128) return false;
  if (/[\u0000-\u001f\u007f]/.test(username)) return false;

  return isValidAdminPasswordHash(adminPasswordHash());
}

/** Kept as the shared enable check used by the dashboard and API guards. */
export function isDashboardEnabled(): boolean {
  return isAdminAuthConfigured();
}
