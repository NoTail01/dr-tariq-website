import { readFileSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

import { assertWritable } from "./persistence";
import { isSupabaseConfigured, supabaseDelete, supabaseSelect, supabaseUpsert } from "./supabase";
import type { Article, ArticleReview } from "./article-types";

const CONTENT_DIR = path.join(process.cwd(), "content");
const ARTICLES_FILE = path.join(CONTENT_DIR, "articles.json");

/** Supabase table name for articles (see supabase/migrations). */
const SUPABASE_TABLE = "articles";

/**
 * Review state for a stored article.
 *
 * A missing or unreadable review block defaults to **pending** — never to
 * "approved". Approval is a decision the doctor has to record; it can never
 * be inferred from the fact that an article is published (or from its age).
 */
function normalizeReview(raw: unknown): ArticleReview {
  const source =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const status =
    source.status === "approved" || source.status === "needs-changes" || source.status === "pending"
      ? source.status
      : "pending";
  return {
    status,
    notes: typeof source.notes === "string" && source.notes ? source.notes : null,
    reviewedAt: typeof source.reviewedAt === "string" && source.reviewedAt ? source.reviewedAt : null,
  };
}

/**
 * Read every article (drafts included). Server-side only.
 *
 * Local reads are synchronous so the public pages can prerender: awaiting an
 * async filesystem read inside a page body streams the route dynamically,
 * which would keep a page on its loading fallback under Cache Components.
 * When Supabase is configured the same function reads the remote table
 * instead — the caller is already async either way.
 */
export async function readAllArticles(): Promise<Article[]> {
  if (isSupabaseConfigured()) {
    try {
      const rows = await supabaseSelect<{ id: string; data: Article }>(
        SUPABASE_TABLE,
        "select=id,data",
      );
      return rows
        .map((row) => (row.data ? (row.data as Article) : null))
        .filter((article): article is Article => Boolean(article))
        .map((article) =>
          article.review ? article : { ...article, review: normalizeReview(undefined) },
        );
    } catch {
      // Documented limitation: on a backend error the site degrades to the
      // last local snapshot. In DEVELOPMENT that is the live store, so the
      // dashboard keeps working offline. In PRODUCTION the local file is a
      // stale build-time snapshot: it can therefore re-show content that has
      // since been unpublished or edited, so it is never used silently —
      // the read throws and the page answers 503 instead of serving stale
      // content. Operators who prefer availability over freshness can set
      // SUPABASE_FALLBACK_TO_LOCAL=1 (documented in docs/SUPABASE.md).
      if (process.env.SUPABASE_FALLBACK_TO_LOCAL === "1" || process.env.NODE_ENV !== "production") {
        return readLocalArticles();
      }
      throw new Error(
        "Supabase read failed and no last-known-good fallback is allowed in production (set SUPABASE_FALLBACK_TO_LOCAL=1 to opt in).",
      );
    }
  }
  return readLocalArticles();
}

/** Articles from the repository `content/articles.json`. */
function readLocalArticles(): Article[] {
  try {
    const raw = readFileSync(ARTICLES_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => {
      const article = entry as Article;
      return article.review ? article : { ...article, review: normalizeReview(undefined) };
    });
  } catch {
    return [];
  }
}

async function writeAll(articles: Article[]): Promise<void> {
  if (isSupabaseConfigured()) {
    // Service-role upsert on the primary key: repeatable and idempotent.
    await supabaseUpsert(
      SUPABASE_TABLE,
      articles.map((article) => ({
        id: article.id,
        slug: article.slug,
        status: article.status,
        is_demo: article.isDemo === true,
        updated_at: article.updatedAt,
        data: article,
      })),
      "id",
    );
    return;
  }
  assertWritable("articles");
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  const tmp = `${ARTICLES_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(articles, null, 2)}\n`, "utf8");
  await fs.rename(tmp, ARTICLES_FILE);
}

export async function writeArticles(articles: Article[]): Promise<void> {
  await writeAll(articles);
}

/**
 * Remove a single article.
 *
 * Needed with a backend because `writeArticles` only upserts the remaining
 * rows: without an explicit delete a removed article would reappear on the
 * next read.
 */
export async function deleteArticle(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabaseDelete(SUPABASE_TABLE, `id=eq.${encodeURIComponent(id)}`);
    return;
  }
  assertWritable("articles");
  const remaining = readLocalArticles().filter((article) => article.id !== id);
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  const tmp = `${ARTICLES_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(remaining, null, 2)}\n`, "utf8");
  await fs.rename(tmp, ARTICLES_FILE);
}

export async function getArticleById(id: string): Promise<Article | null> {
  const all = await readAllArticles();
  return all.find((a) => a.id === id) ?? null;
}

/**
 * Articles a visitor is allowed to see.
 *
 * - drafts are never returned;
 * - demo/template articles are only visible while the site runs in
 *   development mode, and are excluded from indexing everywhere.
 */
export function isVisibleArticle(article: Article, mode: "development" | "production"): boolean {
  if (article.status !== "published") return false;
  if (article.isDemo && mode === "production") return false;
  return true;
}

export async function getVisibleArticles(mode: "development" | "production"): Promise<Article[]> {
  const all = await readAllArticles();
  return all
    .filter((a) => isVisibleArticle(a, mode))
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

export async function findVisibleArticle(
  locale: "ar" | "en",
  slug: string,
  mode: "development" | "production",
): Promise<Article | null> {
  const visible = await getVisibleArticles(mode);
  return visible.find((a) => a.slug[locale] === slug) ?? null;
}
