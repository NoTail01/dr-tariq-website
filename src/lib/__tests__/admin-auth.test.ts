import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it } from "vitest";

import { isAdminAuthConfigured } from "@/lib/admin-config";
import { assertSameOrigin } from "@/lib/admin-csrf";
import { checkLoginRateLimit, LOGIN_RATE_LIMIT } from "@/lib/admin-login";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  adminSessionCookieOptions,
  createAdminSession,
  verifyAdminSession,
} from "@/lib/admin-session";

const originalEnv = {
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  ADMIN_ENABLED: process.env.ADMIN_ENABLED,
  NODE_ENV: process.env.NODE_ENV,
};

function setEnv(username?: string, hash?: string, enabled?: string) {
  for (const [key, value] of Object.entries({ ADMIN_USERNAME: username, ADMIN_PASSWORD_HASH: hash, ADMIN_ENABLED: enabled })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function testHash() {
  const password = `test-only-${Math.random().toString(36).slice(2)}`;
  return { password, hash: bcrypt.hashSync(password, 10) };
}

describe("admin credential configuration", () => {
  it("fails closed unless both server-only variables are valid", () => {
    const { hash } = testHash();

    setEnv(undefined, undefined);
    expect(isAdminAuthConfigured()).toBe(false);

    setEnv("staff-user", undefined);
    expect(isAdminAuthConfigured()).toBe(false);

    setEnv("staff-user", "plaintext-password");
    expect(isAdminAuthConfigured()).toBe(false);

    setEnv("staff-user", hash);
    expect(isAdminAuthConfigured()).toBe(true);

    setEnv("staff-user", hash, "false");
    expect(isAdminAuthConfigured()).toBe(false);
  });

  it("rejects bcrypt hashes with an unsafe work factor", () => {
    const weakHash = bcrypt.hashSync(`test-only-${Math.random()}`, 8);
    setEnv("staff-user", weakHash);
    expect(isAdminAuthConfigured()).toBe(false);
  });
});

describe("signed admin sessions", () => {
  it("creates a signed, expiring session that verifies", async () => {
    const { hash } = testHash();
    setEnv("staff-user", hash);
    const now = 1_700_000_000_000;

    const session = await createAdminSession(now);
    expect(session.split(".")).toHaveLength(2);
    expect(ADMIN_SESSION_COOKIE).toBe("dt_admin_session");

    const verified = await verifyAdminSession(session, now + 1_000);
    expect(verified).not.toBeNull();
    expect(verified?.exp).toBe(now + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);
  });

  it("rejects expired, tampered and wrong-configuration sessions", async () => {
    const { hash } = testHash();
    setEnv("staff-user", hash);
    const now = 1_700_000_000_000;
    const session = await createAdminSession(now);

    expect(await verifyAdminSession(session, now + ADMIN_SESSION_MAX_AGE_SECONDS * 1000 + 1)).toBeNull();

    const [body, signature] = session.split(".") as [string, string];
    const flipped = signature.endsWith("A") ? `${signature.slice(0, -1)}B` : `${signature.slice(0, -1)}A`;
    expect(await verifyAdminSession(`${body}.${flipped}`, now)).toBeNull();

    setEnv("different-user", hash);
    expect(await verifyAdminSession(session, now)).toBeNull();
  });

  it("uses secure cookie flags in production", () => {
    Reflect.set(process.env, "NODE_ENV", "production");
    expect(adminSessionCookieOptions()).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
  });
});

describe("admin CSRF guard", () => {
  const url = "https://admin.example.test/api/admin/articles";

  it("allows same-origin unsafe requests and all safe requests", () => {
    expect(
      assertSameOrigin(new Request(url, { method: "POST", headers: { origin: "https://admin.example.test" } })),
    ).toBeNull();
    expect(assertSameOrigin(new Request(url, { method: "GET" }))).toBeNull();
  });

  it("rejects missing or cross-site origins", () => {
    expect(assertSameOrigin(new Request(url, { method: "POST" }))).not.toBeNull();
    expect(
      assertSameOrigin(new Request(url, { method: "POST", headers: { origin: "https://evil.example.test" } })),
    ).not.toBeNull();
  });
});

describe("login throttling", () => {
  it("blocks repeated attempts from the same client", () => {
    const ip = `192.0.2.${Math.floor(Math.random() * 200) + 1}`;
    const request = () =>
      new Request("https://admin.example.test/api/admin/login", {
        method: "POST",
        headers: { "x-forwarded-for": ip },
      });

    for (let attempt = 0; attempt < LOGIN_RATE_LIMIT; attempt += 1) {
      expect(checkLoginRateLimit(request()).allowed).toBe(true);
    }
    const blocked = checkLoginRateLimit(request());
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
