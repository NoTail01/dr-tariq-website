"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { useDashboardLocale } from "./useDashboardLocale";

export type AdminSession = {
  enabled: boolean;
  authenticated: boolean;
  mode: "development" | "token";
};

const navItems: { href: string; labelKey: "overview" | "articles" | "newArticle" | "settings" }[] = [
  { href: "/admin", labelKey: "overview" },
  { href: "/admin/articles", labelKey: "articles" },
  { href: "/admin/articles/new", labelKey: "newArticle" },
  { href: "/admin/settings", labelKey: "settings" },
];

/**
 * Dashboard chrome + client-side access gate.
 *
 * The real protection lives on the API routes (server-side). This gate only
 * keeps the UI honest: unauthenticated visitors are sent to /admin/login and
 * never receive article data.
 *
 * The chrome and the page content always render — even while the session is
 * being checked — because a route segment that is dropped from rendering
 * fails instant-navigation validation on every protected admin route. While
 * access is unresolved, an inert overlay covers the page instead.
 *
 * The shell carries an AR/EN language switch (persisted per browser and
 * shared with every page through the dashboard locale store) because the
 * dashboard is used by clinic staff, not only developers.
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  return <AdminShellInner>{children}</AdminShellInner>;
}

function AdminShellInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const { locale, setLocale, t } = useDashboardLocale();

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: AdminSession) => {
        if (cancelled) return;
        setSession(data);
        if (!data.authenticated && pathname !== "/admin/login") {
          router.replace("/admin/login");
        }
        if (data.authenticated && pathname === "/admin/login") {
          router.replace("/admin/articles");
        }
      })
      .catch(() => {
        if (!cancelled) setSession({ enabled: false, authenticated: false, mode: "token" });
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const authorized = session?.authenticated === true;
  const checkingAccess = !authorized;

  function switchLocale() {
    setLocale(locale === "ar" ? "en" : "ar");
  }

  if (pathname === "/admin/login") {
    return (
      <div dir={t.dir} lang={locale}>
        {children}
      </div>
    );
  }

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div dir={t.dir} lang={locale} className="min-h-screen bg-slate-50">
      <div inert={checkingAccess || undefined} className={checkingAccess ? "hidden" : undefined}>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-sm font-bold text-white">
                DT
              </span>
              <div>
                <p className="text-sm font-bold text-navy-900">{t.shell.brand}</p>
                <p className="text-xs text-slate-500">
                  {session?.mode === "development" ? t.shell.devMode : t.shell.authMode}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={switchLocale}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                aria-label={
                  locale === "ar" ? t.shell.switchToEnglish : t.shell.switchToArabic
                }
              >
                {locale === "ar" ? "English" : "العربية"}
              </button>
              <Link
                href="/ar"
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                {t.shell.viewSite} (AR)
              </Link>
              <Link
                href="/en"
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                {t.shell.viewSite} (EN)
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg bg-navy-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
              >
                {t.shell.signOut}
              </button>
            </div>
          </div>

          <nav aria-label={t.shell.navLabel} className="border-t border-slate-100">
            <ul className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 py-2 sm:px-6">
              {navItems.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                        active
                          ? "bg-brand-100 text-brand-700"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {t.shell[item.labelKey]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>

      {checkingAccess ? (
        <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
              {t.shell.brand}
            </p>
            <p className="mt-3 text-slate-700">{t.shell.checkingAccess}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
