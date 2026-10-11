import { afterEach, describe, expect, it, vi } from "vitest";

import { validateBooking, type BookingInput } from "@/lib/booking";

const valid: BookingInput = {
  name: "Ahmad Shalabieh",
  contactMethod: "email",
  contactValue: "ahmad@example.com",
  preferredTime: "",
  message: "",
  consent: true,
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("submitBookingRequest", () => {
  it("reports not-sent while no Supabase credentials are configured", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { submitBookingRequest } = await import("@/lib/booking-backend");
    const result = await submitBookingRequest(valid);

    expect(result).toEqual({ sent: false, mode: "demo" });
  });

  it("validates the booking input before any backend call", () => {
    const result = validateBooking(valid);
    expect(result.ok).toBe(true);
  });
});