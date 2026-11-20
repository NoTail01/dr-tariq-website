import { readFileSync } from "node:fs";
import path from "node:path";

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, type Locale } from "@/i18n/config";
import {
  secureAuthCookieOptions,
  supabaseAuthConfig,
} from "@/lib/supabase-auth-config";

/** Pick a locale from Accept-Language; Arabic remains the site default. */
function negotiateLocale(header: string | null): Locale {
  if (!header) return defaultLocale;

  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const quality = qParam ? Number.parseFloat(qParam.split("q=")[1]) : 1;
      return {
        tag: tag.trim().toLowerCase(),
        quality: Number.isNaN(quality) ? 1 : quality,
      };
    })
    .filter((candidate) => candidate.tag && candidate.tag !== "*")
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

// Public article route: /{ar|en}/blog/{slug}.
const ARTICLE_PATH = /^\/(ar|en)\/blog\/([^/]+)\/?$/;

/** Slugs of every stored article, in both locales. */
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

/**
 * Refresh Supabase Auth cookies before a protected page renders. Authorization
 * is still verified again by the protected layout and every API guard; the
 * proxy only keeps the short-lived access token alive.
 */
async function refreshAdminSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const config = supabaseAuthConfig();
  if (!config) return response;

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, secureAuthCookieOptions(options));
        });
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  try {
    await supabase.auth.getClaims();
  } catch {
    // Fail closed in the layout/API guard; a proxy error only means the token
    // was not refreshed on this request.
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

/**
 * Locale routing and unknown-article handling:
 * - "/about" -> "/ar/about" (or "/en/about" for English-preferring browsers)
 * - "/ar/..." and "/en/..." pass through untouched
 * - "/admin", "/api" and static assets are never prefixed
 * - unknown article slugs answer with a real 404
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Supabase sessions are refreshed for dashboard pages only. API routes
  // create their own request-specific client and guard themselves.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return refreshAdminSession(request);
  }

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
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return;
  }

  const locale = negotiateLocale(request.headers.get("accept-language"));
  const suffix = pathname === "/" ? "" : pathname;
  return NextResponse.redirect(new URL("/" + locale + suffix + search, request.url));
}

export const config = {
  // Run on dashboard pages to refresh Supabase Auth cookies. API routes and
  // assets keep their own guards and are excluded.
  matcher: ["/((?!_next|api|uploads|.*\\..*).*)"],
};
