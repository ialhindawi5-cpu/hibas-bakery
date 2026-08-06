/* ---------------- SEO ---------------- */

// The public pages we let the admin tune individually.
export type SeoPageKey = "home" | "menu" | "order" | "about" | "contact";

export type SeoPage = {
  // Blank falls back to the built-in default for that page.
  title: string;
  description: string;
  // Keep the page on the site but out of Google's index.
  noindex: boolean;
};

// Feeds the LocalBusiness/Bakery structured data Google reads for the
// "business card" panel, maps and local results.
export type SeoBusiness = {
  type: string; // schema.org type, e.g. "Bakery"
  streetAddress: string;
  city: string;
  region: string; // province / state
  postalCode: string;
  country: string; // 2-letter code, e.g. "CA"
  latitude: string;
  longitude: string;
  priceRange: string; // e.g. "$$"
  servesCuisine: string[];
  openingHours: string[]; // schema.org format, e.g. "Mo-Sa 11:00-19:00"
  sameAs: string[]; // extra profile URLs (Instagram is added automatically)
};

export type Seo = {
  // Master switch. Off ⇒ robots.txt disallows everything and every page is noindex.
  indexable: boolean;
  keywords: string[];
  googleVerification: string; // Search Console "HTML tag" content value
  bingVerification: string;
  structuredData: boolean; // emit JSON-LD
  pages: Record<SeoPageKey, SeoPage>;
  business: SeoBusiness;
};

export type Settings = {
  siteName: string;
  seo: Seo;
  orderEmail: string;
  contactEmail: string;
  phoneDisplay: string;
  phoneLink: string;
  instagram: string;
  instagramHandle: string;
  pickup: string;
  hours: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutBody: string;
  aboutEyebrow: string;
  aboutHeadline: string;
  aboutIntro: string;
  aboutSectionEyebrow: string;
  aboutHeading: string;
  aboutBody2: string;
  aboutFeatures: string[];
  promiseEyebrow: string;
  promiseHeading: string;
  aboutValues: string[];
  aboutImage: string;
  aboutCtaHeading: string;
  aboutCtaText: string;
  footerText: string;
  orderSuccessTitle: string;
  orderSuccessMessage: string;
  pickupSlots: string[];
  blockedDates: string[];
  mapQuery: string;
  announcements: string[];
};

export type MenuItem = {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string | null;
  emoji: string;
  sortOrder: number;
  active: boolean;
  featured: boolean;
};

// A view-only, categorized price list derived from the order form's priced
// options (lines starting with "## " are category headings).
export type PricedMenuItem = { name: string; price: string };
export type PricedMenuCategory = { category: string; items: PricedMenuItem[] };

export type GalleryImage = {
  id: number;
  src: string;
  alt: string;
  sortOrder: number;
};

export type QuestionType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "date"
  | "time"
  | "radio"
  | "checkbox"
  | "menu";

// A role lets the system map an answer to a known field (for display + email reply-to).
export type QuestionRole = "none" | "name" | "phone" | "email" | "date" | "time" | "items";

export type Question = {
  id: number;
  qkey: string;
  label: string;
  type: QuestionType;
  options: string[];
  required: boolean;
  role: QuestionRole;
  sortOrder: number;
  active: boolean;
};

export type OrderAnswer = { label: string; value: string };

export type Order = {
  id: number;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  pickupDate: string;
  pickupTime: string;
  answers: OrderAnswer[];
  status: "new" | "confirmed" | "completed" | "cancelled";
  // Present on customer-submitted orders: secret edit token + saved form state.
  editToken?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formState?: { values: Record<string, any>; qty: Record<string, number> };
  // Set when the customer changes/cancels their own order (ISO timestamps).
  editedAt?: string | null;
  cancelledAt?: string | null;
};
