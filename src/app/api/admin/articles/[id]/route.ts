import { NextResponse } from "next/server";

import { guardAdmin } from "@/lib/admin-api";
import { PersistenceBlockedError } from "@/lib/persistence";
import { deleteArticle, readAllArticles, writeArticles } from "@/lib/articles";
import { validateArticleInput, type Article } from "@/lib/article-types";

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/articles/[id] — single article (authenticated only). */
export async function GET(_request: Request, { params }: Params) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  const articles = await readAllArticles();
  const article = articles.find((a) => a.id === id);
  if (!article) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, article }, { headers: { "Cache-Control": "no-store" } });
}

/** PATCH /api/admin/articles/[id] — update title/body/status/slug/SEO… */
export async function PATCH(request: Request, { params }: Params) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  const articles = await readAllArticles();
  const index = articles.findIndex((a) => a.id === id);
  if (index === -1) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, errors: { _: "Invalid JSON body." } }, { status: 400 });
  }

  const current = articles[index];
  const validation = validateArticleInput({ ...current, ...(payload as object) });
  if (!validation.ok) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Medical review is a separate, server-authoritative decision:
  //  - a status that differs from the stored one is stamped with `now`
  //    (the browser never supplies the review timestamp);
  //  - an unchanged status keeps its existing timestamp;
  //  - "pending" is the absence of a decision, so it carries no timestamp.
  const previousStatus = current.review?.status ?? "pending";
  const nextStatus = validation.value.review.status;
  const review =
    nextStatus === "pending"
      ? { status: "pending" as const, notes: validation.value.review.notes, reviewedAt: null }
      : nextStatus === previousStatus && current.review?.reviewedAt
        ? { ...validation.value.review, reviewedAt: current.review.reviewedAt }
        : { ...validation.value.review, reviewedAt: now };

  const updated: Article = {
    ...current,
    ...validation.value,
    review,
    id: current.id,
    // Keep the original publication date once an article is live.
    publishedAt:
      validation.value.status === "published"
        ? (current.publishedAt ?? validation.value.publishedAt ?? now)
        : null,
    updatedAt: now,
  } as Article;

  articles[index] = updated;
  try {
    await writeArticles(articles);
  } catch (error) {
    if (error instanceof PersistenceBlockedError) {
      return NextResponse.json(
        { ok: false, message: "Persistence is disabled in this environment." },
        { status: 503 },
      );
    }
    throw error;
  }

  return NextResponse.json({ ok: true, article: updated });
}

/** DELETE /api/admin/articles/[id] */
export async function DELETE(_request: Request, { params }: Params) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  const articles = await readAllArticles();
  if (!articles.some((a) => a.id === id)) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }

  try {
    // Backend-aware: a backend requires an explicit row delete, because
    // writeArticles only upserts the rows it is given.
    await deleteArticle(id);
  } catch (error) {
    if (error instanceof PersistenceBlockedError) {
      return NextResponse.json(
        { ok: false, message: "Persistence is disabled in this environment." },
        { status: 503 },
      );
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}
