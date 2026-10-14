/**
 * Supabase REST client — server-only.
 *
 * Everything in this module runs on the server (service-role key). Nothing
 * here may be imported from a client component: the key is only ever read
 * from `process.env` inside an `async function`, so it never lands in a
 * client bundle.
 */

const DEFAULT_TIMEOUT_MS = 10_000;

/** Raw configuration as found in the environment. */
export type SupabaseConfig = {
  url: string;
  serviceKey: string;
};

/** Both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be present. */
export function readSupabaseConfig(): SupabaseConfig | null {
  const url = (
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ""
  )
    .trim()
    .replace(/\/+$/, "");
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !serviceKey) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return { url, serviceKey };
}

/** True when a Supabase backend is fully configured. */
export function isSupabaseConfigured(): boolean {
  return readSupabaseConfig() !== null;
}

/**
 * How content may be persisted in the current environment.
 *
 * - `supabase` — the configured backend is authoritative.
 * - `local`    — development only: the repository files are the store.
 * - `blocked`  — production with no backend: writes must fail loudly instead
 *                of silently disappearing with the container.
 */
export type PersistMode = "supabase" | "local" | "blocked";

export function persistMode(): PersistMode {
  if (isSupabaseConfigured()) return "supabase";
  if (process.env.NODE_ENV !== "production") return "local";
  return "blocked";
}

/** Shared headers for every Service-role REST call. */
function headers(serviceKey: string, extra: Record<string, string> = {}): HeadersInit {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: T | null; text: string }> {
  const config = readSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(`${config.url}${path}`, {
      ...init,
      headers: headers(config.serviceKey, (init.headers as Record<string, string>) ?? {}),
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await response.text();
    let body: T | null = null;
    try {
      body = text ? (JSON.parse(text) as T) : null;
    } catch {
      body = null;
    }
    return { status: response.status, body, text };
  } finally {
    clearTimeout(timer);
  }
}

/** `GET /rest/v1/<table>?<query>` */
export async function supabaseSelect<T>(
  table: string,
  query = "select=*",
): Promise<T[]> {
  const { status, body } = await requestJson<T[]>(`/rest/v1/${table}?${query}`);
  if (status < 200 || status >= 300) {
    throw new Error(`Supabase read failed (${status}) for ${table}`);
  }
  return Array.isArray(body) ? body : [];
}

/**
 * Upsert rows with `Prefer: resolution=merge-duplicates`. Idempotent: the
 * same payload twice produces the same row.
 */
export async function supabaseUpsert<T>(
  table: string,
  rows: unknown,
  onConflict?: string,
): Promise<T[]> {
  const query = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : "";
  const { status, body } = await requestJson<T[]>(`/rest/v1/${table}${query}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(rows),
  });
  if (status < 200 || status >= 300) {
    throw new Error(`Supabase upsert failed (${status}) for ${table}`);
  }
  return Array.isArray(body) ? body : [];
}

/** Insert one row (`Prefer: return=representation`). */
export async function supabaseInsert<T>(table: string, row: unknown): Promise<T> {
  const { status, body } = await requestJson<T[]>(`/rest/v1/${table}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([row]),
  });
  if (status < 200 || status >= 300) {
    throw new Error(`Supabase insert failed (${status}) for ${table}`);
  }
  const [first] = body ?? [];
  if (!first) throw new Error(`Supabase insert returned no row for ${table}`);
  return first;
}

/** Delete rows matching a PostgREST filter. */
export async function supabaseDelete(table: string, filter: string): Promise<void> {
  const { status } = await requestJson<unknown>(`/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  if (status < 200 || status >= 300) {
    throw new Error(`Supabase delete failed (${status}) for ${table}`);
  }
}

/** Upload bytes to Supabase Storage and return the public URL. */
export async function supabaseUpload(
  bucket: string,
  objectPath: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<string> {
  const config = readSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const body = new Blob([bytes as BlobPart], { type: contentType });
  const response = await fetch(
    `${config.url}/storage/v1/object/${bucket}/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body,
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(`Supabase Storage upload failed (${response.status})`);
  }
  return `${config.url}/storage/v1/object/public/${bucket}/${objectPath}`;
}
