import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  isDashboardEnabled,
  sessionCookieValue,
  verifyToken,
} from "@/lib/admin-auth";

/**
 * POST /api/admin/login — token based sign-in.
 *
 * Development: accepted without a token (mock dashboard, local only).
 * Production:  requires `ADMIN_TOKEN`; a signed session cookie is set.
 * Supabase Auth replaces this when the backend is activated.
 */
export async function POST(request: Request) {
  if (!isDashboardEnabled()) {
    return NextResponse.json(
      { ok: false, reason: "disabled", message: "Dashboard is disabled." },
      { status: 403 },
    );
  }

  let body: { token?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body */
  }

  const submitted = typeof body.token === "string" ? body.token : "";
  const expected = process.env.ADMIN_TOKEN ?? "";

  const devMode = process.env.NODE_ENV !== "production";

  if (!devMode) {
    if (!expected || !verifyToken(submitted, expected)) {
      return NextResponse.json(
        { ok: false, reason: "invalid", message: "Invalid access token." },
        { status: 401 },
      );
    }
  }

  const cookieValue = sessionCookieValue();
  const response = NextResponse.json({ ok: true, mode: devMode ? "development" : "token" });

  if (cookieValue) {
    response.cookies.set(ADMIN_SESSION_COOKIE, cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: devMode ? false : true,
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  }

  return response;
}
