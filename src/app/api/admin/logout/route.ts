import { NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin-csrf";
import { createSupabaseAuthClient } from "@/lib/supabase-auth-client";

// POST /api/admin/logout - end the Supabase Auth session and clear its cookies.
const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function POST(request: Request) {
  const csrfDenied = assertSameOrigin(request);
  if (csrfDenied) return csrfDenied;

  try {
    const supabase = await createSupabaseAuthClient();
    // Local sign-out always removes the cookies, even if the Auth server cannot
    // be reached. It is enough for a browser session on a shared device.
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "error", message: "Sign-out is temporarily unavailable." },
      { status: 500, headers: NO_STORE },
    );
  }
}
