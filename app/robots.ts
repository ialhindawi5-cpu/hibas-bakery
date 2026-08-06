import type { MetadataRoute } from "next";
import { siteUrl } from "./lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The admin dashboard, the API and the customers' private order-edit
        // links have no business in a search index.
        disallow: ["/admin", "/api/", "/order/edit/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
