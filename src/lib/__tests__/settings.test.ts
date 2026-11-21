import { describe, expect, it } from "vitest";

import {
  defaultSettings,
  mergeWithDefaults,
  phoneLink,
  type Settings,
} from "@/lib/settings";

describe("phoneLink", () => {
  it("builds a tel: link from the international format", () => {
    expect(phoneLink("0799101101", "+962799101101")).toBe("tel:+962799101101");
    expect(phoneLink("065685354", "+96265685354")).toBe("tel:+96265685354");
  });

  it("falls back to the national number when no international form exists", () => {
    expect(phoneLink("0799101101", null)).toBe("tel:0799101101");
  });

  it("returns null for missing numbers", () => {
    expect(phoneLink(null, null)).toBeNull();
    expect(phoneLink("", "+962799101101")).toBe("tel:+962799101101");
  });
});

describe("defaultSettings", () => {
  it("keeps WhatsApp disabled until independent confirmation", () => {
    expect(defaultSettings.contact.whatsappEnabled).toBe(false);
    expect(defaultSettings.contact.whatsapp).toBe("+962799101101");
  });

  it("carries the localized prefilled WhatsApp message", () => {
    expect(defaultSettings.contact.whatsappMessage?.ar).toContain("المواعيد المتاحة");
    expect(defaultSettings.contact.whatsappMessage?.ar).toContain("طارق أبو حويج");
    expect(defaultSettings.contact.whatsappMessage?.en).toContain("available appointment times");
  });

  it("publishes only the supplied clinic numbers", () => {
    expect(defaultSettings.contact.phone).toBe("0799101101");
    expect(defaultSettings.contact.phoneIntl).toBe("+962799101101");
    expect(defaultSettings.contact.landline).toBe("065685354");
    expect(defaultSettings.contact.landlineIntl).toBe("+96265685354");
    // The hospital switchboard must never appear as the clinic number.
    expect(JSON.stringify(defaultSettings)).not.toContain("200 1111");
  });

  it("stores the exact client-supplied maps embed", () => {
    // The feature id inside the embed is URL-encoded (%3A for the colon).
    expect(defaultSettings.contact.mapsEmbedUrl).toContain("/maps/embed?pb=");
    expect(defaultSettings.contact.mapsEmbedUrl).toContain("0x151ca194f8b5c4f5%3A0x590913a16577b185");
  });

  it("carries a bilingual biography and the four verified boards in order", () => {
    expect(defaultSettings.doctor.biography.ar.length).toBeGreaterThan(50);
    expect(defaultSettings.doctor.biography.en.length).toBeGreaterThan(50);
    expect(defaultSettings.doctor.qualifications).toEqual([
      {
        ar: "البورد الألماني في الأمراض الباطنية",
        en: "German Board in Internal Medicine",
      },
      {
        ar: "البورد الألماني في أمراض الكلى وزراعة الكلى وضغط الدم",
        en: "German Board in Nephrology, Kidney Transplantation and Hypertension",
      },
      {
        ar: "البورد الأردني في الأمراض الباطنية",
        en: "Jordanian Board in Internal Medicine",
      },
      {
        ar: "البورد الأردني في أمراض الكلى",
        en: "Jordanian Board in Nephrology",
      },
    ]);
  });
});

describe("mergeWithDefaults", () => {
  const base: Settings = defaultSettings;

  it("keeps WhatsApp disabled for legacy files without the flag", () => {
    const legacy = {
      ...base,
      contact: {
        ...base.contact,
        phone: "0799101101",
        phoneIntl: "+962799101101",
      },
    } as Record<string, unknown>;
    delete (legacy.contact as Record<string, unknown>).whatsappEnabled;

    const merged = mergeWithDefaults(legacy);
    expect(merged.contact.whatsappEnabled).toBe(false);
    expect(merged.contact.phone).toBe("0799101101");
  });

  it("fills the doctor block for legacy files without it", () => {
    const legacy = { siteName: base.siteName, tagline: base.tagline } as Record<string, unknown>;
    const merged = mergeWithDefaults(legacy);
    expect(merged.doctor.biography.en).toBe(base.doctor.biography.en);
    expect(merged.doctor.qualifications).toHaveLength(4);
  });

  it("ignores unsourced qualification edits", () => {
    const merged = mergeWithDefaults({
      ...base,
      doctor: {
        biography: base.doctor.biography,
        qualifications: [{ ar: "Invented credential", en: "Invented credential" }],
      },
    });
    expect(merged.doctor.qualifications).toEqual(defaultSettings.doctor.qualifications);
  });

  it("keeps verified qualifications when an empty list is stored", () => {
    const merged = mergeWithDefaults({
      ...base,
      doctor: { biography: base.doctor.biography, qualifications: [] },
    });
    expect(merged.doctor.qualifications).toHaveLength(4);
  });
});
