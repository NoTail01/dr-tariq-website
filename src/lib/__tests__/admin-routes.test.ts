import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LOGIN_RATE_LIMIT } from "@/lib/admin-login";

const mocks = vi.hoisted(() => ({
  createSupabaseAuthClient: vi.fn(),
  connection: vi.fn(),
  getAdminIdentity: vi.fn(),
  isAdminAuthConfigured: vi.fn(),
  signInWithPassword: vi.fn(),
  getClaims: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, connection: mocks.connection };
});

vi.mock("@/lib/supabase-auth-client", () => ({
  createSupabaseAuthClient: mocks.createSupabaseAuthClient,
}));

vi.mock("@/lib/admin-auth", () => ({
  getAdminIdentity: mocks.getAdminIdentity,
  isAdminAuthConfigured: mocks.isAdminAuthConfigured,
}));

import { guardAdmin } from "@/lib/admin-api";
import { POST as login } from "@/app/api/admin/login/route";
import { POST as logout } from "@/app/api/admin/logout/route";
import { GET as session } from "@/app/api/admin/session/route";

const ALLOWED_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";
const ORIGIN = "https://admin.example.test";
const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "ADMIN_ALLOWED_USER_IDS",
] as const;
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

let ipCounter = 0;
function nextIp() {
  ipCounter += 1;
  return "198.51.100." + String(ipCounter);
}

function post(path: string, body: unknown, options: { ip?: string; origin?: string | null } = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const origin = options.origin === undefined ? ORIGIN : options.origin;
  if (origin) headers.origin = origin;
  headers["x-forwarded-for"] = options.ip ?? nextIp();
  return new Request(ORIGIN + path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of ENV_KEYS) {
    if (key === "NEXT_PUBLIC_SUPABASE_URL") process.env[key] = "https://example.supabase.co";
    else if (key === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") process.env[key] = "public-test-key";
    else if (key === "ADMIN_ALLOWED_USER_IDS") process.env[key] = ALLOWED_ID;
    else delete process.env[key];
  }

  mocks.connection.mockResolvedValue(undefined);
  mocks.isAdminAuthConfigured.mockReturnValue(true);
  mocks.signInWithPassword.mockResolvedValue({
    data: { session: { access_token: "fresh-access-token" } },
    error: null,
  });
  mocks.getClaims.mockResolvedValue({
    data: { claims: { sub: ALLOWED_ID, email: "admin@example.test" } },
    error: null,
  });
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.createSupabaseAuthClient.mockResolvedValue({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      getClaims: mocks.getClaims,
      signOut: mocks.signOut,
    },
  });
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("POST /api/admin/login", () => {
  it("signs in an allowlisted Supabase user", async () => {
    const response = await login(
      post("/api/admin/login", { email: "Admin@Example.test", password: "correct-password" }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, mode: "supabase" });
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "admin@example.test",
      password: "correct-password",
    });
    expect(mocks.getClaims).toHaveBeenCalledWith("fresh-access-token");
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("returns a generic error for invalid credentials", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: null,
      error: new Error("Invalid login credentials"),
    });
    const response = await login(
      post("/api/admin/login", { email: "admin@example.test", password: "wrong-password" }),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ ok: false, reason: "invalid" });
    expect(mocks.getClaims).not.toHaveBeenCalled();
  });

  it("rejects and signs out a valid account outside the allowlist", async () => {
    mocks.getClaims.mockResolvedValue({
      data: { claims: { sub: OTHER_ID, email: "other@example.test" } },
      error: null,
    });
    const response = await login(
      post("/api/admin/login", { email: "other@example.test", password: "correct-password" }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ ok: false, reason: "not_authorized" });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("rejects cross-origin and missing-origin requests before Supabase is called", async () => {
    for (const origin of [null, "https://evil.example.test"]) {
      const response = await login(
        post("/api/admin/login", { email: "admin@example.test", password: "x" }, { origin }),
      );
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ reason: "csrf" });
    }
    expect(mocks.createSupabaseAuthClient).not.toHaveBeenCalled();
  });

  it("rate limits repeated sign-in attempts", async () => {
    const ip = nextIp();
    mocks.signInWithPassword.mockResolvedValue({ data: null, error: new Error("bad") });
    for (let attempt = 0; attempt < LOGIN_RATE_LIMIT; attempt += 1) {
      const response = await login(
        post(
          "/api/admin/login",
          { email: "admin@example.test", password: "wrong" },
          { ip },
        ),
      );
      expect(response.status).toBe(401);
    }
    const blocked = await login(
      post("/api/admin/login", { email: "admin@example.test", password: "wrong" }, { ip }),
    );
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toMatchObject({ reason: "rate_limited" });
  });
});

describe("admin session and logout", () => {
  it("reports an authenticated allowlisted session", async () => {
    mocks.getAdminIdentity.mockResolvedValue({ id: ALLOWED_ID, email: "admin@example.test" });
    const response = await session();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      enabled: true,
      authenticated: true,
      mode: "supabase",
      email: "admin@example.test",
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("reports an unauthenticated session without exposing an identity", async () => {
    mocks.getAdminIdentity.mockResolvedValue(null);
    const response = await session();
    expect(await response.json()).toEqual({
      enabled: true,
      authenticated: false,
      mode: "supabase",
      email: null,
    });
  });

  it("clears the Supabase session on logout", async () => {
    const response = await logout(post("/api/admin/logout", {}, { ip: nextIp() }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});

describe("admin API guard", () => {
  const request = () => new Request(ORIGIN + "/api/admin/articles", { method: "GET" });

  it("allows only verified allowlisted identities", async () => {
    mocks.getAdminIdentity.mockResolvedValue(null);
    const denied = await guardAdmin(request());
    expect(denied?.status).toBe(401);

    mocks.getAdminIdentity.mockResolvedValue({ id: ALLOWED_ID, email: "admin@example.test" });
    expect(await guardAdmin(request())).toBeNull();
  });

  it("fails closed when the allowlist is not configured", async () => {
    mocks.isAdminAuthConfigured.mockReturnValue(false);
    const denied = await guardAdmin(request());
    expect(denied?.status).toBe(403);
    expect(mocks.getAdminIdentity).not.toHaveBeenCalled();
  });

  it("rejects state-changing requests without a same-origin header", async () => {
    const denied = await guardAdmin(
      new Request(ORIGIN + "/api/admin/articles", { method: "POST" }),
    );
    expect(denied?.status).toBe(403);
    expect(await denied?.json()).toMatchObject({ reason: "csrf" });
    expect(mocks.getAdminIdentity).not.toHaveBeenCalled();
  });
});
