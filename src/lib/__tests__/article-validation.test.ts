import { describe, expect, it } from "vitest";

import { validateArticleInput } from "@/lib/article-types";

const complete = {
  status: "published" as const,
  isDemo: false,
  category: "guides",
  slug: { ar: "qa-article", en: "qa-article" },
  title: { ar: "مقال", en: "Article" },
  excerpt: { ar: "مقتطف", en: "Excerpt" },
  body: { ar: "متن", en: "Body" },
  author: { ar: "فريق الجودة", en: "QA team" },
  seo: { title: { ar: "", en: "" }, description: { ar: "", en: "" } },
  sourceUrl: null,
  publishedAt: null,
  coverImage: null,
};

describe("validateArticleInput", () => {
  it("accepts a complete bilingual article", () => {
    const result = validateArticleInput(complete);
    expect(result.ok).toBe(true);
  });

  it("rejects publishing when a locale lacks a slug, title, body or excerpt", () => {
    for (const field of ["slug", "title", "body", "excerpt"] as const) {
      const missing = { ...complete, [field]: { ar: "قيمة", en: "" } };
      const result = validateArticleInput(missing);
      expect(result.ok, `${field}.en should be required when publishing`).toBe(false);
      if (!result.ok) expect(result.errors[`${field}.en`]).toBeTruthy();
    }
  });

  it("allows a locale to be incomplete while the article is a draft", () => {
    const draft = {
      ...complete,
      status: "draft" as const,
      slug: { ar: "qa-article", en: "" },
      title: { ar: "مقال", en: "" },
      body: { ar: "متن", en: "" },
      excerpt: { ar: "مقتطف", en: "" },
    };
    expect(validateArticleInput(draft).ok).toBe(true);
  });

  it("rejects slugs outside the lowercase-hyphen pattern", () => {
    for (const slug of ["Bad Slug", "UPPER", "sl_ug", "slug!"]) {
      const result = validateArticleInput({ ...complete, slug: { ar: slug, en: slug } });
      expect(result.ok, `slug "${slug}" should be rejected`).toBe(false);
    }
  });

  it("accepts hyphenated lowercase slugs", () => {
    const result = validateArticleInput({
      ...complete,
      slug: { ar: "kidney-health-101", en: "kidney-health-101" },
    });
    expect(result.ok).toBe(true);
  });

  it("requires alt text in both languages when a cover image is set", () => {
    const result = validateArticleInput({
      ...complete,
      coverImage: { url: "/uploads/x.png", alt: { ar: "صورة", en: "" } },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors["coverImage.alt"]).toBeTruthy();
  });

  it("rejects a source URL without a scheme", () => {
    const result = validateArticleInput({ ...complete, sourceUrl: "example.com/article" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.sourceUrl).toBeTruthy();
  });
});
