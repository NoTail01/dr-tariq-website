import type { Metadata } from "next";

import { localizePath, localeInfo, locales, type Locale } from "@/i18n/config";
import { defaultSettings } from "@/lib/settings";
import { isIndexableSite, SITE_URL } from "@/lib/site";

const DEFAULT_OG_IMAGE = "/images/dr-tariq-og.webp";
const DEFAULT_OG_WIDTH = 1200;
const DEFAULT_OG_HEIGHT = 630;
const MAX_TITLE_LENGTH = 65;

type ImageInput =
  | string
  | { url: string; width?: number; height?: number; alt?: string };

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
  image?: ImageInput;
  imageAlt?: string;
  /**
   * Per-locale path overrides. A null value means the page does not exist in
   * that language, so its hreflang alternate is omitted instead of pointing
   * at a 404. Used by articles whose two language versions have distinct
   * slugs or are only published in one language.
   */
  alternatePaths?: Partial<Record<Locale, string | null>>;
};

function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : SITE_URL + path;
}

function defaultImageAlt(locale: Locale): string {
  return defaultSettings.siteName[locale];
}

function normalizeImage(image: ImageInput | undefined, locale: Locale) {
  const fallbackAlt = defaultImageAlt(locale);
  if (!image) {
    return {
      url: absoluteUrl(DEFAULT_OG_IMAGE),
      width: DEFAULT_OG_WIDTH,
      height: DEFAULT_OG_HEIGHT,
      alt: fallbackAlt,
    };
  }
  if (typeof image === "string") {
    return {
      url: absoluteUrl(image),
      width: undefined,
      height: undefined,
      alt: fallbackAlt,
    };
  }
  return {
    url: absoluteUrl(image.url),
    width: image.width,
    height: image.height,
    alt: image.alt ?? fallbackAlt,
  };
}

/**
 * Appends the brand only when the result stays inside a useful title length.
 * Long article titles are kept intact so search results never truncate them
 * mid-word; the page title already identifies the topic.
 */
function pageTitle(locale: Locale, title: string): string {
  const brand = defaultSettings.siteName[locale];
  if (title.includes(brand)) return title;
  const candidate = title + " | " + brand;
  return candidate.length <= MAX_TITLE_LENGTH ? candidate : title;
}

/**
 * Unique titles, descriptions, canonical URLs, hreflang alternates and
 * social images for every public page in both languages.
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
  imageAlt,
  alternatePaths,
}: PageMetadataInput): Metadata {
  const url = SITE_URL + localizePath(locale, path);
  const socialImage = normalizeImage(image, locale);
  if (imageAlt) socialImage.alt = imageAlt;
  const resolvedTitle = pageTitle(locale, title);

  const languages: Record<string, string> = {};
  for (const target of locales) {
    const targetPath =
      alternatePaths && target in alternatePaths ? alternatePaths[target] : path;
    if (targetPath === null || targetPath === undefined) continue;
    languages[target] = SITE_URL + localizePath(target, targetPath);
  }
  // Arabic is the default locale, so it is the x-default target.
  if (languages.ar) languages["x-default"] = languages.ar;
  else if (languages.en) languages["x-default"] = languages.en;

  return {
    title: { absolute: resolvedTitle },
    description,
    alternates: {
      canonical: url,
      languages,
    },
    robots: noindex || !isIndexableSite()
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title: resolvedTitle,
      description,
      url,
      siteName: defaultSettings.siteName[locale],
      locale: localeInfo[locale].ogLocale,
      type: ogType,
      images: [socialImage],
      ...(ogType === "article" && publishedTime ? { publishedTime } : {}),
      ...(ogType === "article" && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      // Passing an object (not a bare URL) makes Next emit twitter:image:alt,
      // so the card has a meaningful description in screen readers too.
      images: [
        {
          url: socialImage.url,
          alt: socialImage.alt,
          ...(socialImage.width ? { width: socialImage.width } : {}),
          ...(socialImage.height ? { height: socialImage.height } : {}),
        },
      ],
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
