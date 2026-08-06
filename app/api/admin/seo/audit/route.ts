import { NextResponse } from "next/server";
import { getSettings, getSocialImage, hasUnpublishedChanges } from "@/app/lib/content";
import {
  DESC_MAX,
  DESC_MIN,
  SEO_PAGES,
  TITLE_MAX,
  TITLE_MIN,
  deriveOpeningHours,
  mergeSeo,
  resolvePageSeo,
} from "@/app/lib/seo";
import { siteUrl } from "@/app/lib/siteUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Status = "ok" | "warn" | "error";
type Check = { id: string; label: string; status: Status; detail: string };

/**
 * Reads the PUBLISHED settings — the ones Google actually sees — and reports
 * what still stands between the site and a good search listing.
 */
export async function GET() {
  const [settings, social, unpublished] = await Promise.all([
    getSettings(),
    getSocialImage(),
    hasUnpublishedChanges(),
  ]);
  const seo = mergeSeo(settings.seo);
  const base = siteUrl();
  const checks: Check[] = [];

  const isRealDomain = /^https:\/\//.test(base) && !base.includes("localhost");
  checks.push({
    id: "site-url",
    label: "Website address is set",
    status: isRealDomain ? "ok" : "error",
    detail: isRealDomain
      ? base
      : `Currently "${base}". Set NEXT_PUBLIC_SITE_URL to the public address so links and the sitemap point at the real site.`,
  });

  checks.push({
    id: "indexable",
    label: "Search engines are allowed in",
    status: seo.indexable ? "ok" : "error",
    detail: seo.indexable
      ? "robots.txt invites Google to crawl and index the site."
      : "“Show my website on Google” is off — every page is hidden from search results.",
  });

  checks.push({
    id: "verification",
    label: "Google Search Console verified",
    status: seo.googleVerification ? "ok" : "warn",
    detail: seo.googleVerification
      ? "Verification code is in place."
      : "Add the Search Console verification code so you can submit the sitemap and watch your traffic.",
  });

  const indexed = SEO_PAGES.map((p) => resolvePageSeo(settings, p.key));
  const hidden = indexed.filter((p) => p.noindex && seo.indexable);
  checks.push({
    id: "pages-indexed",
    label: "Pages included in the sitemap",
    status: hidden.length === 0 ? "ok" : "warn",
    detail:
      hidden.length === 0
        ? `All ${indexed.length} public pages are listed at ${base}/sitemap.xml.`
        : `Hidden from Google: ${hidden.map((p) => p.path).join(", ")}.`,
  });

  const badTitles = indexed.filter(
    (p) => p.title.length > TITLE_MAX || p.title.length < TITLE_MIN
  );
  checks.push({
    id: "titles",
    label: "Page titles are a good length",
    status: badTitles.length === 0 ? "ok" : "warn",
    detail:
      badTitles.length === 0
        ? `Every title is between ${TITLE_MIN} and ${TITLE_MAX} characters.`
        : badTitles
            .map((p) => `${p.label}: ${p.title.length} characters`)
            .join(" · ") + ` (aim for ${TITLE_MIN}–${TITLE_MAX})`,
  });

  const badDescs = indexed.filter(
    (p) => p.description.length > DESC_MAX || p.description.length < DESC_MIN
  );
  checks.push({
    id: "descriptions",
    label: "Descriptions are a good length",
    status: badDescs.length === 0 ? "ok" : "warn",
    detail:
      badDescs.length === 0
        ? `Every description is between ${DESC_MIN} and ${DESC_MAX} characters.`
        : badDescs
            .map((p) => `${p.label}: ${p.description.length} characters`)
            .join(" · ") + ` (aim for ${DESC_MIN}–${DESC_MAX})`,
  });

  const dupes = indexed
    .map((p) => p.title.toLowerCase())
    .filter((t, i, a) => a.indexOf(t) !== i);
  checks.push({
    id: "unique-titles",
    label: "Each page has its own title",
    status: dupes.length === 0 ? "ok" : "warn",
    detail:
      dupes.length === 0
        ? "No two pages share a title."
        : "Duplicate titles confuse Google — give each page a distinct one.",
  });

  checks.push({
    id: "social-image",
    label: "Share image is set",
    status: social ? "ok" : "warn",
    detail: social
      ? social.custom
        ? "A dedicated share image is in use."
        : "Falling back to the logo. A 1200×630 photo of your baking looks better in WhatsApp and Facebook."
      : "No image — shared links show a blank box. Upload one under “Sharing preview”.",
  });

  const b = seo.business;
  const hasAddress = Boolean((b.streetAddress || settings.pickup) && b.city);
  checks.push({
    id: "business-address",
    label: "Business address for local search",
    status: hasAddress ? "ok" : "warn",
    detail: hasAddress
      ? `${b.streetAddress || settings.pickup}, ${b.city}`
      : "Fill in the city (and street) under “Business details” so you can show up in local “bakery near me” results.",
  });

  const hours = b.openingHours.length ? b.openingHours : deriveOpeningHours(settings.hours);
  checks.push({
    id: "opening-hours",
    label: "Opening hours Google can read",
    status: hours.length ? "ok" : "warn",
    detail: hours.length
      ? hours.join(", ")
      : `Your hours ("${settings.hours}") couldn't be read automatically — add them under “Business details”.`,
  });

  checks.push({
    id: "structured-data",
    label: "Rich results data is on",
    status: seo.structuredData ? "ok" : "warn",
    detail: seo.structuredData
      ? "Bakery and menu details are published for Google's rich results."
      : "Turned off — Google won't see your address, hours, or menu prices.",
  });

  checks.push({
    id: "published",
    label: "Changes are published",
    status: unpublished ? "warn" : "ok",
    detail: unpublished
      ? "You have saved changes that aren't live yet. Click “Publish to website”."
      : "The live site matches your saved settings.",
  });

  const score = Math.round(
    (checks.filter((c) => c.status === "ok").length / checks.length) * 100
  );

  return NextResponse.json({
    siteUrl: base,
    score,
    checks,
    sitemap: `${base}/sitemap.xml`,
    robots: `${base}/robots.txt`,
  });
}
