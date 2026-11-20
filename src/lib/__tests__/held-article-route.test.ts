import { describe, expect, it, vi } from "vitest";

const { findPublicVisibleArticle, readPublicArticles } = vi.hoisted(() => ({
  findPublicVisibleArticle: vi.fn(async () => null),
  readPublicArticles: vi.fn(async () => []),
}));

vi.mock("@/lib/articles", () => ({ findPublicVisibleArticle, readPublicArticles }));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

import ArticlePage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/[lang]/blog/[slug]/page";
import { HELD_ARTICLE_VALIDATION_SLUG } from "@/lib/article-static-params";

describe("held article validation route", () => {
  it("keeps generateStaticParams non-empty without article content", async () => {
    await expect(generateStaticParams()).resolves.toEqual([
      { lang: "en", slug: HELD_ARTICLE_VALIDATION_SLUG },
    ]);
  });

  it("marks the validation-only route noindex without looking up an article", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: "en", slug: HELD_ARTICLE_VALIDATION_SLUG }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(findPublicVisibleArticle).not.toHaveBeenCalled();
  });

  it("renders the validation-only route as notFound", async () => {
    await expect(
      ArticlePage({
        params: Promise.resolve({ lang: "en", slug: HELD_ARTICLE_VALIDATION_SLUG }),
      } as never),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
