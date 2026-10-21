import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/obrigado1", "/obrigado2"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
