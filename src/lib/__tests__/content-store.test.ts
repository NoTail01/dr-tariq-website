import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { isVisibleArticle } from "@/lib/articles";
import { validateArticleInput } from "@/lib/article-types";
import type { Article } from "@/lib/article-types";

const STORE = path.join(process.cwd(), "content", "articles.json");

function readStore(): Article[] {
  const parsed = JSON.parse(readFileSync(STORE, "utf8")) as unknown;
  if (!Array.isArray(parsed)) throw new Error("content/articles.json must be an array");
  return parsed as Article[];
}

/**
 * Regression guard for the shipped content store.
 *
 * Every stored article must be accepted by the same validation the admin API
 * applies before a write. An article that fails it (for example one stored
 * without a `category`) could never be edited, reviewed or re-published from
 * the dashboard again — the API would answer 400 on every PATCH.
 */
describe("content/articles.json", () => {
  const articles = readStore();

  it("is a non-empty array of articles", () => {
    expect(articles.length).toBeGreaterThan(0);
  });

  it("every stored article passes the admin API validation", () => {
    for (const article of articles) {
      const result = validateArticleInput(article);
      expect(result.ok, `${article.slug?.en ?? article.id} must be re-writable`).toBe(true);
      if (result.ok) {
        // A category is mandatory: without it the store cannot round-trip.
        expect(result.value.category).toBeTruthy();
        expect(article.category).toBeTruthy();
        expect(article.coverImage === null || typeof article.coverImage === "object").toBe(true);
      }
    }
  });

  it("keeps the 10 medical articles published in both languages", () => {
    const real = articles.filter((a) => a.isDemo !== true);
    expect(real).toHaveLength(10);
    for (const article of real) {
      expect(article.status).toBe("published");
      expect(article.slug.ar).toBeTruthy();
      expect(article.slug.en).toBeTruthy();
      expect(article.title.ar).toBeTruthy();
      expect(article.title.en).toBeTruthy();
      expect(article.excerpt.ar).toBeTruthy();
      expect(article.excerpt.en).toBeTruthy();
      expect(article.body.ar.length).toBeGreaterThan(400);
      expect(article.body.en.length).toBeGreaterThan(400);
      // SEO metadata and a traceable source are required for publication.
      expect(article.seo.title.ar).toBeTruthy();
      expect(article.seo.title.en).toBeTruthy();
      expect(article.seo.description.ar).toBeTruthy();
      expect(article.seo.description.en).toBeTruthy();
      expect(article.sourceUrl).toMatch(/^https?:\/\//);
    }
  });

  it("never marks an article doctor-approved without a recorded review", () => {
    for (const article of articles) {
      if (article.review?.status === "approved") {
        // Approval must always carry the timestamp of that decision.
        expect(article.review.reviewedAt).toBeTruthy();
      }
    }
  });

  it("keeps demo templates out of the production site", () => {
    for (const article of articles.filter((a) => a.isDemo === true)) {
      expect(isVisibleArticle(article, "production")).toBe(false);
      expect(article.category).toBe("demo");
    }
  });

  it("keeps the medical review state separate from publication", () => {
    for (const article of articles.filter((a) => a.isDemo !== true)) {
      // Published content still awaits the doctor's decision until one is
      // recorded — publication alone must never imply medical approval.
      expect(article.review).toBeTruthy();
      expect(["pending", "approved", "needs-changes"]).toContain(article.review.status);
    }
  });

  it("resolves every internal article link to a known slug", () => {
    for (const article of articles) {
      for (const locale of ["ar", "en"] as const) {
        const links = [...article.body[locale].matchAll(/\]\((\/[^)]+)\)/g)].map((m) => m[1]);
        for (const link of links) {
          const match = link.match(/^\/(?:ar|en)\/blog\/([^/]+)$/);
          if (!match) continue; // /book and other internal routes
          const slug = match[1];
          const target = articles.find((a) => a.slug[locale] === slug);
          expect(target, `${article.slug.en} links to unknown slug "${slug}"`).toBeTruthy();
          expect(isVisibleArticle(target!, "production")).toBe(true);
        }
      }
    }
  });
});
