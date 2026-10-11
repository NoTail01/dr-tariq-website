import { NextResponse } from "next/server";

import { validateBooking } from "@/lib/booking";
import { submitBookingRequest } from "@/lib/booking-backend";

/**
 * Appointment requests.
 *
 * Server-side validation always runs, even when the local demo store is used.
 * A success response is returned only when a real backend accepted the data.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
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
