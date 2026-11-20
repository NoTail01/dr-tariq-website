import { afterEach, describe, expect, it, vi } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { defaultSettings } from "@/lib/settings";
import {
  isIndexableSite,
  isVerifiedHttpsSiteUrl,
  resolveSiteUrl,
} from "@/lib/site";
import { blogId, clinicNode, organizationNode } from "@/lib/structured-data";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isVerifiedHttpsSiteUrl", () => {
  it("accepts only a real HTTPS origin", () => {
    expect(isVerifiedHttpsSiteUrl("https://dr-tariq.example")).toBe(true);
    expect(isVerifiedHttpsSiteUrl("https://dr-tariq.example/")).toBe(true);
  });

  it("rejects HTTP, localhost, credentials and paths", () => {
    expect(isVerifiedHttpsSiteUrl("http://dr-tariq.example")).toBe(false);
    expect(isVerifiedHttpsSiteUrl("http://localhost:3000")).toBe(false);
    expect(isVerifiedHttpsSiteUrl("https://user:pass@dr-tariq.example")).toBe(false);
    expect(isVerifiedHttpsSiteUrl("https://dr-tariq.example/path?q=1")).toBe(false);
    expect(isVerifiedHttpsSiteUrl("not-a-url")).toBe(false);
    expect(isVerifiedHttpsSiteUrl("")).toBe(false);
    expect(isVerifiedHttpsSiteUrl(undefined)).toBe(false);
  });
});

describe("resolveSiteUrl", () => {
  it("uses a configured HTTPS origin verbatim", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_MODE", "production");
    expect(resolveSiteUrl("https://dr-tariq.example/")).toBe("https://dr-tariq.example");
  });

  it("keeps localhost in development but not in production", () => {
    vi.stubEnv("NEXT_PUBLIC_ALLOW_LOCAL_SEO", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_MODE", "development");
    expect(resolveSiteUrl("http://localhost:3000")).toBe("http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_SITE_MODE", "production");
    expect(resolveSiteUrl("http://localhost:3000")).toBe("https://unconfigured.invalid");
  });

  it("never emits localhost for an unconfigured production build", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_ALLOW_LOCAL_SEO", "");
    expect(resolveSiteUrl("")).toBe("https://unconfigured.invalid");
  });
});

describe("isIndexableSite", () => {
  it("is off by default for a local development build", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_SITE_MODE", "development");
    vi.stubEnv("NEXT_PUBLIC_ALLOW_LOCAL_SEO", "");
    vi.stubEnv("VERCEL_ENV", "");
    expect(isIndexableSite()).toBe(false);
  });

  it("can be explicitly enabled for local QA", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_ALLOW_LOCAL_SEO", "1");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("VERCEL_ENV", "");
    expect(isIndexableSite()).toBe(true);
  });

  it("requires production hosting plus a verified HTTPS domain", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_ALLOW_LOCAL_SEO", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dr-tariq.example");
    expect(isIndexableSite()).toBe(true);
  });

  it("stays off for Vercel previews and unconfigured production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_ALLOW_LOCAL_SEO", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dr-tariq.example");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isIndexableSite()).toBe(false);

    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(isIndexableSite()).toBe(false);
  });
});

describe("non-indexable output", () => {
  it("disallows everything in robots.txt while noindex", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_SITE_MODE", "development");
    vi.stubEnv("NEXT_PUBLIC_ALLOW_LOCAL_SEO", "");
    vi.stubEnv("VERCEL_ENV", "");
    expect(robots().rules).toEqual([{ userAgent: "*", disallow: "/" }]);
    expect(robots().sitemap).toBeUndefined();
  });

  it("emits an empty sitemap while noindex", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_SITE_MODE", "development");
    vi.stubEnv("NEXT_PUBLIC_ALLOW_LOCAL_SEO", "");
    vi.stubEnv("VERCEL_ENV", "");
    expect(await sitemap()).toEqual([]);
  });

  it("never publishes validation, demo or pending article URLs", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_ALLOW_LOCAL_SEO", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dr-tariq.example");

    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((entry) => entry.url.includes("__held__"))).toBe(false);
    expect(entries.some((entry) => entry.url.includes("/blog/"))).toBe(false);
  });
});

describe("structured-data safety", () => {
  it("omits invented location and service fields", () => {
    const organization = organizationNode("en", defaultSettings) as Record<string, unknown>;
    const clinic = clinicNode("en", defaultSettings) as Record<string, unknown>;
    expect(organization.address).toBeUndefined();
    expect(organization.addressLocality).toBeUndefined();
    expect(organization.addressCountry).toBeUndefined();
    expect(clinic.address).toBeUndefined();
    expect(clinic.availableService).toBeUndefined();
  });

  it("uses one stable Blog id per locale", () => {
    expect(blogId("en")).toBe(blogId("en"));
    expect(blogId("en")).toMatch(/\/en\/blog#blog$/);
    expect(blogId("ar")).toMatch(/\/ar\/blog#blog$/);
  });
});
