import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * Robots configuration.
 * The dashboard, API routes and previews stay out of search indexes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
