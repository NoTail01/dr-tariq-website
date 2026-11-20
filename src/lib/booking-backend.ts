import type { BookingInput } from "./booking";
import { readSupabaseConfig } from "./supabase";

export type SubmitResult = {
  /** True only when a backend accepted the request. */
  sent: boolean;
  mode: "demo" | "supabase";
};

const TIMEOUT_MS = 10_000;

/**
 * Stores an appointment request.
 *
 * While no Supabase credentials are configured the function reports
 * `sent: false`, so the UI can say clearly that nothing was transmitted.
 * When SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY exist, the row is inserted
 * through the Supabase REST API (service-role key stays server-side).
 */
export async function submitBookingRequest(input: BookingInput): Promise<SubmitResult> {
  const config = readSupabaseConfig();
  if (!config) {
    return { sent: false, mode: "demo" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${config.url}/rest/v1/appointment_requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
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
      signal: controller.signal,
    });

    if (!response.ok) {
      // Log the status only - never the patient's details.
      throw new Error(`Booking insert failed with status ${response.status}`);
    }
  } finally {
    clearTimeout(timer);
  }

  return { sent: true, mode: "supabase" };
}
