import { NextResponse } from "next/server";

/**
 * CSRF defence for the admin API.
 *
 * Every state-changing request must carry an Origin header that matches the
 * request host and protocol. Browsers send it automatically for same-origin
 * POST/PATCH/DELETE requests; a cross-site form or script cannot forge it.
 */

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function rejected(): NextResponse {
  return NextResponse.json(
    { ok: false, reason: "csrf", message: "Invalid request origin." },
    { status: 403 },
  );
}

export function assertSameOrigin(request: Request): NextResponse | null {
  if (!UNSAFE_METHODS.has(request.method.toUpperCase())) return null;

  const origin = request.headers.get("origin");
  if (!origin) return rejected();

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    if (
      originUrl.protocol !== requestUrl.protocol ||
      originUrl.host !== requestUrl.host
    ) {
      return rejected();
    }
  } catch {
    return rejected();
  }

  return null;
}
