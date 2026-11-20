import { connection, NextResponse } from "next/server";

import { getAdminIdentity, isAdminAuthConfigured } from "@/lib/admin-auth";

// GET /api/admin/session - used by the dashboard UI to gate itself.
// connection() keeps this endpoint request-specific under Cache Components.
export async function GET() {
  await connection();
  const enabled = isAdminAuthConfigured();
  const admin = await getAdminIdentity();

  return NextResponse.json(
    {
      enabled,
      authenticated: admin !== null,
      mode: enabled ? "supabase" : "disabled",
      email: admin?.email ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
