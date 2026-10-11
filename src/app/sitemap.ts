import type { MetadataRoute } from "next";

import { getVisibleArticles } from "@/lib/articles";
import { SITE_URL, getSiteMode } from "@/lib/site";

/**
 * Sitemap: public pages in both languages plus genuinely published articles.
 * Demo/template and draft articles are never included.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const mode = getSiteMode();
  const pages = ["/", "/about", "/blog", "/book"];

  const staticEntries: MetadataRoute.Sitemap = pages.flatMap((path) =>
    (["ar", "en"] as const).map((locale) => ({
      url: `${SITE_URL}/${locale}${path === "/" ? "" : path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.8,
      alternates: {
        languages: {
          ar: `${SITE_URL}/ar${path === "/" ? "" : path}`,
          en: `${SITE_URL}/en${path === "/" ? "" : path}`,
        },
      },
    })),
  );

  const articles = await getVisibleArticles(mode);
  const articleEntries: MetadataRoute.Sitemap = articles
    .filter((article) => !article.isDemo && article.publishedAt)
    .flatMap((article) =>
      (["ar", "en"] as const).map((locale) => ({
        url: `${SITE_URL}/${locale}/blog/${article.slug[locale]}`,
        lastModified: new Date(article.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.6,
        alternates: {
          languages: {
            ar: `${SITE_URL}/ar/blog/${article.slug.ar}`,
            en: `${SITE_URL}/en/blog/${article.slug.en}`,
          },
        },
      })),
    );

  return [...staticEntries, ...articleEntries];
}
