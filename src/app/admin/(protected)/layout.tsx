import { connection } from "next/server";

import { requireAdminUser } from "@/lib/admin-auth";

/**
 * Server-side gate for every protected dashboard page. The proxy refreshes
 * Supabase session cookies, but this layout verifies the signed JWT claims and
 * the administrator allowlist again before any protected page is rendered.
 */
export const instant = false;

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  await requireAdminUser();
  return <>{children}</>;
}
