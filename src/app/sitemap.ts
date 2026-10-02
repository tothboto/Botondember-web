import type { MetadataRoute } from "next";
import { getSchools } from "@/lib/data/content";
import { getVisiblePages, pageHref } from "@/lib/data/pages";
import { getAllSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/**
 * Oldaltérkép a keresőknek (/sitemap.xml). Amíg az oldal rejtve van a keresők
 * elől (Admin > Általános), üres – nincs értelme felsorolni az oldalakat.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ general }, pages, schools] = await Promise.all([getAllSettings(), getVisiblePages(), getSchools()]);
  if (general.noindex) return [];
  const base = siteUrl();
  // Az iskolák saját aloldalai is bekerülnek (/iskolaim/<slug>).
  const schoolsPage = pages.find((page) => page.template === "schools");
  const schoolPaths = schoolsPage ? schools.map((school) => `${pageHref(schoolsPage)}/${school.slug}`) : [];
  const paths = ["/", ...pages.map(pageHref), ...schoolPaths, "/adatkezelesi-tajekoztato", "/cookie-tajekoztato"];
  return paths.map((path) => ({
    url: new URL(path, base).toString(),
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : path.includes("tajekoztato") ? 0.2 : 0.8,
  }));
}
