import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isDashboardEnabled, isAuthenticated } from "@/lib/admin-auth";

/** GET /api/admin/session — used by the dashboard UI to gate itself. */
export async function GET() {
  // Always read the request cookies so this endpoint is never statically
  // cached: its answer (enabled / authenticated) depends on the runtime
  // environment and each request's session cookie.
  await cookies();

  const enabled = isDashboardEnabled();
  const authenticated = await isAuthenticated();

  return NextResponse.json(
    {
      enabled,
      authenticated,
      mode: process.env.NODE_ENV !== "production" ? "development" : "token",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
