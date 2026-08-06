/**
 * Turns the admin's SEO settings into Next.js `Metadata` for a public page.
 * Kept apart from `seo.ts` so that file stays pure and importable from client
 * components (the admin preview uses it too).
 */

import type { Metadata } from "next";
import { getSettings, getSocialImage } from "./content";
import { mergeSeo, resolvePageSeo } from "./seo";
import { siteUrl } from "./siteUrl";
import type { SeoPageKey } from "./types";

export async function pageMetadata(key: SeoPageKey): Promise<Metadata> {
  const [settings, social] = await Promise.all([getSettings(), getSocialImage()]);
  const seo = mergeSeo(settings.seo);
  const page = resolvePageSeo(settings, key);
  const base = siteUrl();
  const url = `${base}${page.path === "/" ? "" : page.path}`;
  const images = social ? [{ url: social.src, alt: settings.siteName }] : undefined;

  return {
    // Absolute so the admin-entered title is exactly what Google shows —
    // no "· Bakery" suffix appended behind the owner's back.
    title: { absolute: page.title },
    description: page.description,
    keywords: seo.keywords.length ? seo.keywords : undefined,
    alternates: { canonical: url },
    robots: page.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      siteName: settings.siteName,
      type: "website",
      locale: "en_CA",
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: page.title,
      description: page.description,
      images: images?.map((i) => i.url),
    },
  };
}
