import type { MetadataRoute } from "next";
import { getVisiblePages, pageHref } from "@/lib/data/pages";
import { getAllSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/**
 * Oldaltérkép a keresőknek (/sitemap.xml). Amíg az oldal rejtve van a keresők
 * elől (Admin > Általános), üres – nincs értelme felsorolni az oldalakat.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ general }, pages] = await Promise.all([getAllSettings(), getVisiblePages()]);
  if (general.noindex) return [];
  const base = siteUrl();
  const paths = ["/", ...pages.map(pageHref), "/adatkezelesi-tajekoztato", "/cookie-tajekoztato"];
  return paths.map((path) => ({
    url: new URL(path, base).toString(),
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : path.includes("tajekoztato") ? 0.2 : 0.8,
  }));
}
