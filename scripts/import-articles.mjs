/**
 * Repeatable import of the 10 doctor-review articles into the local
 * content store.
 *
 * Safety rules:
 *  - a timestamped backup of `content/articles.json` is written to
 *    `.local-backups/` (gitignored) before any change;
 *  - articles are matched by their stable slug, never recreated, so a
 *    second run updates instead of duplicating;
 *  - only these seeded articles are touched — demo and unrelated
 *    articles are left exactly as they are;
 *  - existing ids, previous review decisions and previous publication
 *    dates are preserved; nothing is fabricated.
 *
 * Usage: node scripts/import-articles.mjs [--dry-run]
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { SEED_ARTICLES, withClosing } from "./seed-articles-part1.mjs";
import {
  SEED_ARTICLES_PART2,
  closingBlock,
  withClosing2,
} from "./seed-articles-part2.mjs";

const ROOT = process.cwd();
const ARTICLES_FILE = path.join(ROOT, "content", "articles.json");
const BACKUP_DIR = path.join(ROOT, ".local-backups");

const CATEGORIES = ["demo", "guides", "news"];

function isArticleCategory(value) {
  return typeof value === "string" && CATEGORIES.includes(value);
}

/** Author credit is the site editorial team — never the doctor by default. */
const AUTHOR = {
  ar: "فريق تحرير موقع الدكتور طارق أبو حويج",
  en: "Dr Tariq Abu Hweij website editorial team",
};

const seeds = [
  ...SEED_ARTICLES.map(withClosing),
  ...SEED_ARTICLES_PART2.map((article) => withClosing2(article, closingBlock)),
];

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const raw = await readFile(ARTICLES_FILE, "utf8");
  const existing = JSON.parse(raw);

  if (!Array.isArray(existing)) {
    throw new Error("content/articles.json is not an array — aborting to protect data.");
  }

  // 1. Backup before any change.
  await mkdir(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `articles-${stamp}.json`;
  await writeFile(path.join(BACKUP_DIR, backupName), raw, "utf8");
  console.log(`backup written: .local-backups/${backupName}`);

  // 2. Merge by stable slug.
  const now = new Date().toISOString();
  const bySlug = new Map();
  for (const article of existing) {
    for (const slug of [article.slug?.ar, article.slug?.en]) {
      if (slug) bySlug.set(slug, article);
    }
  }

  let created = 0;
  let updated = 0;
  const merged = [...existing];

  for (const seed of seeds) {
    // Never omit `category`: a stored article without one cannot be
    // re-validated by the API (validateArticleInput rejects it), which would
    // block every later edit, review decision and publish toggle.
    const category = isArticleCategory(seed.category) ? seed.category : "guides";
    const match = bySlug.get(seed.slug);
    if (match) {
      // Update in place: keep id, existing review decision and the original
      // publication date; publish now if it was still a draft.
      const index = merged.findIndex((a) => a.id === match.id);
      merged[index] = {
        ...match,
        isDemo: false,
        category,
        slug: { ar: seed.slug, en: seed.slug },
        title: seed.title,
        excerpt: seed.excerpt,
        body: seed.body,
        seo: seed.seo,
        sourceUrl: seed.sourceUrl,
        author: AUTHOR,
        status: "published",
        publishedAt: match.publishedAt ?? now,
        review: match.review ?? { status: "pending", notes: null, reviewedAt: null },
        updatedAt: now,
      };
      updated += 1;
      console.log(`updated: ${seed.slug}`);
    } else {
      merged.push({
        id: randomUUID(),
        status: "published",
        isDemo: false,
        slug: { ar: seed.slug, en: seed.slug },
        title: seed.title,
        excerpt: seed.excerpt,
        body: seed.body,
        category,
        coverImage: null,
        seo: seed.seo,
        author: AUTHOR,
        sourceUrl: seed.sourceUrl,
        review: { status: "pending", notes: null, reviewedAt: null },
        publishedAt: now,
        updatedAt: now,
      });
      created += 1;
      console.log(`created: ${seed.slug}`);
    }
  }

  console.log(`\n${created} created, ${updated} updated (seeds: ${seeds.length})`);

  if (dryRun) {
    console.log("dry run — nothing written");
    return;
  }

  await writeFile(ARTICLES_FILE, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`written: content/articles.json (${merged.length} articles total)`);
}

main().catch((error) => {
  console.error("import failed:", error.message);
  process.exit(1);
});
