import {
  adminPasswordHash,
  adminUsername,
  isAdminAuthConfigured,
} from "./admin-config";

/**
 * Stateless, signed admin sessions.
 *
 * The cookie contains only a version, a username digest and an expiry, all
 * authenticated with an HMAC key derived from the server-only credentials.
 * The same code runs in the page proxy and in Route Handlers, so both layers
 * accept exactly the same sessions. No password or password hash ever reaches
 * the browser.
 */

export const ADMIN_SESSION_COOKIE = "dt_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

const SESSION_VERSION = 1;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type AdminSessionPayload = {
  v: number;
  u: string;
  iat: number;
  exp: number;
};

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  try {
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

/** Compare bytes without short-circuiting on the first difference. */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const length = Math.max(a.length, b.length);
  let difference = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sessionKey(): Promise<CryptoKey> {
  const material = encoder.encode(
    `dt-admin-session:v${SESSION_VERSION}:${adminUsername()}:${adminPasswordHash()}`,
  );
  const digest = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey("raw", digest, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
}

async function usernameDigest(): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(adminUsername()));
  return bytesToHex(new Uint8Array(digest));
}

async function sign(body: string): Promise<string> {
  const signature = await crypto.subtle.sign("HMAC", await sessionKey(), encoder.encode(body));
  return base64UrlEncode(new Uint8Array(signature));
}

/** Create a signed session for the configured administrator. */
export async function createAdminSession(now = Date.now()): Promise<string> {
  if (!isAdminAuthConfigured()) {
    throw new Error("Admin authentication is not configured.");
  }

  const payload: AdminSessionPayload = {
    v: SESSION_VERSION,
    u: await usernameDigest(),
    iat: now,
    exp: now + ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
  };
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  return `${body}.${await sign(body)}`;
}

/** Verify the signature, expiry and configured username of a session cookie. */
export async function verifyAdminSession(
  value: string | undefined | null,
  now = Date.now(),
): Promise<AdminSessionPayload | null> {
  if (!value || !isAdminAuthConfigured()) return null;

  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts as [string, string];

  const supplied = base64UrlDecode(signature);
  const expected = base64UrlDecode(await sign(body));
  if (!supplied || !expected || !constantTimeEqual(supplied, expected)) return null;

  const decoded = base64UrlDecode(body);
  if (!decoded) return null;

  let payload: AdminSessionPayload;
  try {
    payload = JSON.parse(decoder.decode(decoded)) as AdminSessionPayload;
  } catch {
    return null;
  }

  if (
    payload?.v !== SESSION_VERSION ||
    payload.u !== (await usernameDigest()) ||
    !Number.isFinite(payload.iat) ||
    !Number.isFinite(payload.exp) ||
    payload.iat > now + 60_000 ||
    payload.exp <= now ||
    payload.exp - payload.iat !== ADMIN_SESSION_MAX_AGE_SECONDS * 1000
  ) {
    return null;
  }

  return payload;
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    // Always Secure in a deployed environment. Plain HTTP is allowed only for
    // a local `next dev` server, where browsers would not store Secure cookies.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

export function clearAdminSessionCookieOptions() {
  return { ...adminSessionCookieOptions(), maxAge: 0 };
}
