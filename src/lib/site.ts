export type SiteMode = "development" | "production";

/**
 * Controls which placeholder/demo content may appear.
 *
 * - `npm run dev`            -> development (demo articles visible, marked)
 * - `npm run build && start` -> production  (demo articles hidden entirely)
 *
 * NEXT_PUBLIC_SITE_MODE can override the default, e.g. to preview the
 * production view locally. This is separate from indexability: a local
 * production preview is still noindex unless explicitly opted in for QA.
 */
export function getSiteMode(): SiteMode {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_MODE;
  if (fromEnv === "development" || fromEnv === "production") return fromEnv;
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

/** Reserved TLD: never a real hostname, and never emitted for indexable pages. */
const UNCONFIGURED_SITE_URL = "https://unconfigured.invalid";
const LOCAL_SITE_URL = "http://localhost:3000";

function configuredSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
}

function parseUrl(value: string): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function isPlainHttpUrl(parsed: URL | null): parsed is URL {
  if (!parsed) return false;
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  return (
    parsed.pathname === "/" &&
    !parsed.username &&
    !parsed.password &&
    !parsed.search &&
    !parsed.hash
  );
}

/** True only for a real HTTPS origin supplied by the deployment configuration. */
export function isVerifiedHttpsSiteUrl(
  value: string | undefined = configuredSiteUrl(),
): boolean {
  const parsed = parseUrl((value ?? "").trim().replace(/\/+$/, ""));
  return (
    isPlainHttpUrl(parsed) &&
    parsed.protocol === "https:" &&
    !isLocalHostname(parsed.hostname)
  );
}

/**
 * Absolute origin used in canonicals, schema IDs, sitemap and Open Graph tags.
 *
 * Production never falls back to localhost: an unconfigured production build
 * uses a reserved invalid host and is noindex. Local development keeps the
 * familiar localhost origin, but is also noindex unless QA explicitly opts in.
 */
export function resolveSiteUrl(value: string | undefined = configuredSiteUrl()): string {
  const normalized = (value ?? "").trim().replace(/\/+$/, "");
  const parsed = parseUrl(normalized);
  const explicitLocalOptIn = process.env.NEXT_PUBLIC_ALLOW_LOCAL_SEO === "1";

  if (isVerifiedHttpsSiteUrl(normalized)) return normalized;

  if (
    (explicitLocalOptIn || getSiteMode() === "development") &&
    isPlainHttpUrl(parsed) &&
    isLocalHostname(parsed.hostname)
  ) {
    return normalized;
  }

  if (!normalized && getSiteMode() === "development") return LOCAL_SITE_URL;

  return UNCONFIGURED_SITE_URL;
}

/**
 * Indexability is opt-in: production hosting + a verified HTTPS origin.
 * Vercel preview/staging deployments and unconfigured builds are always
 * noindex, even when they use a plausible-looking URL.
 */
export function isIndexableSite(): boolean {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return false;
  if (process.env.VERCEL_URL && process.env.VERCEL_ENV !== "production") return false;

  const parsed = parseUrl(resolveSiteUrl());
  if (
    process.env.NEXT_PUBLIC_ALLOW_LOCAL_SEO === "1" &&
    isPlainHttpUrl(parsed) &&
    isLocalHostname(parsed.hostname)
  ) {
    return true;
  }

  if (getSiteMode() !== "production") return false;
  return isVerifiedHttpsSiteUrl(configuredSiteUrl());
}

export const SITE_URL = resolveSiteUrl();
