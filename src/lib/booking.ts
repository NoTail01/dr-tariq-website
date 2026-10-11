/**
 * Booking request validation — shared by the browser form and the API route.
 * The server always re-validates: never trust the client.
 *
 * Deliberately collects no medical information: only a name, a contact
 * channel, and an optional preferred time.
 */

export const CONTACT_METHODS = ["email", "phone", "whatsapp"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export type BookingInput = {
  name: string;
  contactMethod: ContactMethod;
  contactValue: string;
  preferredTime: string;
  message: string;
  consent: boolean;
};

export type BookingErrorKey =
  | "nameRequired"
  | "nameTooLong"
  | "contactRequired"
  | "contactValueRequired"
  | "contactValueInvalid"
  | "preferredTimeTooLong"
  | "messageTooLong"
  | "consentRequired"
  | "invalidPayload";

export type BookingErrors = Partial<Record<keyof BookingInput | "_", BookingErrorKey>>;

export type BookingValidation =
  | { ok: true; value: BookingInput }
  | { ok: false; errors: BookingErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9()[\]\s-]{6,24}$/;

const LIMITS = { name: 120, preferredTime: 200, message: 2000 } as const;

export function validateBooking(input: unknown): BookingValidation {
  const errors: BookingErrors = {};

  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: { _: "invalidPayload" } };
  }

  const raw = input as Record<string, unknown>;
  const text = (key: string): string => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "");

  const name = text("name");
  const contactMethod = text("contactMethod");
  const contactValue = text("contactValue");
  const preferredTime = text("preferredTime");
  const message = text("message");
  const consent = raw.consent === true;

  if (!name) errors.name = "nameRequired";
  else if (name.length > LIMITS.name) errors.name = "nameTooLong";

  if (!(CONTACT_METHODS as readonly string[]).includes(contactMethod)) {
    errors.contactMethod = "contactRequired";
  }

  if (!contactValue) {
    errors.contactValue = "contactValueRequired";
  } else if (contactMethod === "email") {
    if (!EMAIL_PATTERN.test(contactValue)) errors.contactValue = "contactValueInvalid";
  } else if (contactMethod === "phone" || contactMethod === "whatsapp") {
    if (!PHONE_PATTERN.test(contactValue)) errors.contactValue = "contactValueInvalid";
  }

  if (preferredTime.length > LIMITS.preferredTime) errors.preferredTime = "preferredTimeTooLong";
  if (message.length > LIMITS.message) errors.message = "messageTooLong";
  if (!consent) errors.consent = "consentRequired";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: { name, contactMethod: contactMethod as ContactMethod, contactValue, preferredTime, message, consent },
  };
}
