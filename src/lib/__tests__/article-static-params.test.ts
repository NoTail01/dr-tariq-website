import { describe, expect, it } from "vitest";

import {
  buildArticleStaticParams,
  HELD_ARTICLE_VALIDATION_SLUG,
  isValidationOnlyArticleSlug,
} from "@/lib/article-static-params";
import { isVisibleArticle } from "@/lib/articles";
import type { Article } from "@/lib/article-types";

function article(overrides: Partial<Article> = {}): Article {
  return {
    id: "a1",
    status: "published",
    isDemo: false,
    slug: { ar: "????", en: "article" },
    title: { ar: "?????", en: "Title" },
    excerpt: { ar: "?????", en: "Excerpt" },
    body: { ar: "?????", en: "Body" },
    category: "guides",
    coverImage: null,
    seo: {
      title: { ar: "?????", en: "Title" },
      description: { ar: "???", en: "Description" },
    },
    author: { ar: "?. ???? ??? ????", en: "Dr Tariq Abu Hweij" },
    sourceUrl: null,
    review: { status: "approved", notes: null, reviewedAt: null },
    publishedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildArticleStaticParams", () => {
  it("returns one validation-only param when there are no articles", () => {
    expect(buildArticleStaticParams([])).toEqual([
      { lang: "en", slug: HELD_ARTICLE_VALIDATION_SLUG },
    ]);
  });

  it("uses the documented internal slug shape", () => {
    const [param] = buildArticleStaticParams([]);
    expect(param.lang).toBe("en");
    expect(param.slug).toBe("__held__");
    expect(isValidationOnlyArticleSlug(param.slug)).toBe(true);
    expect(isValidationOnlyArticleSlug("real-article")).toBe(false);
  });

  it("preserves real slugs for held articles instead of the placeholder", () => {
    const held = [
      article({
        id: "pending",
        status: "draft",
        review: { status: "pending", notes: null, reviewedAt: null },
        slug: { ar: "?????", en: "pending-article" },
      }),
      article({
        id: "demo",
        isDemo: true,
        review: { status: "pending", notes: null, reviewedAt: null },
        slug: { ar: "???", en: "demo-article" },
      }),
    ];

    const params = buildArticleStaticParams(held);
    expect(params).toEqual(
      expect.arrayContaining([
        { lang: "ar", slug: "?????" },
        { lang: "en", slug: "pending-article" },
        { lang: "ar", slug: "???" },
        { lang: "en", slug: "demo-article" },
      ]),
    );
    expect(params).toHaveLength(4);
    expect(params.some((param) => param.slug === HELD_ARTICLE_VALIDATION_SLUG)).toBe(false);
  });

  it("still hides pending and demo articles from production readers", () => {
    const pending = article({
      id: "pending",
      review: { status: "pending", notes: null, reviewedAt: null },
    });
    const demo = article({ id: "demo", isDemo: true });
    const approved = article({ id: "approved" });
    const visible = [pending, demo, approved].filter((entry) =>
      isVisibleArticle(entry, "production"),
    );

    expect(visible.map((entry) => entry.id)).toEqual(["approved"]);
    expect(visible.some((entry) => entry.isDemo)).toBe(false);
    expect(visible.some((entry) => entry.review.status !== "approved")).toBe(false);
  });
});
