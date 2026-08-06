import type { MetadataRoute } from "next";
import { getSettings } from "./lib/content";
import { SEO_PAGES, mergeSeo, resolvePageSeo } from "./lib/seo";
import { siteUrl } from "./lib/siteUrl";

// Reflects the current Admin → SEO settings (hidden pages drop out), so it is
// generated per request rather than at build time.
export const dynamic = "force-dynamic";

// Only the public marketing pages. /admin and /order/edit/<token> are private.
const CHANGE_FREQUENCY: Record<string, "weekly" | "monthly"> = {
  home: "weekly",
  menu: "weekly",
  order: "monthly",
  about: "monthly",
  contact: "monthly",
};

const PRIORITY: Record<string, number> = {
  home: 1,
  menu: 0.9,
  order: 0.8,
  about: 0.6,
  contact: 0.6,
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const settings = await getSettings();
  const seo = mergeSeo(settings.seo);
  if (!seo.indexable) return [];

  const lastModified = new Date();
  return SEO_PAGES.filter((p) => !resolvePageSeo(settings, p.key).noindex).map((p) => ({
    url: `${base}${p.path === "/" ? "" : p.path}`,
    lastModified,
    changeFrequency: CHANGE_FREQUENCY[p.key],
    priority: PRIORITY[p.key],
  }));
}
