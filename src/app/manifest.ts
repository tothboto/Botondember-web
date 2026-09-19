import type { MetadataRoute } from "next";
import { getAllSettings } from "@/lib/data/settings";

// Az adatbázisból jön, ezért minden kérésnél frissen készül.
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { general } = await getAllSettings();
  const icons = `/icons/${general.faviconVersion ?? "default"}`;
  return {
    name: general.siteName,
    short_name: general.siteName.split(" ")[0].slice(0, 12) || "Botondember",
    start_url: "/",
    display: "browser",
    background_color: "#0b1f3f",
    theme_color: "#0b1f3f",
    lang: "hu",
    icons: [
      { src: `${icons}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${icons}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
  };
}
