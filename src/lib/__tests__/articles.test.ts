import { describe, expect, it } from "vitest";

import { isVisibleArticle } from "@/lib/articles";
import { validateArticleInput } from "@/lib/article-types";
import type { Article, ArticleDraftInput } from "@/lib/article-types";

function article(overrides: Partial<Article> = {}): Article {
  return {
    id: "a1",
    status: "published",
    isDemo: false,
    slug: { ar: "عنوان", en: "title" },
    title: { ar: "عنوان", en: "Title" },
    excerpt: { ar: "مقتطف", en: "Excerpt" },
    body: { ar: "محتوى", en: "Body" },
    category: "guides",
    coverImage: null,
    seo: { title: { ar: "عنوان", en: "Title" }, description: { ar: "وصف", en: "Description" } },
    author: { ar: "د. طارق أبو هويجة", en: "Dr Tariq Abu Hweij" },
    sourceUrl: null,
    publishedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Minimal valid draft payload for the admin API. */
function validDraft(): ArticleDraftInput {
  return {
    status: "published",
    isDemo: false,
    category: "guides",
    slug: { ar: "mithal", en: "sample-post" },
    title: { ar: "عنوان تجريبي", en: "Sample title" },
    excerpt: { ar: "مقتطف قصير", en: "Short excerpt" },
    body: { ar: "نص المحتوى", en: "Body text" },
    coverImage: null,
    seo: { title: { ar: "عنوان", en: "Title" }, description: { ar: "وصف", en: "Description" } },
    author: { ar: "د. طارق أبو هويجة", en: "Dr Tariq Abu Hweij" },
    sourceUrl: null,
    publishedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("isVisibleArticle", () => {
  it("hides drafts", () => {
    expect(isVisibleArticle(article({ status: "draft" }), "development")).toBe(false);
    expect(isVisibleArticle(article({ status: "draft" }), "production")).toBe(false);
  });

  it("shows demo articles in development only", () => {
    const demo = article({ isDemo: true });
    expect(isVisibleArticle(demo, "development")).toBe(true);
    expect(isVisibleArticle(demo, "production")).toBe(false);
  });

  it("shows real published articles everywhere", () => {
    const real = article();
    expect(isVisibleArticle(real, "development")).toBe(true);
    expect(isVisibleArticle(real, "production")).toBe(true);
  });
});

describe("validateArticleInput", () => {
  it("accepts a valid published payload", () => {
    const result = validateArticleInput(validDraft());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("published");
      expect(result.value.category).toBe("guides");
    }
  });

  it("rejects non-object payloads", () => {
    const result = validateArticleInput("nope");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors._).toBeTruthy();
  });

  it("rejects an unknown category", () => {
    const result = validateArticleInput({ ...validDraft(), category: "spam" });
    expect(result).toMatchObject({ ok: false, errors: { category: expect.any(String) } });
  });

  it("requires bilingual content for published articles", () => {
    const payload = validDraft();
    payload.title.en = "";
    payload.body.ar = "";
    const result = validateArticleInput(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors["title.en"]).toBeTruthy();
      expect(result.errors["body.ar"]).toBeTruthy();
    }
  });

  it("validates slug characters", () => {
    const payload = validDraft();
    payload.slug.en = "UPPER CASE slug!";
    const result = validateArticleInput(payload);
    expect(result).toMatchObject({ ok: false, errors: { "slug.en": expect.any(String) } });
  });

  it("accepts drafts with missing content", () => {
    const payload = validDraft();
    payload.status = "draft";
    payload.title.en = "";
    payload.slug.en = "";
    const result = validateArticleInput(payload);
    expect(result.ok).toBe(true);
  });

  it("requires https URLs for sources", () => {
    const payload = validDraft();
    payload.sourceUrl = "ftp://example.com";
    const result = validateArticleInput(payload);
    expect(result).toMatchObject({ ok: false, errors: { sourceUrl: expect.any(String) } });
  });

  it("defaults the author to the doctor when missing", () => {
    const payload = validDraft();
    payload.author = { ar: "", en: "" };
    const result = validateArticleInput(payload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.author.en).toBe("Dr Tariq Abu Hweij");
    }
  });

  it("enforces length limits", () => {
    const payload = validDraft();
    payload.seo.title.en = "x".repeat(71);
    const result = validateArticleInput(payload);
    expect(result).toMatchObject({ ok: false, errors: { "seo.title.en": expect.any(String) } });
  });
});