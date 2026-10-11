/**
 * Doctor profile — factual content only.
 *
 * Every field must carry `verified`, `source` and, when verified, a reference
 * to the document or URL that proves it. Unverified fields stay `null` and the
 * UI renders a clearly marked development placeholder instead of guessing.
 *
 * See `SOURCES.md` in this folder for the source ledger and
 * `docs/MISSING-INFO.md` for everything still needed.
 */

export type Verified<T> = {
  value: T;
  verified: boolean;
  /** Short citation, e.g. "Degree certificate (2024) — file pending upload" */
  source: string | null;
};

/** A localized value whose verification status and source are recorded. */
export type VerifiedLocalized = {
  ar: string;
  en: string;
  verified: boolean;
  source: string | null;
};

export type PendingField = {
  value: null;
  verified: false;
  source: null;
  /** What the UI should show while the value is missing */
  placeholder: string;
};

export const doctor = {
  /**
   * Name — supplied directly in the project brief that commissioned this site.
   * Source: task brief "Build Dr Tariq Abu Hweij's complete website".
   */
  fullName: {
    ar: "د. طارق أبو هويجة",
    en: "Dr Tariq Abu Hweij",
    verified: true,
    source: "Project brief (client request, Oct 2026)",
  } as VerifiedLocalized,

  /** Title: the brief refers to the client as "Dr" — nothing more is confirmed. */
  honorific: {
    ar: "د.",
    en: "Dr",
    verified: true,
    source: "Project brief (client request, Oct 2026)",
  } as VerifiedLocalized,

  specialty: {
    value: null,
    verified: false,
    source: null,
    placeholder: "التخصص قيد التحديد",
    placeholderEn: "Specialty to be confirmed",
  } as PendingField & { placeholderEn: string },

  biography: {
    ar: null,
    en: null,
    verified: false,
    source: null,
  } as { ar: string | null; en: string | null; verified: boolean; source: string | null },

  portrait: {
    url: null,
    verified: false,
    source: null,
  } as { url: string | null; verified: boolean; source: string | null },

  /** No qualification has been evidenced yet — keep empty, never guess. */
  qualifications: [] as Array<{ ar: string; en: string; source: string }>,

  /** No specialty/service list has been confirmed yet. */
  specialties: [] as Array<{ ar: string; en: string; source: string }>,

  /** Contact channels stay inactive (`null`) until the clinic confirms them. */
  contact: {
    phone: null as string | null,
    whatsapp: null as string | null,
    email: null as string | null,
    address: null as { ar: string; en: string } | null,
    workingHours: null as { ar: string; en: string } | null,
    verified: false,
    source: null as string | null,
  },
};

export type Doctor = typeof doctor;
