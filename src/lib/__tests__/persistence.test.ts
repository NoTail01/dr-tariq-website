import { afterEach, describe, expect, it, vi } from "vitest";

import {
  describePersistence,
  PersistenceBlockedError,
  assertWritable,
} from "@/lib/persistence";
import { persistMode } from "@/lib/supabase";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("persistMode", () => {
  it("is local in development with no backend configured", () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(persistMode()).toBe("local");
  });

  it("is supabase as soon as both credentials exist", () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("NODE_ENV", "production");
    expect(persistMode()).toBe("supabase");
  });

  it("is supabase even in development when a backend is configured", () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("NODE_ENV", "development");
    expect(persistMode()).toBe("supabase");
  });

  it("is blocked in production with no backend, so writes cannot be lost", () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(persistMode()).toBe("blocked");
  });

  it("is not supabase when only one of the two credentials exists", () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(persistMode()).toBe("blocked");
  });

  it("rejects a non-http url instead of building a broken request", () => {
    vi.stubEnv("SUPABASE_URL", "project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("NODE_ENV", "production");
    expect(persistMode()).toBe("blocked");
  });
});

describe("assertWritable", () => {
  it("allows local writes in development", () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(() => assertWritable("articles")).not.toThrow();
  });

  it("refuses local writes in production without a backend", () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => assertWritable("articles")).toThrow(PersistenceBlockedError);
  });
});

describe("describePersistence", () => {
  it("reports the backend and local flags for the configured case", () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("NODE_ENV", "production");
    expect(describePersistence()).toEqual({ mode: "supabase", local: false, backend: true });
  });

  it("reports the blocked production case", () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(describePersistence()).toEqual({ mode: "blocked", local: false, backend: false });
  });
});
