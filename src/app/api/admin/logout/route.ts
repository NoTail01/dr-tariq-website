import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, clearAdminSessionCookieOptions } from "@/lib/admin-session";
import { assertSameOrigin } from "@/lib/admin-csrf";

// POST /api/admin/logout - clear the signed session cookie.
export async function POST(request: Request) {
  const csrfDenied = assertSameOrigin(request);
  if (csrfDenied) return csrfDenied;

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", clearAdminSessionCookieOptions());
  return response;
}
