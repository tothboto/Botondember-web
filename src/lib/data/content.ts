/**
 * A publikus oldalak tartalma (csak a látható elemek, sorrendben) – gyorsítótárazva.
 */
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  footballFacts,
  footballMoments,
  footballPlayers,
  footballSections,
  games,
  genericItems,
  hobbies,
  legalDocs,
  youtubeItems,
} from "@/db/schema";
import { cached } from "@/lib/cache";

export const getHobbies = cached(
  async () =>
    getDb().select().from(hobbies).where(eq(hobbies.visible, true)).orderBy(asc(hobbies.sort), asc(hobbies.id)),
  ["hobbies"],
);

export const getGames = cached(
  async () => getDb().select().from(games).where(eq(games.visible, true)).orderBy(asc(games.sort), asc(games.id)),
  ["games"],
);

export const getYoutubeItems = cached(
  async () =>
    getDb()
      .select()
      .from(youtubeItems)
      .where(eq(youtubeItems.visible, true))
      .orderBy(asc(youtubeItems.sort), asc(youtubeItems.id)),
  ["youtube"],
);

export const getFootball = cached(async () => {
  const db = getDb();
  const [sections, players, moments, facts] = await Promise.all([
    db.select().from(footballSections).orderBy(asc(footballSections.sort), asc(footballSections.id)),
    db
      .select()
      .from(footballPlayers)
      .where(eq(footballPlayers.visible, true))
      .orderBy(asc(footballPlayers.sort), asc(footballPlayers.id)),
    db
      .select()
      .from(footballMoments)
      .where(eq(footballMoments.visible, true))
      .orderBy(asc(footballMoments.sort), asc(footballMoments.id)),
    db
      .select()
      .from(footballFacts)
      .where(eq(footballFacts.visible, true))
      .orderBy(asc(footballFacts.sort), asc(footballFacts.id)),
  ]);
  return { sections, players, moments, facts };
}, ["football"]);

export const getGenericItems = cached(
  async (pageId: number) =>
    getDb()
      .select()
      .from(genericItems)
      .where(and(eq(genericItems.pageId, pageId), eq(genericItems.visible, true)))
      .orderBy(asc(genericItems.sort), asc(genericItems.id)),
  ["generic-items"],
);

export const getLegalDoc = cached(async (slug: string, locale: string) => {
  const rows = await getDb()
    .select()
    .from(legalDocs)
    .where(and(eq(legalDocs.slug, slug), eq(legalDocs.locale, locale)))
    .limit(1);
  return rows[0] ?? null;
}, ["legal"]);
