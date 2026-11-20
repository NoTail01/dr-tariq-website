import { NextResponse } from "next/server";

import { getAdminIdentity, isAdminAuthConfigured } from "./admin-auth";
import { assertSameOrigin } from "./admin-csrf";

/**
 * Server-side gate for every admin API. Returns an error response when the
 * caller may not proceed, otherwise null.
 */
export async function guardAdmin(request: Request): Promise<NextResponse | null> {
  const csrfDenied = assertSameOrigin(request);
  if (csrfDenied) return csrfDenied;

  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        reason: "disabled",
        message: "The dashboard is not configured in this environment.",
      },
      { status: 403 },
    );
  }

  if (!(await getAdminIdentity())) {
    return NextResponse.json(
      { ok: false, reason: "unauthenticated", message: "Authentication required." },
      { status: 401 },
    );
  }

  return null;
}
