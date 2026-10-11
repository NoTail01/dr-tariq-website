export type SiteMode = "development" | "production";

/**
 * Controls which placeholder/demo content may appear.
 *
 * - `npm run dev`            -> development (demo articles visible, marked)
 * - `npm run build && start` -> production  (demo articles hidden entirely)
 *
 * NEXT_PUBLIC_SITE_MODE can override the default, e.g. to preview the
 * production view locally.
 */
export function getSiteMode(): SiteMode {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_MODE;
  if (fromEnv === "development" || fromEnv === "production") return fromEnv;
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
