import type { Metadata, Viewport } from "next";
import { InlineScript } from "@/components/InlineScript";
import { ThemeManager } from "@/components/theme/ThemeManager";
import { brandCss } from "@/lib/brand-css";
import { getLocalizer } from "@/lib/content-i18n/localize";
import { getAllSettings } from "@/lib/data/settings";
import { getI18n } from "@/lib/i18n/server";
import { siteUrl } from "@/lib/site-url";
import { themeScript } from "@/lib/theme";
import { fontVariables } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const [{ general }, l] = await Promise.all([getAllSettings(), getLocalizer()]);
  const siteName = l.get("settings", "general", "siteName", general.siteName).text;
  const icons = `/icons/${general.faviconVersion ?? "default"}`;
  return {
    metadataBase: siteUrl(),
    title: { default: siteName, template: `%s · ${siteName}` },
    applicationName: siteName,
    // Alapból rejtve a keresők elől (az Adminban kapcsolható).
    robots: general.noindex ? { index: false, follow: false } : { index: true, follow: true },
    icons: {
      icon: [
        { url: `${icons}/icon-32.png`, sizes: "32x32", type: "image/png" },
        { url: `${icons}/icon-16.png`, sizes: "16x16", type: "image/png" },
        { url: `${icons}/icon-192.png`, sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: `${icons}/apple-touch-icon.png`, sizes: "180x180" }],
      shortcut: ["/favicon.ico"],
    },
    manifest: "/manifest.webmanifest",
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1f3f" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [{ locale }, settings] = await Promise.all([getI18n(), getAllSettings()]);
  const defaultTheme = settings.general.defaultTheme;
  return (
    <html lang={locale} className={fontVariables} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* A téma még az első kirajzolás előtt beáll → nincs villanás. */}
        <InlineScript html={themeScript(defaultTheme)} />
        {/* Az Adminban beállított márkaszínek és betűk. */}
        <style dangerouslySetInnerHTML={{ __html: brandCss(settings.appearance) }} />
      </head>
      <body>
        <ThemeManager defaultMode={defaultTheme} />
        {children}
      </body>
    </html>
  );
}
