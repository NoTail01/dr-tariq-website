export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];

/** Arabic is the default locale and uses RTL layout. */
export const defaultLocale: Locale = "ar";

export const localeInfo: Record<Locale, { dir: "rtl" | "ltr"; htmlLang: string; ogLocale: string }> = {
  ar: { dir: "rtl", htmlLang: "ar", ogLocale: "ar_AR" },
  en: { dir: "ltr", htmlLang: "en", ogLocale: "en_US" },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function isRtl(locale: Locale): boolean {
  return localeInfo[locale].dir === "rtl";
}

/**
 * Prefix a site path with a locale segment.
 * localizePath("ar", "/")   -> "/ar"
 * localizePath("en", "/blog") -> "/en/blog"
 */
export function localizePath(locale: Locale, path: string): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}

/**
 * Split a pathname into its locale and locale-independent path.
 * Returns locale null when the path has no supported locale prefix.
 */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const [, first, ...rest] = normalized.split("/");

  if (isLocale(first)) {
    return { locale: first, path: `/${rest.join("/")}`.replace(/\/+$/, "") || "/" };
  }
  return { locale: null, path: normalized || "/" };
}

/**
 * Build the equivalent path in another locale so language switching
 * always lands on the same page.
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  const { path } = splitLocale(pathname);
  return localizePath(target, path);
}
