import type { BookingInput } from "./booking";

export type SubmitResult = {
  /** True only when a backend accepted the request. */
  sent: boolean;
  mode: "demo" | "supabase";
};

/**
 * Stores an appointment request.
 *
 * While no Supabase credentials are configured the function reports
 * `sent: false`, so the UI can say clearly that nothing was transmitted.
 * When `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` exist, the row is
 * inserted through the Supabase REST API (service-role key stays server-side).
 */
export async function submitBookingRequest(input: BookingInput): Promise<SubmitResult> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return { sent: false, mode: "demo" };
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/appointment_requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      name: input.name,
      contact_method: input.contactMethod,
      contact_value: input.contactValue,
      preferred_time: input.preferredTime || null,
      message: input.message || null,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    // Log the status only — never the patient's details.
    throw new Error(`Booking insert failed with status ${response.status}`);
  }

  return { sent: true, mode: "supabase" };
}
