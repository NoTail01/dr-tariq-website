import { timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, expectedAdminSession } from "@/lib/admin-session";
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
      const quality = qParam ? Number.parseFloat(qParam.split("q=")[1]) : 1;
      return { tag: tag.trim().toLowerCase(), quality: Number.isNaN(quality) ? 1 : quality };
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

/** `/{ar|en}/blog/{slug}` — the public article route. */
const ARTICLE_PATH = /^\/(ar|en)\/blog\/([^/]+)\/?$/;

/**
 * Slugs of every stored article, in both locales. Read from the same JSON
 * store the public pages use, so an article added through the dashboard is
 * routable immediately (after the next build).
 */
function knownArticleSlugs(): Set<string> | null {
  try {
    const raw = readFileSync(path.join(process.cwd(), "content", "articles.json"), "utf8");
    const articles = JSON.parse(raw) as unknown;
    if (!Array.isArray(articles)) return null;
    const slugs = new Set<string>();
    for (const article of articles) {
      const slug = (article as { slug?: { ar?: string; en?: string } }).slug;
      if (slug?.ar) slugs.add(slug.ar);
      if (slug?.en) slugs.add(slug.en);
    }
    return slugs.size > 0 ? slugs : null;
  } catch {
    // Store unreadable: let the page decide (it calls notFound() itself).
    return null;
  }
}

/** Redirect unauthenticated production requests away from dashboard pages. */
function guardAdminPages(request: NextRequest): NextResponse | null {
  const loginUrl = new URL("/admin/login", request.url);

  // The login page must remain reachable so an operator can authenticate.
  if (request.nextUrl.pathname === "/admin/login") return null;
  if (process.env.NODE_ENV !== "production") return null;
  if (process.env.ADMIN_ENABLED === "false") return NextResponse.redirect(loginUrl);

  const expected = expectedAdminSession();
  if (!expected) return NextResponse.redirect(loginUrl);

  const candidate = request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? "";
  const valid =
    /^[a-f0-9]{64}$/.test(candidate) &&
    timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(expected, "hex"));
  return valid ? null : NextResponse.redirect(loginUrl);
}

/**
 * Locale routing and unknown-article handling:
 * - "/about"  -> "/ar/about" (or "/en/about" when the browser prefers English)
 * - "/ar/..." and "/en/..." pass through untouched
 * - "/admin", "/api" and static assets are never prefixed
 * - "/{ar|en}/blog/{unknown-slug}" answers with a real 404 (the not-found
 *   UI is served through Next's `/_not-found` route) instead of a soft 404
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Dashboard pages are guarded here; /api/admin/* routes guard themselves.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return guardAdminPages(request) ?? undefined;
  }

  // Unknown article slugs never reach the page renderer: the prerendered
  // shell would otherwise commit a 200 before notFound() runs.
  const articleMatch = pathname.match(ARTICLE_PATH);
  if (articleMatch) {
    const slugs = knownArticleSlugs();
    if (slugs && !slugs.has(articleMatch[2])) {
      return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
    }
    return;
  }

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
  // Run on dashboard pages too (for the auth guard); API routes and assets
  // keep their own guards and are excluded.
  matcher: ["/((?!_next|api|uploads|.*\\..*).*)"],
};
