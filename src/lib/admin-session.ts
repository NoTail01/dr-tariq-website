import { createHash } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "dt_admin_session";

export function adminSessionValue(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function expectedAdminSession(): string | null {
  if (process.env.NODE_ENV !== "production") return "local-development";
  const token = process.env.ADMIN_TOKEN;
  return token ? adminSessionValue(token) : null;
}
