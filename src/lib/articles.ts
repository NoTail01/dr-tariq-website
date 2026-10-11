import { readFileSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { Article } from "./article-types";

const CONTENT_DIR = path.join(process.cwd(), "content");
const ARTICLES_FILE = path.join(CONTENT_DIR, "articles.json");

/**
 * Read every article (drafts included). Server-side only.
 *
 * Reads are synchronous so the public pages can prerender: awaiting an async
 * filesystem read inside a page body streams the route dynamically, which
 * would keep a page on its loading fallback under Cache Components.
 * Writes stay asynchronous (see `writeArticles`).
 */
export async function readAllArticles(): Promise<Article[]> {
  try {
    const raw = readFileSync(ARTICLES_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Article[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(articles: Article[]): Promise<void> {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  const tmp = `${ARTICLES_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(articles, null, 2)}\n`, "utf8");
  await fs.rename(tmp, ARTICLES_FILE);
}

export async function writeArticles(articles: Article[]): Promise<void> {
  await writeAll(articles);
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
