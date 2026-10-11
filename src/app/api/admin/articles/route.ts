import { NextResponse } from "next/server";

import { guardAdmin } from "@/lib/admin-api";
import { readAllArticles, writeArticles } from "@/lib/articles";
import { makeId, validateArticleInput, type Article } from "@/lib/article-types";

/** GET /api/admin/articles — every article, drafts included (authenticated only). */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;

  const articles = await readAllArticles();
  return NextResponse.json(
    { ok: true, articles },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** POST /api/admin/articles — create an article after server-side validation. */
export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, errors: { _: "Invalid JSON body." } }, { status: 400 });
  }

  const validation = validateArticleInput(payload);
  if (!validation.ok) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  const now = new Date().toISOString();
  const article: Article = {
    ...validation.value,
    id: makeId(),
    publishedAt:
      validation.value.status === "published"
        ? (validation.value.publishedAt ?? now)
        : null,
    updatedAt: now,
  } as Article;

  const existing = await readAllArticles();
  await writeArticles([...existing, article]);

  return NextResponse.json({ ok: true, article }, { status: 201 });
}
