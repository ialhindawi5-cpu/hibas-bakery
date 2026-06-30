import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import { getSettings, getLogoInfo } from "./lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const [s, logo] = await Promise.all([getSettings(), getLogoInfo()]);
  return {
    title: {
      default: s.siteName,
      template: `%s · ${s.siteName}`,
    },
    description: `Fresh-baked cookies, Arab desserts, cheesecake, and sourdough breads. Order online from ${s.siteName} for pickup at ${s.pickup}.`,
    metadataBase: new URL("https://example.com"),
    icons: logo.hasLogo
      ? { icon: "/api/favicon", shortcut: "/api/favicon", apple: "/api/favicon" }
      : undefined,
    openGraph: {
      title: s.siteName,
      description:
        "Fresh-baked cookies, Arab desserts, cheesecake, and sourdough breads. Order online.",
      type: "website",
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
        <SiteHeader
          siteName={settings.siteName}
          hasLogo={logo.hasLogo}
          logoSrc={logo.src}
        />
        <main>{children}</main>
        <SiteFooter settings={settings} />
      </body>
    </html>
  );
}
