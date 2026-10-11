import Link from "next/link";
import { lang as langParam } from "next/root-params";

import { Section } from "@/components/Layout";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, localizePath } from "@/i18n/config";

/**
 * Localized 404 for everything under /ar and /en.
 * Rendered when `notFound()` is called (unknown locale, missing article, ...).
 * `not-found` receives no props, so the locale comes from `next/root-params`.
 */
export default async function NotFound() {
  const currentLang = await langParam();
  const locale = currentLang && isLocale(currentLang) ? currentLang : "en";
  const dict = await getDictionary(locale);
  const other: "ar" | "en" = locale === "ar" ? "en" : "ar";

  return (
    <Section tone="white">
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-sm font-bold tracking-widest text-brand-600 uppercase">404</p>
        <h1 className="mt-3 text-3xl font-bold text-navy-900 break-words-safe">
          {dict.common.notFoundTitle}
        </h1>
        <p className="mt-4 leading-relaxed text-ink-500 break-words-safe">
          {dict.common.notFoundText}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={localizePath(locale, "/")}
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {dict.common.goHome}
          </Link>
          <Link
            href={localizePath(other, "/")}
            hrefLang={other}
            className="rounded-full border border-brand-300 px-6 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            {dict.nav.switchLanguage}
          </Link>
        </div>
      </div>
    </Section>
  );
}
