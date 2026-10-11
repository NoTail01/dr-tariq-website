import { NextResponse } from "next/server";

import { guardAdmin } from "@/lib/admin-api";
import { readAllArticles, writeArticles } from "@/lib/articles";
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
  const updated: Article = {
    ...current,
    ...validation.value,
    id: current.id,
    // Keep the original publication date once an article is live.
    publishedAt:
      validation.value.status === "published"
        ? (current.publishedAt ?? validation.value.publishedAt ?? now)
        : null,
    updatedAt: now,
  } as Article;

  articles[index] = updated;
  await writeArticles(articles);

  return NextResponse.json({ ok: true, article: updated });
}

/** DELETE /api/admin/articles/[id] */
export async function DELETE(_request: Request, { params }: Params) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  const articles = await readAllArticles();
  const next = articles.filter((a) => a.id !== id);
  if (next.length === articles.length) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }

  await writeArticles(next);
  return NextResponse.json({ ok: true });
}
