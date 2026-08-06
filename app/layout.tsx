import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import ScrollReveal from "./components/ScrollReveal";
import { getSettings, getLogoInfo } from "./lib/content";
import { siteUrl } from "./lib/siteUrl";

export async function generateMetadata(): Promise<Metadata> {
  const [s, logo] = await Promise.all([getSettings(), getLogoInfo()]);
  const favicon = `/api/favicon?v=${logo.version}`;
  return {
    title: {
      default: s.siteName,
      template: `%s · ${s.siteName}`,
    },
    description: `Fresh-baked cookies, Arab desserts, cheesecake, and sourdough breads. Order online from ${s.siteName} for pickup at ${s.pickup}.`,
    metadataBase: new URL(siteUrl()),
    // With a logo set, the favicon is rendered from it so the two stay in step.
    // Without one, Next falls back to the static app/icon.png + app/apple-icon.png.
    icons: logo.hasLogo
      ? { icon: favicon, shortcut: favicon, apple: favicon }
      : undefined,
    openGraph: {
      title: s.siteName,
      description:
        "Fresh-baked cookies, Arab desserts, cheesecake, and sourdough breads. Order online.",
      type: "website",
      url: siteUrl(),
      siteName: s.siteName,
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

  const [settings, logo] = await Promise.all([getSettings(), getLogoInfo()]);
  return (
    <html lang="en">
      <body>
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
