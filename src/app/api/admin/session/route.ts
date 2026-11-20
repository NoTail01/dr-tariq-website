import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isAuthenticated, isDashboardEnabled } from "@/lib/admin-auth";

// GET /api/admin/session - used by the dashboard UI to gate itself.
export async function GET() {
  // Always read request cookies so this endpoint is never statically cached.
  await cookies();

  const enabled = isDashboardEnabled();
  const authenticated = await isAuthenticated();

  return NextResponse.json(
    {
      enabled,
      authenticated,
      mode: enabled ? "credentials" : "disabled",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
