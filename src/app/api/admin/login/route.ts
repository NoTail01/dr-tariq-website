import { NextResponse } from "next/server";

import { isDashboardEnabled, verifyCredentials } from "@/lib/admin-auth";
import { assertSameOrigin } from "@/lib/admin-csrf";
import { checkLoginRateLimit } from "@/lib/admin-login";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSession,
} from "@/lib/admin-session";

// POST /api/admin/login - username and password sign-in.
const GENERIC_ERROR = {
  ok: false,
  reason: "invalid",
  message: "Invalid username or password.",
};

export async function POST(request: Request) {
  const csrfDenied = assertSameOrigin(request);
  if (csrfDenied) return csrfDenied;

  if (!isDashboardEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        reason: "disabled",
        message: "The dashboard is not configured in this environment.",
      },
      { status: 403 },
    );
  }

  const rate = checkLoginRateLimit(request);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        reason: "rate_limited",
        message: "Too many sign-in attempts. Please try again later.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  let body: { username?: unknown; password?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // A malformed body counts as a failed sign-in.
  }

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  let authenticated = false;
  try {
    authenticated = await verifyCredentials(username, password);
  } catch {
    // Never leak hashing/configuration errors to the client.
    return NextResponse.json(
      { ok: false, reason: "error", message: "Sign-in is temporarily unavailable." },
      { status: 500 },
    );
  }

  if (!authenticated) {
    return NextResponse.json(GENERIC_ERROR, { status: 401 });
  }

  try {
    const session = await createAdminSession();
    const response = NextResponse.json({ ok: true, mode: "credentials" });
    response.cookies.set(ADMIN_SESSION_COOKIE, session, adminSessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, reason: "error", message: "Sign-in is temporarily unavailable." },
      { status: 500 },
    );
  }
}
