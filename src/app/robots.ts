import type { MetadataRoute } from "next";

import { isIndexableSite, SITE_URL } from "@/lib/site";

/**
 * Robots configuration.
 * The dashboard, API routes, previews and unconfigured builds stay out of search indexes.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexableSite()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
