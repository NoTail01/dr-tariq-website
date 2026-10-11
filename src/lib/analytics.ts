/**
 * Google integration points.
 *
 * Every integration stays inactive until its ID is supplied through the
 * environment (see .env.example). Nothing here collects, stores, or forwards
 * personal or medical information — only anonymous page-view metadata.
 *
 * Avoid duplicate tracking:
 * - If a GTM container is configured, GA4 is NOT injected again here;
 *   add the GA4 tag inside the container instead.
 * - If only GA4 is configured, the gtag script is injected directly.
 */

export type AnalyticsConfig = {
  gtmId: string | null;
  ga4Id: string | null;
  searchConsoleVerification: string | null;
  mapsEmbedUrl: string | null;
};

function read(key: string): string | null {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : null;
}

export function getAnalyticsConfig(): AnalyticsConfig {
  const gtmId = read("NEXT_PUBLIC_GTM_ID");
  let ga4Id = read("NEXT_PUBLIC_GA4_ID");

  // Guard against double counting when both are present.
  if (gtmId && ga4Id) ga4Id = null;

  return {
    gtmId,
    ga4Id,
    searchConsoleVerification: read("NEXT_PUBLIC_GSC_VERIFICATION"),
    mapsEmbedUrl: read("NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL"),
  };
}

export const gtmEnabled = () => Boolean(getAnalyticsConfig().gtmId);
export const ga4Enabled = () => Boolean(getAnalyticsConfig().ga4Id);
