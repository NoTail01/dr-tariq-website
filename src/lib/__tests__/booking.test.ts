import { describe, expect, it } from "vitest";

import { validateBooking, type BookingInput } from "@/lib/booking";

const valid: BookingInput = {
  name: "Ahmad Shalabieh",
  contactMethod: "whatsapp",
  contactValue: "+962790000000",
  preferredTime: "",
  message: "",
  consent: true,
};

describe("validateBooking", () => {
  it("accepts a valid request", () => {
    const result = validateBooking({ ...valid });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.name).toBe("Ahmad Shalabieh");
  });

  it("rejects non-object payloads", () => {
    const result = validateBooking(null);
    expect(result).toEqual({ ok: false, errors: { _: "invalidPayload" } });
  });

  it("requires a name", () => {
    const result = validateBooking({ ...valid, name: "   " });
    expect(result).toEqual({ ok: false, errors: { name: "nameRequired" } });
  });

  it("rejects overlong names", () => {
    const result = validateBooking({ ...valid, name: "x".repeat(121) });
    expect(result).toEqual({ ok: false, errors: { name: "nameTooLong" } });
  });

  it("requires a known contact method", () => {
    const result = validateBooking({ ...valid, contactMethod: "carrier-pigeon" });
    expect(result).toEqual({ ok: false, errors: { contactMethod: "contactRequired" } });
  });

  it("requires contact details", () => {
    const result = validateBooking({ ...valid, contactValue: "" });
    expect(result).toEqual({ ok: false, errors: { contactValue: "contactValueRequired" } });
  });

  it("validates email addresses", () => {
    const bad = validateBooking({
      ...valid,
      contactMethod: "email",
      contactValue: "not-an-email",
    });
    expect(bad).toEqual({ ok: false, errors: { contactValue: "contactValueInvalid" } });

    const good = validateBooking({
      ...valid,
      contactMethod: "email",
      contactValue: "ahmad@example.com",
    });
    expect(good.ok).toBe(true);
  });

  it("validates phone numbers for phone and whatsapp", () => {
    for (const method of ["phone", "whatsapp"] as const) {
      const bad = validateBooking({ ...valid, contactMethod: method, contactValue: "abc" });
      expect(bad).toEqual({ ok: false, errors: { contactValue: "contactValueInvalid" } });

      const good = validateBooking({ ...valid, contactMethod: method, contactValue: "+962 79 000 0000" });
      expect(good.ok).toBe(true);
    }
  });

  it("requires consent", () => {
    const result = validateBooking({ ...valid, consent: false });
    expect(result).toEqual({ ok: false, errors: { consent: "consentRequired" } });
  });

  it("trims surrounding whitespace", () => {
    const result = validateBooking({ ...valid, name: "  Ahmad  " });
    if (result.ok) expect(result.value.name).toBe("Ahmad");
  });

  it("limits optional free text length", () => {
    const result = validateBooking({ ...valid, message: "x".repeat(2001) });
    expect(result).toEqual({ ok: false, errors: { message: "messageTooLong" } });
  });

  it("reports multiple errors at once", () => {
    const result = validateBooking({ name: "", contactMethod: "phone", contactValue: "1", consent: false });
    expect(result).toEqual({
      ok: false,
      errors: { name: "nameRequired", contactValue: "contactValueInvalid", consent: "consentRequired" },
    });
  });
});