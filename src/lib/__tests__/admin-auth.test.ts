import { afterEach, describe, expect, it } from "vitest";

import { assertSameOrigin } from "@/lib/admin-csrf";
import { checkLoginRateLimit, LOGIN_RATE_LIMIT } from "@/lib/admin-login";
import {
  adminIdentityFromClaims,
  allowedAdminUserIds,
  isAdminAuthConfigured,
  secureAuthCookieOptions,
  supabaseAuthConfig,
} from "@/lib/supabase-auth-config";

const ALLOWED_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";
const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "ADMIN_ALLOWED_USER_IDS",
  "NODE_ENV",
] as const;

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function setEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function configureValidAuth() {
  setEnv({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/",
    SUPABASE_URL: undefined,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-test-key",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
    ADMIN_ALLOWED_USER_IDS: ALLOWED_ID,
  });
}

afterEach(() => {
  setEnv(originalEnv);
});

describe("Supabase Auth configuration", () => {
  it("requires a valid project URL and a publishable key", () => {
    setEnv({
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
    });
    expect(supabaseAuthConfig()).toBeNull();

    setEnv({ NEXT_PUBLIC_SUPABASE_URL: "localhost:3000", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "key" });
    expect(supabaseAuthConfig()).toBeNull();

    setEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-test-key",
    });
    expect(supabaseAuthConfig()).toEqual({
      url: "https://example.supabase.co",
      key: "public-test-key",
    });

    setEnv({
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      SUPABASE_URL: "https://fallback.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-anon-key",
    });
    expect(supabaseAuthConfig()).toEqual({
      url: "https://fallback.supabase.co",
      key: "legacy-anon-key",
    });
  });

  it("fails closed unless auth and a well-formed allowlist exist", () => {
    setEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "key",
      ADMIN_ALLOWED_USER_IDS: undefined,
    });
    expect(isAdminAuthConfigured()).toBe(false);

    setEnv({ ADMIN_ALLOWED_USER_IDS: ALLOWED_ID });
    expect(isAdminAuthConfigured()).toBe(true);

    setEnv({ ADMIN_ALLOWED_USER_IDS: " " + ALLOWED_ID.toUpperCase() + " , " + ALLOWED_ID + " " });
    expect(allowedAdminUserIds()).toEqual([ALLOWED_ID]);
    expect(isAdminAuthConfigured()).toBe(true);

    // A single typo disables the whole allowlist instead of widening access.
    setEnv({ ADMIN_ALLOWED_USER_IDS: ALLOWED_ID + ",not-a-uuid" });
    expect(allowedAdminUserIds()).toEqual([]);
    expect(isAdminAuthConfigured()).toBe(false);
  });
});

describe("verified admin identity", () => {
  it("accepts only allowlisted UUIDs from verified claims", () => {
    configureValidAuth();

    expect(
      adminIdentityFromClaims({ sub: ALLOWED_ID, email: "admin@example.test" }),
    ).toEqual({ id: ALLOWED_ID, email: "admin@example.test" });
    expect(adminIdentityFromClaims({ sub: OTHER_ID, email: "other@example.test" })).toBeNull();
    expect(adminIdentityFromClaims({ sub: "not-a-uuid" })).toBeNull();
    expect(adminIdentityFromClaims({ sub: 42 })).toBeNull();
    expect(adminIdentityFromClaims(null)).toBeNull();
    expect(adminIdentityFromClaims({ email: "admin@example.test" })).toBeNull();
  });

  it("never trusts an allowlist entry when auth is disabled", () => {
    setEnv({
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      ADMIN_ALLOWED_USER_IDS: ALLOWED_ID,
    });
    expect(adminIdentityFromClaims({ sub: ALLOWED_ID })).toBeNull();
  });
});

describe("Supabase cookie protections", () => {
  it("uses httpOnly and same-site cookies in every environment", () => {
    expect(secureAuthCookieOptions({ maxAge: 60 })).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 60,
    });
  });

  it("adds the secure flag in production", () => {
    Reflect.set(process.env, "NODE_ENV", "production");
    expect(secureAuthCookieOptions({})).toMatchObject({ secure: true, httpOnly: true });
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
    const ip = "192.0.2." + String(Math.floor(Math.random() * 200) + 1);
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
