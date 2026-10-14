"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import BrandLogo from "@/components/BrandLogo";
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
  /** Logo emblem asset for light backgrounds. */
  logoSrc: string;
  /** Alt text for the emblem (already localized). */
  logoAlt: string;
  bookCta: string;
  switchLanguage: string;
  switchLanguageLabel: string;
  /** Shorter CTA label used inside the mobile menu. */
  bookCtaShort?: string;
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
  logoSrc,
  logoAlt,
  bookCta,
  bookCtaShort,
  switchLanguage,
  switchLanguageLabel,
}: Props) {
  const pathname = usePathname() || `/${locale}`;
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const currentPath = pathname.startsWith(`/${locale}`)
    ? pathname.slice(locale.length + 1) || "/"
    : pathname;

  const navItems: { href: string; path: string; label: string }[] = [
    { href: localizePath(locale, "/"), path: "/", label: labels.home },
    { href: localizePath(locale, "/about"), path: "/about", label: labels.about },
    { href: localizePath(locale, "/blog"), path: "/blog", label: labels.blog },
    { href: localizePath(locale, "/book"), path: "/book", label: labels.book },
  ];

  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath === path || currentPath.startsWith(`${path}/`);

  const targetLocale: Locale = locale === "ar" ? "en" : "ar";

  // Close on Escape and return focus to the trigger. The panel is marked
  // `inert` while closed so its links are never reachable by keyboard or
  // pointer while hidden.
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    // Keep Tab inside the open panel: background content must not be
    // reachable while the menu owns the screen.
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>("a[href], button");
    focusable[0]?.focus();
    const onTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener("keydown", onTab);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      panel.removeEventListener("keydown", onTab);
    };
  }, [open, close]);

  // A resize to the desktop layout must not leave the menu open.
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [open]);

  // Lock background scrolling while the menu is open so the page behind
  // cannot be scrolled out from under it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link
          href={localizePath(locale, "/")}
          className="flex min-w-0 items-center gap-2.5 font-bold text-navy-900 break-words-safe"
        >
          <BrandLogo
            name={brandName}
            emblemSrc={logoSrc}
            emblemAlt={logoAlt}
            compact
          />
        </Link>

        <nav aria-label={labels.skipToContent} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
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

        <div className="ms-auto flex shrink-0 items-center gap-2">
          {/* Language switch stays visible on phones: switching language is
              a primary need for a bilingual clinic audience. */}
          <Link
            href={switchLocalePath(pathname, targetLocale)}
            hrefLang={targetLocale}
            className="inline-flex h-10 items-center rounded-full border border-brand-300 px-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            aria-label={switchLanguageLabel}
          >
            {switchLanguage}
          </Link>

          <Link
            href={localizePath(locale, "/book")}
            className="hidden h-10 items-center rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:inline-flex"
          >
            {bookCtaShort ?? bookCta}
          </Link>

          <button
            ref={triggerRef}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100 text-navy-900 transition-colors hover:bg-brand-50 lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => (open ? close() : setOpen(true))}
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
        ref={panelRef}
        id={menuId}
        hidden={!open}
        inert={!open}
        className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-brand-100 bg-white lg:hidden"
      >
        <nav aria-label={labels.skipToContent} className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-12 items-center rounded-xl px-3 text-base font-semibold transition-colors ${
                      active ? "bg-brand-100 text-brand-700" : "text-ink-700 hover:bg-brand-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2">
              <Link
                href={localizePath(locale, "/book")}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-3 text-base font-semibold text-white transition-colors hover:bg-brand-700"
              >
                {bookCtaShort ?? bookCta}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
