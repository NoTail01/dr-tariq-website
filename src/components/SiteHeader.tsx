"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

import { localizePath, switchLocalePath, type Locale } from "@/i18n/config";

type NavLabels = {
  home: string;
  about: string;
  blog: string;
  book: string;
  skipToContent: string;
  openMenu: string;
  closeMenu: string;
};

type Props = {
  locale: Locale;
  labels: NavLabels;
  brandName: string;
  bookCta: string;
  switchLanguage: string;
  switchLanguageLabel: string;
};

export default function SiteHeader(props: Props) {
  const pathname = usePathname();

  // Remount the header on every navigation: an open mobile menu therefore
  // closes on route change without a state-resetting effect.
  return <SiteHeaderInner key={pathname} {...props} />;
}

function SiteHeaderInner({
  locale,
  labels,
  brandName,
  bookCta,
  switchLanguage,
  switchLanguageLabel,
}: Props) {
  const pathname = usePathname() || `/${locale}`;
  const [open, setOpen] = useState(false);
  const menuId = useId();

  const currentPath = pathname.startsWith(`/${locale}`)
    ? pathname.slice(locale.length + 1) || "/"
    : pathname;

  const navItems: { href: string; path: string; label: string }[] = [
    { href: localizePath(locale, "/"), path: "/", label: labels.home },
    { href: localizePath(locale, "/about"), path: "/about", label: labels.about },
    { href: localizePath(locale, "/blog"), path: "/blog", label: labels.blog },
    { href: localizePath(locale, "/book"), path: "/book", label: labels.book },
  ];

  const targetLocale: Locale = locale === "ar" ? "en" : "ar";

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={localizePath(locale, "/")}
          className="flex items-center gap-2 font-bold text-navy-900 break-words-safe"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-sm font-bold text-white"
          >
            DT
          </span>
          <span className="max-w-[46vw] text-sm leading-tight sm:max-w-none sm:text-base">
            {brandName}
          </span>
        </Link>

        <nav aria-label={labels.skipToContent} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const active =
                item.path === "/"
                  ? currentPath === "/"
                  : currentPath === item.path || currentPath.startsWith(`${item.path}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-brand-100 text-brand-700"
                        : "text-ink-700 hover:bg-brand-50 hover:text-brand-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={switchLocalePath(pathname, targetLocale)}
            hrefLang={targetLocale}
            className="hidden rounded-full border border-brand-300 px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 sm:inline-flex"
            aria-label={switchLanguageLabel}
          >
            {switchLanguage}
          </Link>

          <Link
            href={localizePath(locale, "/book")}
            className="hidden rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:inline-flex"
          >
            {bookCta}
          </Link>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100 text-navy-900 transition-colors hover:bg-brand-50 lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? labels.closeMenu : labels.openMenu}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        id={menuId}
        hidden={!open}
        className="border-t border-brand-100 bg-white lg:hidden"
      >
        <nav aria-label={labels.skipToContent} className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active =
                item.path === "/"
                  ? currentPath === "/"
                  : currentPath === item.path || currentPath.startsWith(`${item.path}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-3 py-3 text-base font-semibold transition-colors ${
                      active ? "bg-brand-100 text-brand-700" : "text-ink-700 hover:bg-brand-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 flex gap-2">
              <Link
                href={switchLocalePath(pathname, targetLocale)}
                hrefLang={targetLocale}
                className="flex-1 rounded-xl border border-brand-300 px-3 py-3 text-center text-sm font-semibold text-brand-700"
                aria-label={switchLanguageLabel}
              >
                {switchLanguage}
              </Link>
              <Link
                href={localizePath(locale, "/book")}
                className="flex-1 rounded-xl bg-brand-600 px-3 py-3 text-center text-sm font-semibold text-white"
              >
                {bookCta}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
