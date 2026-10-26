import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Everything public may be indexed; account pages and the sign-in callback
// have nothing for search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/auth/", "/en/me", "/es/me", "/en/admin", "/es/admin"] },
    sitemap: new URL("/sitemap.xml", SITE_URL).href,
  };
}
