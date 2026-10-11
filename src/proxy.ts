import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, type Locale } from "@/i18n/config";

/**
 * Pick a locale from the Accept-Language header.
 * Arabic stays the fallback because it is the site default.
 */
function negotiateLocale(header: string | null): Locale {
  if (!header) return defaultLocale;

  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const quality = qParam ? Number.parseFloat(qParam.split("=")[1]) : 1;
      return { tag: tag.trim().toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .filter((c) => c.tag && c.tag !== "*")
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of candidates) {
    const base = tag.split("-")[0];
    if (base === "ar") return "ar";
    if (base === "en") return "en";
  }

  return defaultLocale;
}

const hasLocalePrefix = (pathname: string) =>
  pathname === "/ar" ||
  pathname === "/en" ||
  pathname.startsWith("/ar/") ||
  pathname.startsWith("/en/");

/**
 * Locale routing:
 * - "/about"  -> "/ar/about" (or "/en/about" when the browser prefers English)
 * - "/ar/..." and "/en/..." pass through untouched
 * - "/admin", "/api" and static assets are never prefixed
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (hasLocalePrefix(pathname)) return;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/uploads") ||
    // Files with an extension (favicon.ico, robots.txt, images, ...)
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return;
  }

  const locale = negotiateLocale(request.headers.get("accept-language"));
  const suffix = pathname === "/" ? "" : pathname;

  return NextResponse.redirect(new URL(`/${locale}${suffix}${search}`, request.url));
}

export const config = {
  // Never run on Next internals, API routes, the admin area or real files.
  matcher: ["/((?!_next|api|admin|uploads|.*\\..*).*)"],
};
