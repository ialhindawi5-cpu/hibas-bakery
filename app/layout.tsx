import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import ScrollReveal from "./components/ScrollReveal";
import JsonLd from "./components/JsonLd";
import { getSettings, getLogoInfo, getSocialImage } from "./lib/content";
import { businessJsonLd, mergeSeo, resolvePageSeo } from "./lib/seo";
import { siteUrl } from "./lib/siteUrl";

export async function generateMetadata(): Promise<Metadata> {
  const [s, logo, social] = await Promise.all([
    getSettings(),
    getLogoInfo(),
    getSocialImage(),
  ]);
  const seo = mergeSeo(s.seo);
  const home = resolvePageSeo(s, "home");
  const favicon = `/api/favicon?v=${logo.version}`;
  const isAdmin = ((await headers()).get("x-pathname") || "").startsWith("/admin");

  return {
    // Pages set their own absolute title; this is the fallback for anything
    // without one (e.g. the 404 page).
    title: { default: home.title, template: `%s · ${s.siteName}` },
    description: home.description,
    keywords: seo.keywords.length ? seo.keywords : undefined,
    applicationName: s.siteName,
    metadataBase: new URL(siteUrl()),
    // Search-engine ownership proof, pasted from Search Console / Bing.
    verification: {
      google: seo.googleVerification || undefined,
      other: seo.bingVerification ? { "msvalidate.01": seo.bingVerification } : undefined,
    },
    // The dashboard is never a search result, whatever the public site's setting.
    robots: isAdmin || !seo.indexable ? { index: false, follow: false } : undefined,
    // With a logo set, the favicon is rendered from it so the two stay in step.
    // Without one, Next falls back to the static app/icon.png + app/apple-icon.png.
    icons: logo.hasLogo
      ? { icon: favicon, shortcut: favicon, apple: favicon }
      : undefined,
    openGraph: {
      title: home.title,
      description: home.description,
      type: "website",
      url: siteUrl(),
      siteName: s.siteName,
      locale: "en_CA",
      images: social ? [{ url: social.src, alt: s.siteName }] : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get("x-pathname") || "";
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  const [settings, logo, social] = await Promise.all([
    getSettings(),
    getLogoInfo(),
    getSocialImage(),
  ]);
  const seo = mergeSeo(settings.seo);
  return (
    <html lang="en">
      <body>
        {seo.structuredData && (
          <JsonLd data={businessJsonLd(settings, siteUrl(), social?.src ?? logo.src)} />
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('reveal-enabled')",
          }}
        />
        <SiteHeader
          siteName={settings.siteName}
          hasLogo={logo.hasLogo}
          logoSrc={logo.src}
        />
        <ScrollReveal />
        <main>{children}</main>
        <SiteFooter settings={settings} hasLogo={logo.hasLogo} logoSrc={logo.src} />
      </body>
    </html>
  );
}
