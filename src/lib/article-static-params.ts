import { locales } from "@/i18n/config";
import type { Article } from "./article-types";

/** Internal marker used only to satisfy Cache Components static-param validation. */
export const HELD_ARTICLE_VALIDATION_SLUG = "__held__";

export type ArticleStaticParam = { lang: string; slug: string };

/** True for the internal validation-only param, never for real article content. */
export function isValidationOnlyArticleSlug(slug: string): boolean {
  return slug === HELD_ARTICLE_VALIDATION_SLUG;
}

/**
 * Build static params for every real, known slug so held articles can be
 * prerendered as real 404s. Next.js 16 with Cache Components rejects an empty
 * array, so a no-article store returns one validation-only param. The page
 * handles that marker with notFound(); it is never a published article.
 */
export function buildArticleStaticParams(articles: Article[]): ArticleStaticParam[] {
  const params = articles.flatMap((article) =>
    locales
      .map((lang) => ({ lang, slug: article.slug[lang] }))
      .filter((entry) => typeof entry.slug === "string" && entry.slug.length > 0),
  );

  return params.length > 0 ? params : [{ lang: "en", slug: HELD_ARTICLE_VALIDATION_SLUG }];
}
