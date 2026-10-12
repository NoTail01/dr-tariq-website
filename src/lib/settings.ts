import { readFileSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { Localized } from "./article-types";

export type Settings = {
  siteName: Localized;
  tagline: Localized;
  /**
   * Editable doctor profile. Values default to the verified facts in
   * `src/content/doctor.ts`; the clinic becomes the source once it edits
   * and saves them from the dashboard.
   */
  doctor: {
    biography: Localized;
    qualifications: { ar: string; en: string }[];
  };
  contact: {
    /** Mobile number in national format, as printed on the clinic branding. */
    phone: string | null;
    /** Same mobile in international format — used for the tel: link. */
    phoneIntl: string | null;
    /** Clinic landline in national format. */
    landline: string | null;
    /** Landline in international format — used for the tel: link. */
    landlineIntl: string | null;
    /** WhatsApp number (international). Only used when whatsappEnabled. */
    whatsapp: string | null;
    /**
     * WhatsApp activation flag. The number above is NOT confirmed to be
     * WhatsApp-enabled, so this stays false until the clinic confirms it.
     */
    whatsappEnabled: boolean;
    email: string | null;
    address: Localized | null;
    workingHours: Localized | null;
    /** Client-supplied Google Maps embed URL (exact embed, never a search). */
    mapsEmbedUrl: string | null;
    /** "Open in Google Maps" link targeting the same place as the embed. */
    mapsPlaceUrl: string | null;
  };
  social: {
    facebook: string | null;
    instagram: string | null;
    x: string | null;
    linkedin: string | null;
    youtube: string | null;
  };
  branding: {
    /** Primary brand color (hex) extracted from the supplied reference. */
    brandColor: string;
    /** Logo asset (emblem crop) for light backgrounds. */
    logoUrl: string | null;
    /** Logo asset for dark backgrounds. */
    logoUrlDark: string | null;
  };
  /** Free-text note shown in the footer (public). */
  footerNote: Localized;
  updatedAt: string;
};

/**
 * Default public settings.
 *
 * Identity, contact, location and branding values come from the client
 * brief: the supplied brand reference image and the verified hospital page.
 * Nothing here is invented — see `src/content/SOURCES.md`.
 */
export const defaultSettings: Settings = {
  siteName: {
    ar: "الدكتور طارق أبو حويج",
    en: "Dr Tariq Abu Hweij",
  },
  tagline: {
    ar: "استشاري أمراض الباطنية والكلى وزراعة الكلى وضغط الدم",
    en: "Consultant in Internal Medicine, Nephrology, Kidney Transplantation and Hypertension",
  },
  doctor: {
    biography: {
      ar: "الدكتور طارق أبو حويج، استشاري أمراض الباطنية والكلى وزراعة الكلى وضغط الدم. حاصل على البورد الأردني في الأمراض الباطنية والبورد الأردني في أمراض الكلى، إضافة إلى البورد الألماني. يعالج حالات أمراض الباطنية والكلى، وهو عضو الجمعية الألمانية لأمراض الباطنية والقلب، وعضو نقابتي الأطباء الألمانية والأردنية. تجري العيادة خلف المستشفى التخصصي في مجمع الرياض الطبي — الطابق الأول.",
      en: "Dr Tariq Abu Hweij is a consultant in internal medicine, nephrology, kidney transplantation and hypertension. He holds the Jordanian Board in Internal Medicine and the Jordanian Board in Nephrology, as well as the German Board. He treats internal medicine and kidney cases, is a member of the German Association for Internal Medicine and Cardiology, and a member of the German and Jordanian medical associations. The clinic is located behind the Specialty Hospital in Al-Riyad Medical Complex, first floor.",
    },
    qualifications: [
      { ar: "البورد الأردني في الأمراض الباطنية", en: "Jordanian Board in Internal Medicine" },
      { ar: "البورد الأردني في أمراض الكلى", en: "Jordanian Board in Nephrology" },
      { ar: "البورد الألماني", en: "German Board" },
    ],
  },
  contact: {
    phone: "0799101101",
    phoneIntl: "+962799101101",
    landline: "065685354",
    landlineIntl: "+96265685354",
    // Prepared for later activation; NOT confirmed as a working WhatsApp line.
    whatsapp: "+962799101101",
    whatsappEnabled: false,
    email: null,
    // Wording exactly as supplied on the clinic's brand image.
    address: {
      ar: "خلف المستشفى التخصصي، مجمع الرياض الطبي، الطابق الأول",
      en: "Behind the Specialty Hospital, Al-Riyad Medical Complex, First Floor",
    },
    workingHours: null,
    // Exact embed supplied by the client — do not replace with a search URL.
    mapsEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3384.41496130395!2d35.900507410814285!3d31.976764724344026!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151ca194f8b5c4f5%3A0x590913a16577b185!2z2LnZitin2K_YqSDYp9mE2K_Zg9iq2YjYsSDYt9in2LHZgiDYo9io2Ygg2K3ZiNmK2Kw!5e0!3m2!1sen!2sus!4v1791705629007!5m2!1sen!2sus",
    // Same feature identifier as the embed (0x151ca194f8b5c4f5:0x590913a16577b185).
    mapsPlaceUrl:
      "https://www.google.com/maps/place/data=!4m2!3m1!1s0x151ca194f8b5c4f5:0x590913a16577b185",
  },
  social: {
    facebook: "https://www.facebook.com/DrTariqAbuHweij/",
    instagram: null,
    x: null,
    linkedin: null,
    youtube: null,
  },
  branding: {
    brandColor: "#0097F3",
    logoUrl: "/images/logo-emblem.png",
    logoUrlDark: "/images/logo-emblem-transparent.png",
  },
  footerNote: {
    ar: "عيادة الدكتور طارق أبو حويج — أمراض الباطنية والكلى في عمّان.",
    en: "Dr Tariq Abu Hweij's clinic — internal medicine and nephrology in Amman.",
  },
  updatedAt: "2026-10-11T00:00:00.000Z",
};

const SETTINGS_FILE = path.join(process.cwd(), "content", "settings.json");

/** Exported for tests: applies defaults and legacy-file migrations. */
export function mergeWithDefaults(raw: unknown): Settings {
  if (typeof raw !== "object" || raw === null) return defaultSettings;
  const data = raw as Partial<Settings>;
  const contact = { ...defaultSettings.contact, ...(data.contact ?? {}) };
  // A legacy settings file without the WhatsApp flag must stay disabled.
  if (typeof contact.whatsappEnabled !== "boolean") contact.whatsappEnabled = false;
  // Legacy files without the doctor block fall back to the verified defaults.
  const doctor = data.doctor ?? defaultSettings.doctor;
  const qualificationRows = Array.isArray(doctor.qualifications)
    ? doctor.qualifications
        .filter((q) => q && ((q.ar && q.ar.trim()) || (q.en && q.en.trim())))
        // Backfill the missing language so a row never renders blank.
        .map((q) => {
          const ar = (q.ar ?? "").trim();
          const en = (q.en ?? "").trim();
          return { ar: ar || en, en: en || ar };
        })
    : [];
  const qualifications =
    qualificationRows.length > 0 ? qualificationRows : defaultSettings.doctor.qualifications;
  return {
    ...defaultSettings,
    ...data,
    siteName: { ...defaultSettings.siteName, ...(data.siteName ?? {}) },
    tagline: { ...defaultSettings.tagline, ...(data.tagline ?? {}) },
    doctor: {
      biography: { ...defaultSettings.doctor.biography, ...(doctor.biography ?? {}) },
      qualifications,
    },
    contact,
    social: { ...defaultSettings.social, ...(data.social ?? {}) },
    branding: { ...defaultSettings.branding, ...(data.branding ?? {}) },
    footerNote: { ...defaultSettings.footerNote, ...(data.footerNote ?? {}) },
  };
}

export async function readSettings(): Promise<Settings> {
  try {
    const raw = readFileSync(SETTINGS_FILE, "utf8");
    return mergeWithDefaults(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
}

export async function writeSettings(settings: Settings): Promise<void> {
  await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
  const next: Settings = { ...settings, updatedAt: new Date().toISOString() };
  const tmp = `${SETTINGS_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  await fs.rename(tmp, SETTINGS_FILE);
}

/** National-format display number with its tel: href (international format). */
export function phoneLink(national: string | null, intl: string | null): string | null {
  const href = intl ?? national;
  if (!href) return null;
  const digits = href.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}
