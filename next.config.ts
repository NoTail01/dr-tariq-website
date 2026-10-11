import type { NextConfig } from "next";

/**
 * Site URL used for canonical URLs, sitemap and Open Graph tags.
 * Never contains secrets — it is public metadata.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy is opt-in (set NEXT_PUBLIC_SECURITY_HEADERS_CSP=1)
 * because local development and Google integrations need different sources.
 * Only include origins that are actually enabled — see docs/GOOGLE.md.
 */
function buildCsp(): string {
  const scriptSrc = ["'self'", "'unsafe-inline'"];
  const connectSrc = ["'self'"];
  const frameSrc = ["'self'"];
  const imgSrc = ["'self'", "data:", "blob:"];

  if (process.env.NEXT_PUBLIC_GA4_ID) {
    scriptSrc.push("https://www.googletagmanager.com");
    scriptSrc.push("https://*.google-analytics.com");
    connectSrc.push("https://*.google-analytics.com");
    connectSrc.push("https://*.analytics.google.com");
  }
  if (process.env.NEXT_PUBLIC_GTM_ID) {
    scriptSrc.push("https://www.googletagmanager.com");
    connectSrc.push("https://www.googletagmanager.com");
  }
  if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL) {
    frameSrc.push("https://www.google.com");
    frameSrc.push("https://maps.google.com");
    imgSrc.push("https://*.google.com");
    imgSrc.push("https://*.gstatic.com");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${frameSrc.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // The app uses multiple root layouts (public site + admin), so the
    // application-wide 404 page is provided by `app/global-not-found.tsx`.
    globalNotFound: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  poweredByHeader: false,
  async headers() {
    const cspEnabled = process.env.NEXT_PUBLIC_SECURITY_HEADERS_CSP === "1";

    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
      { key: "X-DNS-Prefetch-Control", value: "on" },
    ];

    if (cspEnabled) {
      securityHeaders.push({ key: "Content-Security-Policy", value: buildCsp() });
    }

    if (isProd) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains",
      });
    }

    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
