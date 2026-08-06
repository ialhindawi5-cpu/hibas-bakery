/**
 * Canonical public origin of the site, used for metadata, robots and the sitemap.
 *
 * Set NEXT_PUBLIC_SITE_URL once a custom domain is in place. Otherwise this falls
 * back to the Vercel-provided production domain, then to localhost for `next dev`.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}
