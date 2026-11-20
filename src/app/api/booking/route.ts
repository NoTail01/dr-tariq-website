import { NextResponse } from "next/server";

import { validateBooking } from "@/lib/booking";
import { submitBookingRequest } from "@/lib/booking-backend";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * Appointment requests.
 *
 * Server-side validation always runs, even when the local demo store is used.
 * A success response is returned only when a real backend accepted the data.
 *
 * Public submissions are limited per client and the body is size-capped.
 * The in-memory limiter is per instance; configure an edge/WAF rule as well
 * once a real domain is live.
 */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_BODY_BYTES = 16 * 1024;
const limiter = createRateLimiter(RATE_LIMIT, RATE_WINDOW_MS);

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const candidate = forwarded?.split(",")[0]?.trim();
  return candidate || "unknown";
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export async function POST(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, errors: { _: "payloadTooLarge" } },
      { status: 413 },
    );
  }

  const rate = limiter.check(clientKey(request));
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, errors: { _: "rateLimited" } },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ ok: false, errors: { _: "invalid" } }, { status: 400 });
  }

  if (byteLength(raw) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, errors: { _: "payloadTooLarge" } },
      { status: 413 },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, errors: { _: "invalid" } }, { status: 400 });
  }

  const validation = validateBooking(payload);
  if (!validation.ok) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  try {
    const result = await submitBookingRequest(validation.value);
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
