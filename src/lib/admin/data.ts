/** Az Admin oldalak közös adatbetöltői (mindig friss adat, gyorsítótár nélkül). */
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { pages, type Page } from "@/db/schema";

export async function requireCorePage(key: string): Promise<Page> {
  const [page] = await getDb().select().from(pages).where(eq(pages.key, key));
  if (!page) notFound();
  return page;
}

export function toPageContent(page: Page) {
  return {
    id: page.id,
    introMd: page.introMd,
    bodyMd: page.bodyMd,
    seoDescription: page.seoDescription,
    heroMediaId: page.heroMediaId,
  };
}
