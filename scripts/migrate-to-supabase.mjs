/**
 * Repeatable migration of the local content store into Supabase.
 *
 * Safety rules (never break remote data):
 *  - every write is an upsert keyed on the article `id`, so re-running
 *    changes nothing;
 *  - a remote row that already exists is NEVER overwritten by default —
 *    pass `--force` to allow it, and even then only when the local row is
 *    newer than the remote one;
 *  - no article is ever deleted;
 *  - a timestamped backup of the local store is written first;
 *  - `--dry-run` writes nothing and changes nothing.
 *
 * Usage:
 *   node scripts/migrate-to-supabase.mjs --dry-run
 *   node scripts/migrate-to-supabase.mjs
 *   node scripts/migrate-to-supabase.mjs --force
 *
 * Credentials come from the environment only (never from the command line):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ARTICLES_FILE = path.join(ROOT, "content", "articles.json");
const SETTINGS_FILE = path.join(ROOT, "content", "settings.json");
const BACKUP_DIR = path.join(ROOT, ".local-backups");

const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run");

const url = (process.env.SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

if (!url || !serviceKey) {
  console.error(
    [
      "Migration aborted: Supabase credentials are missing.",
      "",
      "Set them in the environment (never on the command line):",
      "  export SUPABASE_URL=https://<project-ref>.supabase.co",
      "  export SUPABASE_SERVICE_ROLE_KEY=<service-role-key>",
      "",
      "Then run: node scripts/migrate-to-supabase.mjs --dry-run",
    ].join("\n"),
  );
  process.exit(1);
}

function headers(extra = {}) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function api(method, endpoint, { query = "", body, prefer } = {}) {
  const response = await fetch(`${url}/rest/v1/${endpoint}${query}`, {
    method,
    headers: headers(prefer ? { Prefer: prefer } : {}),
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  if (!response.ok) {
    throw new Error(`${method} /rest/v1/${endpoint} -> ${response.status}: ${text.slice(0, 300)}`);
  }
  return parsed;
}

/** Remote article ids and their updated_at, for conflict detection. */
async function remoteIndex() {
  const rows = await api("GET", "articles", {
    query: "?select=id,updated_at",
  });
  const index = new Map();
  for (const row of rows ?? []) index.set(row.id, row.updated_at ?? null);
  return index;
}

async function main() {
  const articlesRaw = await readFile(ARTICLES_FILE, "utf8");
  const articles = JSON.parse(articlesRaw);
  if (!Array.isArray(articles)) throw new Error("content/articles.json is not an array");

  // 1. Backup before anything else.
  await mkdir(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `articles-before-supabase-${stamp}.json`;
  await writeFile(path.join(BACKUP_DIR, backup), articlesRaw, "utf8");
  console.log(`backup: .local-backups/${backup}`);

  // 2. Remote index once: determines what already exists.
  const remote = await remoteIndex();
  console.log(`remote articles: ${remote.size}`);

  const toWrite = [];
  let skipped = 0;

  for (const article of articles) {
    const existing = remote.get(article.id);
    if (existing && !force) {
      // Never overwrite remote data without an explicit --force.
      skipped += 1;
      continue;
    }
    if (existing && force) {
      // Even with --force, keep whichever copy is newer.
      const remoteIsNewer = String(existing) > String(article.updatedAt ?? "");
      if (remoteIsNewer) {
        console.log(`keep remote (newer): ${article.slug?.en ?? article.id}`);
        skipped += 1;
        continue;
      }
    }
    toWrite.push({
      id: article.id,
      slug: article.slug,
      status: article.status,
      is_demo: article.isDemo === true,
      updated_at: article.updatedAt,
      data: article,
    });
  }

  console.log(
    `articles to write: ${toWrite.length} (skipped: ${skipped})${force ? " [--force]" : ""}`,
  );

  // 3. Settings: single row, upserted. Remote is never overwritten unless
  //    it does not exist yet or --force is passed.
  let settingsRow = null;
  let writeSettings = true;
  try {
    const settingsRaw = await readFile(SETTINGS_FILE, "utf8");
    settingsRow = JSON.parse(settingsRaw);
    const existing = await api("GET", "site_settings", { query: "?select=id&limit=1" });
    if (Array.isArray(existing) && existing.length > 0 && !force) {
      writeSettings = false;
      console.log("settings: remote row exists — left untouched (use --force to overwrite)");
    }
  } catch {
    settingsRow = null;
    writeSettings = false;
  }

  if (dryRun) {
    console.log("\ndry run — nothing written");
    return;
  }

  // 4. Write articles in batches (idempotent upserts on the primary key).
  for (let index = 0; index < toWrite.length; index += 50) {
    const batch = toWrite.slice(index, index + 50);
    await api("POST", "articles?on_conflict=id", {
      body: batch,
      prefer: "resolution=merge-duplicates,return=minimal",
    });
    console.log(`wrote ${batch.length} articles (batch ${index / 50 + 1})`);
  }

  if (settingsRow && writeSettings) {
    await api("POST", "site_settings?on_conflict=id", {
      body: [{ id: "site", data: settingsRow }],
      prefer: "resolution=merge-duplicates,return=minimal",
    });
    console.log("settings: written");
  }

  const after = await remoteIndex();
  console.log(`\ndone — remote articles now: ${after.size}`);
}

main().catch((error) => {
  console.error(`migration failed: ${error.message}`);
  process.exit(1);
});
