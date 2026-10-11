import { readFileSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { Localized } from "./article-types";

export type Settings = {
  siteName: Localized;
  tagline: Localized;
  contact: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: Localized | null;
    workingHours: Localized | null;
  };
  social: {
    facebook: string | null;
    instagram: string | null;
    x: string | null;
    linkedin: string | null;
    youtube: string | null;
  };
  /** Free-text note shown in the footer (public). */
  footerNote: Localized;
  updatedAt: string;
};

/**
 * Default public settings.
 * Every contact field is `null` on purpose: nothing has been verified yet,
 * and no phone number, address, or opening time may be invented.
 */
export const defaultSettings: Settings = {
  siteName: { ar: "د. طارق أبو هويجة", en: "Dr Tariq Abu Hweij" },
  tagline: { ar: "", en: "" },
  contact: {
    phone: null,
    whatsapp: null,
    email: null,
    address: null,
    workingHours: null,
  },
  social: {
    facebook: null,
    instagram: null,
    x: null,
    linkedin: null,
    youtube: null,
  },
  footerNote: {
    ar: "الموقع قيد التطوير — يُنشر المحتوى بعد التحقق منه.",
    en: "Website under development — content is verified before publication.",
  },
  updatedAt: "2026-10-08T00:00:00.000Z",
};

const SETTINGS_FILE = path.join(process.cwd(), "content", "settings.json");

function mergeWithDefaults(raw: unknown): Settings {
  if (typeof raw !== "object" || raw === null) return defaultSettings;
  const data = raw as Partial<Settings>;
  return {
    ...defaultSettings,
    ...data,
    siteName: { ...defaultSettings.siteName, ...(data.siteName ?? {}) },
    tagline: { ...defaultSettings.tagline, ...(data.tagline ?? {}) },
    contact: { ...defaultSettings.contact, ...(data.contact ?? {}) },
    social: { ...defaultSettings.social, ...(data.social ?? {}) },
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
