import { connection } from "next/server";

import { requireAdminSession } from "@/lib/admin-auth";

/**
 * Server-side gate for every protected dashboard page. Proxy performs the
 * fast redirect, but this layout verifies the signed session again on the
 * server before any protected page content is rendered.
 */
export const instant = false;

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The session check compares an expiry with the current time, so it must
  // run per request rather than during prerendering.
  await connection();
  await requireAdminSession();
  return <>{children}</>;
}
