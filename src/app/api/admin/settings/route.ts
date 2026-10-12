import { NextResponse } from "next/server";

import { guardAdmin } from "@/lib/admin-api";
import { defaultSettings, readSettings, writeSettings, type Settings } from "@/lib/settings";

type Localized = { ar: string; en: string };

const LIMITS = { text: 200, long: 400, contact: 60, url: 400 } as const;

function str(value: unknown, max: number, fallback = ""): string {
  return typeof value === "string" ? value.trim().slice(0, max) : fallback;
}

function localized(value: unknown, max: number): Localized {
  const source = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  return { ar: str(source.ar, max), en: str(source.en, max) };
}

function nullableLocalized(value: unknown, max: number): Localized | null {
  const result = localized(value, max);
  return result.ar || result.en ? result : null;
}

function nullableContact(value: unknown, key: "phone" | "whatsapp" | "email"): string | null {
  const result = str(value, LIMITS.contact);
  if (!result) return null;
  if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(result)) return null;
  if (key !== "email" && !/^\+?[0-9()\s-]{6,24}$/.test(result)) return null;
  return result;
}

function nullableUrl(value: unknown): string | null {
  const result = str(value, LIMITS.url);
  if (!result) return null;
  return /^https?:\/\//i.test(result) ? result : null;
}

/** Bilingual doctor biography — capped to keep the public page readable. */
function doctorBiography(value: unknown): Localized {
  const result = localized(value, 4000);
  return {
    ar: result.ar || defaultSettings.doctor.biography.ar,
    en: result.en || defaultSettings.doctor.biography.en,
  };
}

/** Bilingual qualification list — max 8 items, empty rows dropped. */
function doctorQualifications(value: unknown): { ar: string; en: string }[] {
  if (!Array.isArray(value)) return defaultSettings.doctor.qualifications;
  const items = value
    .slice(0, 8)
    .map((entry) => localized(entry, 200))
    .filter((entry) => entry.ar || entry.en)
    .map((entry) => ({ ar: entry.ar || entry.en, en: entry.en || entry.ar }));
  return items.length > 0 ? items : defaultSettings.doctor.qualifications;
}

/** Google Maps embed URL — only google.com/maps/embed URLs are accepted. */
function mapsEmbed(value: unknown): string | null {
  const result = str(value, 1200);
  if (!result) return null;
  try {
    const parsed = new URL(result);
    const host = parsed.hostname.replace(/^www\./, "");
    const isEmbed = parsed.pathname.startsWith("/maps/embed");
    return host === "google.com" && isEmbed ? result : null;
  } catch {
    return null;
  }
}

/** Local asset path (e.g. /images/logo-emblem.png) or an absolute URL. */
function assetPath(value: unknown): string | null {
  const result = str(value, LIMITS.url);
  if (!result) return null;
  return /^\/(?!\/)/.test(result) || /^https?:\/\//i.test(result) ? result : null;
}

/** GET /api/admin/settings — site settings (authenticated only). */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;

  const settings = await readSettings();
  return NextResponse.json(
    { ok: true, settings },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** PATCH /api/admin/settings — validated update of public site settings. */
export async function PATCH(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, errors: { _: "Invalid JSON body." } }, { status: 400 });
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json({ ok: false, errors: { _: "Invalid payload." } }, { status: 400 });
  }

  const raw = payload as Record<string, unknown>;
  const current = await readSettings();

  const contactRaw = (raw.contact ?? {}) as Record<string, unknown>;
  const socialRaw = (raw.social ?? {}) as Record<string, unknown>;
  const brandingRaw = (raw.branding ?? {}) as Record<string, unknown>;
  const doctorRaw = (raw.doctor ?? {}) as Record<string, unknown>;
  const currentBranding = current.branding ?? defaultSettings.branding;
  const currentDoctor = current.doctor ?? defaultSettings.doctor;

  const next: Settings = {
    siteName: localized(raw.siteName ?? current.siteName, LIMITS.text) || defaultSettings.siteName,
    tagline: localized(raw.tagline ?? current.tagline, LIMITS.long),
    doctor: {
      biography: doctorBiography(doctorRaw.biography ?? currentDoctor.biography),
      qualifications: doctorQualifications(
        doctorRaw.qualifications ?? currentDoctor.qualifications,
      ),
    },
    contact: {
      phone: nullableContact(contactRaw.phone, "phone"),
      phoneIntl: nullableContact(contactRaw.phoneIntl, "phone"),
      landline: nullableContact(contactRaw.landline, "phone"),
      landlineIntl: nullableContact(contactRaw.landlineIntl, "phone"),
      whatsapp: nullableContact(contactRaw.whatsapp, "whatsapp"),
      // Never activated implicitly: only an explicit boolean turns it on.
      whatsappEnabled: contactRaw.whatsappEnabled === true,
      email: nullableContact(contactRaw.email, "email"),
      address: nullableLocalized(contactRaw.address, LIMITS.long),
      workingHours: nullableLocalized(contactRaw.workingHours, LIMITS.long),
      mapsEmbedUrl: mapsEmbed(contactRaw.mapsEmbedUrl),
      mapsPlaceUrl: nullableUrl(contactRaw.mapsPlaceUrl),
    },
    social: {
      facebook: nullableUrl(socialRaw.facebook),
      instagram: nullableUrl(socialRaw.instagram),
      x: nullableUrl(socialRaw.x),
      linkedin: nullableUrl(socialRaw.linkedin),
      youtube: nullableUrl(socialRaw.youtube),
    },
    branding: {
      brandColor: /^#[0-9a-fA-F]{6}$/.test(str(brandingRaw.brandColor, 7))
        ? str(brandingRaw.brandColor, 7)
        : currentBranding.brandColor,
      logoUrl: assetPath(brandingRaw.logoUrl),
      logoUrlDark: assetPath(brandingRaw.logoUrlDark),
    },
    footerNote: localized(raw.footerNote ?? current.footerNote, LIMITS.long),
    updatedAt: current.updatedAt,
  };

  if (!next.siteName.ar || !next.siteName.en) {
    return NextResponse.json(
      { ok: false, errors: { siteName: "Site name is required in both languages." } },
      { status: 400 },
    );
  }

  await writeSettings(next);
  return NextResponse.json({ ok: true, settings: next });
}
