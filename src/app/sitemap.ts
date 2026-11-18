import type { MetadataRoute } from "next";

import { getVisibleArticles } from "@/lib/articles";
import { readSettings } from "@/lib/settings";
import { SITE_URL, getSiteMode } from "@/lib/site";

/**
 * Sitemap: public pages in both languages plus genuinely published,
 * medically approved articles. Demo, draft and pending-review articles are
 * never included.
 *
 * `lastModified` is derived from stored content timestamps rather than the
 * request time, so the sitemap stays stable between crawls.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const mode = getSiteMode();
  const settings = await readSettings();
  const settingsStamp = new Date(settings.updatedAt);
  const pages = ["/", "/about", "/blog", "/book"];

  const articles = await getVisibleArticles(mode);
  const approved = articles.filter(
    (article) =>
      !article.isDemo &&
      article.publishedAt &&
      article.review.status === "approved",
  );

  const latestArticleStamp = approved.reduce<Date | null>((latest, article) => {
    const stamp = new Date(article.updatedAt);
    if (Number.isNaN(stamp.getTime())) return latest;
    return !latest || stamp > latest ? stamp : latest;
  }, null);

  const staticEntries: MetadataRoute.Sitemap = pages.flatMap((path) => {
    const localized = (["ar", "en"] as const).map(
      (locale) => `${SITE_URL}/${locale}${path === "/" ? "" : path}`,
    );
    const languages: Record<string, string> = {
      ar: localized[0],
      en: localized[1],
      "x-default": localized[0],
    };
    const lastModified =
      path === "/blog" && latestArticleStamp && latestArticleStamp > settingsStamp
        ? latestArticleStamp
        : settingsStamp;

    return localized.map((url) => ({
      url,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.8,
      alternates: { languages },
    }));
  });

  const articleEntries: MetadataRoute.Sitemap = approved.flatMap((article) => {
    const localized = (["ar", "en"] as const).filter(
      (locale) => article.slug[locale].length > 0,
    );
    if (localized.length === 0) return [];

    const languages: Record<string, string> = {};
    for (const locale of localized) {
      languages[locale] = `${SITE_URL}/${locale}/blog/${article.slug[locale]}`;
    }
    languages["x-default"] = languages.ar ?? languages.en;

    return localized.map((locale) => ({
      url: languages[locale],
      lastModified: new Date(article.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: { languages },
    }));
  });

  return [...staticEntries, ...articleEntries];
}
