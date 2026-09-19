import { asc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { pages, type Page } from "@/db/schema";
import { cached } from "@/lib/cache";

export async function readPages(): Promise<Page[]> {
  return getDb().select().from(pages).orderBy(asc(pages.sort), asc(pages.id));
}

/** Az összes aloldal (a rejtettek is), sorrendben – gyorsítótárazva. */
export const getPages = cached(readPages, ["pages"]);

/** A menüben megjelenő (látható) aloldalak. */
export async function getVisiblePages(): Promise<Page[]> {
  return (await getPages()).filter((page) => page.visible);
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  return (await getPages()).find((page) => page.slug === slug && page.visible) ?? null;
}

export async function getPageByKey(key: string): Promise<Page | null> {
  return (await getPages()).find((page) => page.key === key) ?? null;
}

/** Az aloldal címe a böngészőben (`/hobbijaim`). */
export function pageHref(page: Pick<Page, "slug">): string {
  return `/${page.slug}`;
}

/** A fordítási kulcsok egy aloldalhoz. */
export function pageMenuKey(page: Pick<Page, "key">): string {
  return `page.${page.key}.menu`;
}
export function pageTitleKey(page: Pick<Page, "key">): string {
  return `page.${page.key}.title`;
}
