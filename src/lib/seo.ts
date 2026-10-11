import type { Metadata } from "next";

import { localizePath, localeInfo, type Locale } from "@/i18n/config";
import { SITE_URL } from "@/lib/site";

type PageMetadataInput = {
  locale: Locale;
  /** Locale-independent path, e.g. "/blog/my-post" or "/" */
  path: string;
  title: string;
  description: string;
  /** Hide from search engines (demo content, previews, errors). */
  noindex?: boolean;
  ogType?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  image?: string;
};

/**
 * Unique titles, descriptions, canonical URLs and hreflang alternates
 * for every public page in both languages.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  noindex = false,
  ogType = "website",
  publishedTime,
  modifiedTime,
  image,
}: PageMetadataInput): Metadata {
  const url = `${SITE_URL}${localizePath(locale, path)}`;
  const alternate = (target: Locale) => `${SITE_URL}${localizePath(target, path)}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ar: alternate("ar"),
        en: alternate("en"),
        // Arabic is the default locale, so it is the x-default target.
        "x-default": alternate("ar"),
      },
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url,
      siteName: title,
      locale: localeInfo[locale].ogLocale,
      type: ogType,
      ...(image ? { images: [{ url: image }] } : {}),
      ...(ogType === "article" && publishedTime ? { publishedTime } : {}),
      ...(ogType === "article" && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/** Language + direction attributes for the document. */
export function htmlAttributes(locale: Locale) {
  return {
    lang: localeInfo[locale].htmlLang,
    dir: localeInfo[locale].dir,
  };
}
