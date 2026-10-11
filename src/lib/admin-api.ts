import { NextResponse } from "next/server";

import { isDashboardEnabled, isAuthenticated } from "./admin-auth";

/**
 * Server-side gate for every admin API.
 * Returns an error response when the caller may not proceed, otherwise null.
 */
export async function guardAdmin(): Promise<NextResponse | null> {
  if (!isDashboardEnabled()) {
    return NextResponse.json(
      { ok: false, reason: "disabled", message: "Dashboard is disabled in this environment." },
      { status: 403 },
    );
  }

  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { ok: false, reason: "unauthenticated", message: "Authentication required." },
      { status: 401 },
    );
  }

  return null;
}
