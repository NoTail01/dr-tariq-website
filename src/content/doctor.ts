/**
 * Doctor profile — factual content only.
 *
 * Every field carries `verified` and a `source` that proves it. Nothing in
 * this file is invented: unverified claims stay out entirely.
 *
 * See `SOURCES.md` in this folder for the full source ledger and
 * `docs/MISSING-INFO.md` for the launch checklist.
 */

export type Verified<T> = {
  value: T;
  verified: boolean;
  /** Short citation, e.g. "Hospital doctor profile page (verified online)" */
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

/** Hospital page (primary qualification source). */
const HOSPITAL_PAGE =
  "https://www.specialty-hospital.com/ar/doctors/151/Dr.-Tariq-Abu-Hweij — hospital doctor profile, verified online Oct 2026";
/** Supplied brand reference image (public/images/dr-tariq-brand-reference.png). */
const BRAND_IMAGE =
  "Supplied brand reference image (public/images/dr-tariq-brand-reference.png), Oct 2026";
/** Client-supplied portrait (public/images/dr-tariq-portrait.png). */
const PORTRAIT_FILE =
  "Client-supplied photograph (public/images/dr-tariq-portrait.png), Oct 2026";
/** Client-provided text/directions in the site brief. */
const CLIENT_BRIEF = "Client brief for this website (Oct 2026)";

export const doctor = {
  /**
   * Name — as printed on the supplied brand image and hospital page.
   * Source: brand reference image + hospital doctor profile.
   */
  fullName: {
    ar: "الدكتور طارق أبو حويج",
    en: "Dr Tariq Abu Hweij",
    verified: true,
    source: BRAND_IMAGE,
  } as VerifiedLocalized,

  /** Courtesy title only — the brief refers to the doctor as "Dr". */
  honorific: {
    ar: "د.",
    en: "Dr",
    verified: true,
    source: CLIENT_BRIEF,
  } as VerifiedLocalized,

  /**
   * Professional title — exactly as printed on the supplied brand image.
   * (The hospital profile page states the shorter "استشاري أمراض الكلى";
   * both statements are kept in SOURCES.md.)
   */
  professionalTitle: {
    ar: "استشاري أمراض الباطنية والكلى وزراعة الكلى وضغط الدم",
    en: "Consultant in Internal Medicine, Nephrology, Kidney Transplantation and Hypertension",
    verified: true,
    source: BRAND_IMAGE,
  } as VerifiedLocalized,

  specialty: {
    value: {
      ar: "أمراض الكلى",
      en: "Nephrology",
    } as { ar: string; en: string },
    verified: true,
    source: HOSPITAL_PAGE,
  },

  /**
   * Short professional biography — built ONLY from verified facts below.
   * No years of experience, education history, awards, affiliations,
   * patient counts or success rates are claimed.
   */
  biography: {
    ar: "الدكتور طارق أبو حويج، استشاري أمراض الباطنية والكلى وزراعة الكلى وضغط الدم. حاصل على البورد الأردني في الأمراض الباطنية والبورد الأردني في أمراض الكلى، إضافة إلى البورد الألماني. يعالج حالات أمراض الباطنية والكلى، وهو عضو الجمعية الألمانية لأمراض الباطنية والقلب، وعضو نقابتي الأطباء الألمانية والأردنية. تجري العيادة خلف المستشفى التخصصي في مجمع الرياض الطبي — الطابق الأول.",
    en: "Dr Tariq Abu Hweij is a consultant in internal medicine, nephrology, kidney transplantation and hypertension. He holds the Jordanian Board in Internal Medicine and the Jordanian Board in Nephrology, as well as the German Board. He treats internal medicine and kidney cases, is a member of the German Association for Internal Medicine and Cardiology, and a member of the German and Jordanian medical associations. The clinic is located behind the Specialty Hospital in Al-Riyad Medical Complex, first floor.",
    verified: true,
    source: `${BRAND_IMAGE}; ${HOSPITAL_PAGE}`,
  } as { ar: string; en: string; verified: boolean; source: string },

  portrait: {
    url: "/images/dr-tariq-portrait.png",
    verified: true,
    source: PORTRAIT_FILE,
  } as { url: string | null; verified: boolean; source: string | null },

  /** Qualifications exactly as listed on the hospital doctor profile. */
  qualifications: [
    {
      ar: "البورد الأردني في الأمراض الباطنية",
      en: "Jordanian Board in Internal Medicine",
      source: HOSPITAL_PAGE,
    },
    {
      ar: "البورد الأردني في أمراض الكلى",
      en: "Jordanian Board in Nephrology",
      source: HOSPITAL_PAGE,
    },
    {
      // The hospital page states "شهادة البورد الألماني" without naming the
      // exact specialty or issuing organization — do not invent them.
      ar: "البورد الألماني",
      en: "German Board",
      source: HOSPITAL_PAGE,
    },
  ] as Array<{ ar: string; en: string; source: string }>,

  /**
   * Informational specialty sections from the professional title on the
   * supplied brand image. Kidney transplantation is described as a field of
   * practice — never as a promise of surgery performed at the clinic.
   */
  specialties: [
    { ar: "أمراض الباطنية", en: "Internal medicine", source: BRAND_IMAGE },
    { ar: "أمراض الكلى", en: "Nephrology", source: BRAND_IMAGE },
    { ar: "زراعة الكلى", en: "Kidney transplantation", source: BRAND_IMAGE },
    { ar: "ضغط الدم", en: "Hypertension", source: BRAND_IMAGE },
  ] as Array<{ ar: string; en: string; source: string }>,

  /**
   * Memberships — two DISTINCT statements from two distinct sources.
   * They are deliberately kept separate and are not treated as the same
   * organization.
   */
  memberships: [
    {
      ar: "عضو الجمعية الألمانية لأمراض الباطنية والقلب",
      en: "Member of the German Association for Internal Medicine and Cardiology",
      source: BRAND_IMAGE,
    },
    {
      ar: "عضو نقابة الأطباء الألمانية ونقابة الأطباء الأردنية",
      en: "Member of the German Medical Association and the Jordanian Medical Association",
      source: HOSPITAL_PAGE,
    },
  ] as Array<{ ar: string; en: string; source: string }>,

  /** Languages listed on the hospital doctor profile. */
  languages: ["العربية", "الإنجليزية", "الألمانية", "الإيطالية", "الرومانية"] as string[],
  languagesEn: ["Arabic", "English", "German", "Italian", "Romanian"] as string[],
  languagesSource: HOSPITAL_PAGE,

  /**
   * Clinic location — wording exactly as supplied on the brand image.
   * The conflicting directory address is recorded in docs/MISSING-INFO.md
   * and is deliberately NOT published here.
   */
  location: {
    ar: "خلف المستشفى التخصصي، مجمع الرياض الطبي، الطابق الأول",
    en: "Behind the Specialty Hospital, Al-Riyad Medical Complex, First Floor",
    verified: true,
    source: BRAND_IMAGE,
  } as VerifiedLocalized,

  /**
   * Contact numbers exactly as supplied on the brand image.
   * WhatsApp is NOT confirmed to work on the mobile number, so the
   * whatsappEnabled flag in settings stays false.
   */
  contact: {
    phone: {
      national: "0799101101",
      international: "+962799101101",
      verified: true,
      source: BRAND_IMAGE,
    },
    landline: {
      national: "065685354",
      international: "+96265685354",
      verified: true,
      source: BRAND_IMAGE,
    },
    whatsapp: {
      number: "+962799101101",
      link: "https://wa.me/962799101101",
      enabled: false,
      verified: false,
      source: "Number supplied on brand image; WhatsApp availability NOT confirmed",
    },
    email: null as string | null,
    workingHours: null as { ar: string; en: string } | null,
    verified: true,
    source: BRAND_IMAGE,
  },
};

export type Doctor = typeof doctor;
