import { NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin-csrf";
import { checkLoginRateLimit } from "@/lib/admin-login";
import { createSupabaseAuthClient } from "@/lib/supabase-auth-client";
import {
  adminIdentityFromClaims,
  isAdminAuthConfigured,
} from "@/lib/supabase-auth-config";

// POST /api/admin/login - Supabase Auth email and password sign-in.
const NO_STORE = { "Cache-Control": "no-store" } as const;
const INVALID = {
  ok: false,
  reason: "invalid",
  message: "Invalid email or password.",
};
const UNAVAILABLE = {
  ok: false,
  reason: "error",
  message: "Sign-in is temporarily unavailable.",
};

export async function POST(request: Request) {
  const csrfDenied = assertSameOrigin(request);
  if (csrfDenied) return csrfDenied;

  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        reason: "disabled",
        message: "The dashboard is not configured in this environment.",
      },
      { status: 403, headers: NO_STORE },
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
        headers: { ...NO_STORE, "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  let body: { email?: unknown; password?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // A malformed body counts as a failed sign-in.
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !email.includes("@") || email.length > 320 || !password || password.length > 512) {
    return NextResponse.json(INVALID, { status: 401, headers: NO_STORE });
  }

  try {
    const supabase = await createSupabaseAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return NextResponse.json(INVALID, { status: 401, headers: NO_STORE });
    }

    // Verify the freshly issued JWT locally. The cookie written by Supabase is
    // not treated as proof of identity, and neither is data.user.
    const claims = await supabase.auth.getClaims(data.session.access_token);
    const admin = adminIdentityFromClaims(claims.data?.claims);
    if (claims.error || !admin) {
      // A valid Supabase account that is not on the allowlist gets no session.
      await supabase.auth.signOut({ scope: "local" });
      return NextResponse.json(
        {
          ok: false,
          reason: "not_authorized",
          message: "This account is not authorized for the dashboard.",
        },
        { status: 403, headers: NO_STORE },
      );
    }

    return NextResponse.json(
      { ok: true, mode: "supabase", email: admin.email },
      { headers: NO_STORE },
    );
  } catch {
    return NextResponse.json(UNAVAILABLE, { status: 500, headers: NO_STORE });
  }
}
