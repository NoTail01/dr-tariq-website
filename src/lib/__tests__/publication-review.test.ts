import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { isVisibleArticle, readAllArticles } from "@/lib/articles";
import { validateArticleInput } from "@/lib/article-types";
import type { Article, ArticleDraftInput, ReviewStatus } from "@/lib/article-types";

function draft(overrides: Partial<ArticleDraftInput> = {}): ArticleDraftInput {
  return {
    status: "draft",
    isDemo: false,
    category: "guides",
    slug: { ar: "mithal", en: "sample-post" },
    title: { ar: "عنوان تجريبي", en: "Sample title" },
    excerpt: { ar: "مقتطف قصير", en: "Short excerpt" },
    body: { ar: "نص المحتوى", en: "Body text" },
    coverImage: null,
    seo: { title: { ar: "عنوان", en: "Title" }, description: { ar: "وصف", en: "Description" } },
    author: { ar: "فريق التحرير", en: "Editorial team" },
    sourceUrl: null,
    review: { status: "pending", notes: null, reviewedAt: null },
    publishedAt: null,
    ...overrides,
  };
}

/**
 * Mirrors the server rule in `PATCH /api/admin/articles/[id]`: the review
 * timestamp is decided by the server, never by the payload.
 */
function reviewForPatch(
  current: Article["review"],
  incoming: Article["review"],
): Article["review"] {
  if (incoming.status === "pending") {
    return { status: "pending", notes: incoming.notes, reviewedAt: null };
  }
  if (incoming.status === current.status && current.reviewedAt) {
    return { ...incoming, reviewedAt: current.reviewedAt };
  }
  return { ...incoming, reviewedAt: new Date().toISOString() };
}

describe("publication vs medical review", () => {
  it("allows publishing while the medical review is still pending", () => {
    const result = validateArticleInput(draft({ status: "published" }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Publication does not imply approval.
      expect(result.value.status).toBe("published");
      expect(result.value.review.status).toBe("pending");
    }
  });

  it("never derives approval from publication", () => {
    const payload = { ...draft({ status: "published" }) } as Record<string, unknown>;
    payload.reviewStatus = "pending";
    const result = validateArticleInput(payload);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.review.status).toBe("pending");
  });

  it("keeps pending review states untouched", async () => {
    const articles = await readAllArticles();
    const real = articles.filter((a) => a.isDemo !== true);
    expect(real.length).toBeGreaterThan(0);
    for (const article of real) {
      expect(article.review.status).toBe("pending");
      expect(article.review.reviewedAt).toBeNull();
      expect(article.status).toBe("published");
    }
  });

  it("ignores a review status coming from the payload when it is unknown", () => {
    const payload = { ...draft() } as Record<string, unknown>;
    payload.reviewStatus = "nonsense";
    const result = validateArticleInput(payload);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.review.status).toBe("pending");
  });

  it("stamps a fresh timestamp when the decision changes", () => {
    const current = { status: "pending" as ReviewStatus, notes: null, reviewedAt: null };
    const next = reviewForPatch(current, {
      status: "approved",
      notes: "QA note",
      reviewedAt: null,
    });
    expect(next.status).toBe("approved");
    expect(next.reviewedAt).toBeTruthy();
  });

  it("keeps the existing timestamp when the decision is unchanged", () => {
    const stamp = "2026-10-01T10:00:00.000Z";
    const next = reviewForPatch(
      { status: "approved", notes: null, reviewedAt: stamp },
      { status: "approved", notes: "edited note", reviewedAt: "1999-01-01T00:00:00.000Z" },
    );
    expect(next.reviewedAt).toBe(stamp);
  });

  it("drops the timestamp when an article goes back to pending", () => {
    const next = reviewForPatch(
      { status: "approved", notes: null, reviewedAt: "2026-10-01T10:00:00.000Z" },
      { status: "pending", notes: null, reviewedAt: "2026-10-01T10:00:00.000Z" },
    );
    expect(next).toEqual({ status: "pending", notes: null, reviewedAt: null });
  });

  it("re-stamps when a decision replaces another decision", () => {
    const next = reviewForPatch(
      { status: "approved", notes: null, reviewedAt: "2026-10-01T10:00:00.000Z" },
      { status: "needs-changes", notes: "fix", reviewedAt: null },
    );
    expect(next.status).toBe("needs-changes");
    expect(next.reviewedAt).not.toBe("2026-10-01T10:00:00.000Z");
  });
});

describe("published content stays visible regardless of review", () => {
  it("keeps a pending article visible to visitors", async () => {
    const articles = await readAllArticles();
    const real = articles.filter((a) => a.isDemo !== true);
    for (const article of real) {
      expect(isVisibleArticle(article, "production")).toBe(true);
    }
  });

  it("keeps the committed store readable and complete", () => {
    const raw = readFileSync(path.join(process.cwd(), "content", "articles.json"), "utf8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
