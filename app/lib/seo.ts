/**
 * SEO model + helpers.
 *
 * Everything here is pure (no DB, no next/headers) so the same code can render
 * the live preview in the admin dashboard and the real metadata on the server.
 *
 * Titles and descriptions support a few tokens — {siteName}, {pickup}, {phone},
 * {hours}, {city} — so the defaults keep working after the bakery renames itself
 * or moves, without anyone editing five pages by hand.
 */

import type {
  PricedMenuCategory,
  Seo,
  SeoBusiness,
  SeoPage,
  SeoPageKey,
  Settings,
} from "./types";

export const SEO_PAGES: { key: SeoPageKey; path: string; label: string }[] = [
  { key: "home", path: "/", label: "Home page" },
  { key: "menu", path: "/menu", label: "Menu" },
  { key: "order", path: "/order", label: "Order form" },
  { key: "about", path: "/about", label: "About" },
  { key: "contact", path: "/contact", label: "Contact" },
];

// Google truncates around these lengths, so the admin flags anything outside.
export const TITLE_MAX = 60;
export const TITLE_MIN = 25;
export const DESC_MAX = 160;
export const DESC_MIN = 70;

const DEFAULT_PAGES: Record<SeoPageKey, SeoPage> = {
  home: {
    title: "{siteName} — Homemade Cookies, Arab Desserts & Sourdough",
    description:
      "Handmade cookies, Arab desserts, cheesecake and sourdough breads, baked fresh to order. Order online for pickup at {pickup}.",
    noindex: false,
  },
  menu: {
    title: "Menu & Prices — {siteName}",
    description:
      "Browse the full menu: crinkle cookies, chocolate chip cookies, Arab desserts, cheesecake and sourdough breads — all baked fresh to order.",
    noindex: false,
  },
  order: {
    title: "Place an Order — {siteName}",
    description:
      "Order fresh homemade treats for pickup. Pick your items, choose a pickup date and time, and we'll confirm availability with you.",
    noindex: false,
  },
  about: {
    title: "About {siteName} — Homemade Baking, Made to Order",
    description:
      "The story behind {siteName} — homemade cookies, Arab desserts, cheesecake and sourdough breads, baked by hand in small batches.",
    noindex: false,
  },
  contact: {
    title: "Contact & Pickup — {siteName}",
    description:
      "Get in touch with {siteName} — phone, email, Instagram, opening hours and the pickup location at {pickup}.",
    noindex: false,
  },
};

const DEFAULT_BUSINESS: SeoBusiness = {
  type: "Bakery",
  streetAddress: "",
  city: "",
  region: "",
  postalCode: "",
  country: "CA",
  latitude: "",
  longitude: "",
  priceRange: "$$",
  servesCuisine: ["Bakery", "Desserts", "Middle Eastern"],
  openingHours: [],
  sameAs: [],
};

export const DEFAULT_SEO: Seo = {
  indexable: true,
  keywords: [
    "homemade bakery",
    "cookies",
    "Arab desserts",
    "cheesecake",
    "sourdough bread",
    "order cookies online",
  ],
  googleVerification: "",
  bingVerification: "",
  structuredData: true,
  pages: DEFAULT_PAGES,
  business: DEFAULT_BUSINESS,
};

/**
 * Settings are merged shallowly against DEFAULT_SETTINGS, which would drop any
 * SEO sub-key added after a site was already saved. Merge the nested shape here
 * so new fields always arrive with a sensible value.
 */
export function mergeSeo(partial?: Partial<Seo> | null): Seo {
  const p = partial ?? {};
  const pages = {} as Record<SeoPageKey, SeoPage>;
  for (const { key } of SEO_PAGES) {
    pages[key] = { ...DEFAULT_PAGES[key], ...(p.pages?.[key] ?? {}) };
  }
  return {
    ...DEFAULT_SEO,
    ...p,
    pages,
    business: { ...DEFAULT_BUSINESS, ...(p.business ?? {}) },
  };
}

/** Replace {siteName}-style tokens with the live settings values. */
export function applyTokens(text: string, s: Settings): string {
  if (!text) return "";
  const city = s.seo?.business?.city ?? "";
  return text
    .replace(/\{siteName\}/g, s.siteName ?? "")
    .replace(/\{pickup\}/g, s.pickup ?? "")
    .replace(/\{phone\}/g, s.phoneDisplay ?? "")
    .replace(/\{hours\}/g, s.hours ?? "")
    .replace(/\{city\}/g, city)
    .replace(/\s{2,}/g, " ")
    .trim();
}

export type ResolvedPageSeo = {
  key: SeoPageKey;
  path: string;
  label: string;
  title: string;
  description: string;
  noindex: boolean;
};

/** The title/description/index state a page will actually ship with. */
export function resolvePageSeo(s: Settings, key: SeoPageKey): ResolvedPageSeo {
  const seo = mergeSeo(s.seo);
  const def = DEFAULT_PAGES[key];
  const page = seo.pages[key];
  const meta = SEO_PAGES.find((p) => p.key === key)!;
  return {
    key,
    path: meta.path,
    label: meta.label,
    title: applyTokens(page.title.trim() || def.title, s),
    description: applyTokens(page.description.trim() || def.description, s),
    // The master switch overrides the per-page choice.
    noindex: !seo.indexable || Boolean(page.noindex),
  };
}

/* ---------------- Opening hours ---------------- */

const DAY_CODES: [RegExp, string][] = [
  [/^mon/i, "Mo"],
  [/^tue/i, "Tu"],
  [/^wed/i, "We"],
  [/^thu/i, "Th"],
  [/^fri/i, "Fr"],
  [/^sat/i, "Sa"],
  [/^sun/i, "Su"],
];

function dayCode(word: string): string | null {
  for (const [re, code] of DAY_CODES) if (re.test(word)) return code;
  return null;
}

function to24h(h: number, min: number, ampm: string | undefined): string {
  let hh = h;
  if (ampm) {
    hh = h % 12;
    if (/^p/i.test(ampm)) hh += 12;
  }
  return `${String(hh).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/**
 * Best-effort schema.org opening hours from the free-text "Working hours"
 * setting (e.g. "Monday – Saturday · 11am – 7pm" → "Mo-Sa 11:00-19:00").
 * Returns [] when the text can't be read with confidence — a wrong opening
 * time in structured data is worse than none.
 */
export function deriveOpeningHours(hours: string): string[] {
  if (!hours) return [];

  // "Every day", "Daily", "7 days a week" — all unambiguously Monday–Sunday.
  const days = /\b(every ?day|daily|7 days)\b/i.test(hours)
    ? ["Mo", "Su"]
    : [...hours.matchAll(/[A-Za-z]{3,9}/g)]
        .map((m) => dayCode(m[0]))
        .filter((d): d is string => d !== null);

  const times = [...hours.matchAll(/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?/gi)].map((m) =>
    to24h(Number(m[1]), Number(m[2] || 0), m[3])
  );
  const times24 = [...hours.matchAll(/\b(\d{1,2}):(\d{2})\b/g)]
    .filter((m) => Number(m[1]) <= 23 && Number(m[2]) <= 59)
    .map((m) => to24h(Number(m[1]), Number(m[2]), undefined));

  const t = times.length >= 2 ? times : times24;
  if (t.length < 2 || days.length === 0) return [];

  const span = days.length >= 2 ? `${days[0]}-${days[days.length - 1]}` : days[0];
  return [`${span} ${t[0]}-${t[t.length - 1]}`];
}

/* ---------------- Structured data (JSON-LD) ---------------- */

function coords(s: Settings): { lat: string; lng: string } | null {
  const b = mergeSeo(s.seo).business;
  if (b.latitude && b.longitude) return { lat: b.latitude.trim(), lng: b.longitude.trim() };
  // The Contact page map already stores "lat,lng" for many sites — reuse it.
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(s.mapQuery || "");
  return m ? { lat: m[1], lng: m[2] } : null;
}

/**
 * LocalBusiness data for the whole site. Deliberately omits aggregateRating:
 * the testimonials list ships with seeded examples, and marking those up as
 * real review scores is exactly what earns a structured-data penalty.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function businessJsonLd(s: Settings, base: string, imageUrl?: string | null): any {
  const seo = mergeSeo(s.seo);
  const b = seo.business;
  const geo = coords(s);
  const openingHours = b.openingHours.length ? b.openingHours : deriveOpeningHours(s.hours);
  const sameAs = [s.instagram, ...b.sameAs].map((u) => u.trim()).filter(Boolean);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {
    "@context": "https://schema.org",
    "@type": b.type || "Bakery",
    "@id": `${base}/#business`,
    name: s.siteName,
    description: resolvePageSeo(s, "home").description,
    url: base,
    telephone: s.phoneLink || s.phoneDisplay,
    email: s.contactEmail,
    priceRange: b.priceRange,
    address: {
      "@type": "PostalAddress",
      streetAddress: b.streetAddress || s.pickup,
      addressLocality: b.city,
      addressRegion: b.region,
      postalCode: b.postalCode,
      addressCountry: b.country,
    },
    hasMenu: `${base}/menu`,
    potentialAction: {
      "@type": "OrderAction",
      target: `${base}/order`,
    },
  };

  if (imageUrl) data.image = imageUrl.startsWith("http") ? imageUrl : `${base}${imageUrl}`;
  if (geo) data.geo = { "@type": "GeoCoordinates", latitude: geo.lat, longitude: geo.lng };
  if (openingHours.length) data.openingHours = openingHours;
  if (sameAs.length) data.sameAs = sameAs;
  if (b.servesCuisine.length) data.servesCuisine = b.servesCuisine;

  return prune(data);
}

/** The priced menu, marked up so Google can show items and prices. */
export function menuJsonLd(
  categories: PricedMenuCategory[],
  base: string,
  siteName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any | null {
  const sections = categories
    .map((c) => ({
      "@type": "MenuSection",
      name: c.category || siteName,
      hasMenuItem: c.items.map((i) => {
        const price = i.price.replace(/[^\d.]/g, "");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item: any = { "@type": "MenuItem", name: i.name };
        if (price) {
          item.offers = { "@type": "Offer", price, priceCurrency: "CAD" };
        }
        return item;
      }),
    }))
    .filter((s) => s.hasMenuItem.length > 0);

  if (!sections.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `${base}/menu#menu`,
    name: `${siteName} Menu`,
    url: `${base}/menu`,
    hasMenuSection: sections,
  };
}

/** Drop empty strings/arrays so the emitted JSON-LD stays clean. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function prune(obj: any): any {
  if (Array.isArray(obj)) return obj.map(prune).filter((v) => v !== undefined);
  if (obj && typeof obj === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      const pv = prune(v);
      if (pv === undefined || pv === "" || (Array.isArray(pv) && pv.length === 0)) continue;
      if (pv && typeof pv === "object" && !Array.isArray(pv) && Object.keys(pv).length <= 1) {
        // an object that only carries its @type is noise
        continue;
      }
      out[k] = pv;
    }
    return out;
  }
  return obj;
}
