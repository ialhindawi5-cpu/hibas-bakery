import type { MetadataRoute } from "next";
import { getSettings } from "./lib/content";
import { mergeSeo } from "./lib/seo";
import { siteUrl } from "./lib/siteUrl";

// Driven by Admin → SEO, so it has to be generated per request rather than baked
// in at build time.
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = siteUrl();
  const seo = mergeSeo((await getSettings()).seo);

  // Master switch off: ask every crawler to stay out entirely.
  if (!seo.indexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The admin dashboard, the API and the customers' private order-edit
        // links have no business in a search index.
        //
        // Pages the owner marked "hide from Google" are deliberately NOT listed
        // here: a blocked page can't be crawled, so Google would never see its
        // noindex tag and could still index the URL from a link elsewhere.
        // Crawlable + noindex is what actually removes a page.
        disallow: ["/admin", "/api/", "/order/edit/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
