import { doctor } from "@/content/doctor";
import { localizePath, type Locale } from "@/i18n/config";
import { defaultSettings, type Settings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";

/**
 * Shared schema.org nodes.
 *
 * Every field below is traceable to a verified source in
 * src/content/doctor.ts or to the clinic's published settings. Nothing is
 * invented: no ratings, no review counts, no opening hours and no address
 * beyond the wording the clinic supplied.
 */

export const ORGANIZATION_ID = SITE_URL + "/#organization";
export const PHYSICIAN_ID = SITE_URL + "/#physician";
export const CLINIC_ID = SITE_URL + "/#clinic";
export const WEBSITE_ID = SITE_URL + "/#website";

/** Stable Blog entity id shared by the blog index and article pages. */
export function blogId(locale: Locale): string {
  return SITE_URL + localizePath(locale, "/blog") + "#blog";
}

const PORTRAIT = "/images/dr-tariq-portrait.png";
const PORTRAIT_WIDTH = 1200;
const PORTRAIT_HEIGHT = 960;
const LOGO = "/images/logo-emblem.png";
const LOGO_WIDTH = 164;
const LOGO_HEIGHT = 170;

/** ISO 639-1 codes for the five languages listed on the hospital profile. */
const LANGUAGE_CODES = ["ar", "en", "de", "it", "ro"] as const;

function absolute(path: string): string {
  return path.startsWith("http") ? path : SITE_URL + path;
}

function socialProfiles(settings: Settings): string[] {
  return Object.values(settings.social).filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
}

function phoneNumbers(settings: Settings): string[] {
  return [settings.contact.phoneIntl, settings.contact.landlineIntl].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
}

function contactPoints(settings: Settings) {
  return phoneNumbers(settings).map((telephone) => ({
    "@type": "ContactPoint",
    telephone,
    contactType: "appointments",
    availableLanguage: ["Arabic", "English"],
  }));
}

export function organizationNode(locale: Locale, settings: Settings) {
  const profiles = socialProfiles(settings);
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: settings.siteName[locale] || defaultSettings.siteName[locale],
    url: SITE_URL + localizePath(locale, "/"),
    logo: {
      "@type": "ImageObject",
      url: absolute(LOGO),
      width: LOGO_WIDTH,
      height: LOGO_HEIGHT,
    },
    ...(profiles.length > 0 ? { sameAs: profiles } : {}),
  };
}

export function websiteNode(locale: Locale, settings: Settings) {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL + localizePath(locale, "/"),
    name: settings.siteName[locale] || defaultSettings.siteName[locale],
    inLanguage: locale,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function physicianNode(locale: Locale, settings: Settings) {
  const profiles = socialProfiles(settings);
  const phones = phoneNumbers(settings);

  return {
    "@type": "Physician",
    "@id": PHYSICIAN_ID,
    name: doctor.fullName[locale],
    alternateName: doctor.fullName[locale === "ar" ? "en" : "ar"],
    honorificPrefix: doctor.honorific[locale],
    jobTitle: doctor.professionalTitle[locale],
    url: SITE_URL + localizePath(locale, "/about"),
    image: {
      "@type": "ImageObject",
      url: absolute(PORTRAIT),
      width: PORTRAIT_WIDTH,
      height: PORTRAIT_HEIGHT,
    },
    medicalSpecialty: ["InternalMedicine", "Nephrology", "Hypertension"],
    // Only asserted when the hospital profile is the recorded source.
    ...(doctor.languagesSource ? { knowsLanguage: [...LANGUAGE_CODES] } : {}),
    hasCredential: doctor.qualifications.map((qualification) => ({
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "certification",
      name: qualification[locale],
    })),
    ...(phones.length > 0 ? { telephone: phones[0] } : {}),
    ...(phones.length > 0 ? { contactPoint: contactPoints(settings) } : {}),
    ...(profiles.length > 0 ? { sameAs: profiles } : {}),
    workLocation: { "@id": CLINIC_ID },
  };
}

export function clinicNode(locale: Locale, settings: Settings) {
  const profiles = socialProfiles(settings);
  const phones = phoneNumbers(settings);
  const clinicLabel = locale === "ar" ? "العيادة" : "Clinic";

  return {
    "@type": "MedicalClinic",
    "@id": CLINIC_ID,
    name:
      (settings.siteName[locale] || defaultSettings.siteName[locale]) +
      " \u2014 " +
      clinicLabel,
    url: SITE_URL + localizePath(locale, "/book"),
    image: {
      "@type": "ImageObject",
      url: absolute(PORTRAIT),
      width: PORTRAIT_WIDTH,
      height: PORTRAIT_HEIGHT,
    },
    medicalSpecialty: ["InternalMedicine", "Nephrology", "Hypertension"],
    physician: { "@id": PHYSICIAN_ID },
    ...(phones.length > 0 ? { telephone: phones[0] } : {}),
    ...(phones.length > 0 ? { contactPoint: contactPoints(settings) } : {}),
    ...(settings.contact.mapsPlaceUrl ? { hasMap: settings.contact.mapsPlaceUrl } : {}),
    ...(profiles.length > 0 ? { sameAs: profiles } : {}),
  };
}

export function breadcrumbNode(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Wraps nodes in a single graph so shared id references resolve. */
export function jsonLdGraph(nodes: Record<string, unknown>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
