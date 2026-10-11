import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

import type { AnalyticsConfig } from "@/lib/analytics";

/**
 * Renders Google Analytics 4 / Google Tag Manager only when their IDs are
 * configured in environment variables. With nothing configured this renders
 * nothing at all, so a fresh deploy has zero third-party tracking.
 *
 * Privacy: only anonymised page views are measured (`anonymize_ip` is set by
 * the sibling packages). Never send form contents, names, contact details,
 * or anything health related to analytics.
 */
export default function Analytics({ config }: { config: AnalyticsConfig }) {
  if (config.gtmId) return <GoogleTagManager gtmId={config.gtmId} />;
  if (config.ga4Id) return <GoogleAnalytics gaId={config.ga4Id} />;
  return null;
}