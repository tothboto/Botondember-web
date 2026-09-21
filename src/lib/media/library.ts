/**
 * A médiatár műveletei: kép mentése (feltöltés vagy letöltés), használat
 * keresése, törlés. Minden kép a tároló-rétegen át mentődik.
 */
import crypto from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { footballMoments, footballPlayers, footballSections, games, genericItems, hobbies, media, pages, settings, youtubeItems } from "@/db/schema";
import { deleteContentForEntity } from "@/lib/content-i18n/store";
import { parseSetting } from "@/lib/settings";
import { ImageError, processImage } from "./process";
import { mediaUrl, type MediaStorage } from "./storage";

export type MediaInfo = {
  id: number;
  src: string;
  width: number;
  height: number;
  alt: string;
  originalName: string;
  size: number;
  source: string;
  createdAt: number;
};

export function toMediaInfo(row: typeof media.$inferSelect): MediaInfo {
  return {
    id: row.id,
    src: mediaUrl(row.path),
    width: row.width,
    height: row.height,
    alt: row.alt,
    originalName: row.originalName,
    size: row.size,
    source: row.source,
    createdAt: row.createdAt,
  };
}

function randomName(): string {
  return crypto.randomBytes(9).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "x");
}

/** Kép feldolgozása és mentése a médiatárba. */
export async function saveImage(
  db: Db,
  storage: MediaStorage,
  input: Buffer,
  options: { originalName?: string; alt?: string; source?: "upload" | "youtube"; maxDimension?: number } = {},
): Promise<MediaInfo> {
  const processed = await processImage(input, { maxDimension: options.maxDimension });
  const now = new Date();
  const folder = options.source === "youtube" ? "yt" : `img/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const key = `${folder}/${randomName()}.${processed.ext}`;
  await storage.put(key, processed.data);
  const [row] = await db
    .insert(media)
    .values({
      path: key,
      mime: processed.mime,
      width: processed.width,
      height: processed.height,
      size: processed.data.length,
      alt: (options.alt ?? "").trim().slice(0, 300),
      originalName: (options.originalName ?? "").slice(0, 200),
      source: options.source ?? "upload",
      createdAt: Date.now(),
    })
    .returning();
  return toMediaInfo(row);
}

export async function listMedia(db: Db): Promise<MediaInfo[]> {
  const rows = await db.select().from(media).orderBy(desc(media.createdAt), desc(media.id));
  return rows.map(toMediaInfo);
}

/**
 * Az összes kép használata egyszerre: képazonosító → hol szerepel
 * (a médiatár „Használatban” jelzéséhez és a törlés előtti figyelmeztetéshez).
 */
export async function mediaUsageMap(db: Db): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  const add = (id: number | null, label: string) => {
    if (!id) return;
    const list = map.get(id) ?? [];
    list.push(label);
    map.set(id, list);
  };
  const [homeRow] = await db.select().from(settings).where(eq(settings.key, "home"));
  const home = parseSetting("home", homeRow?.value);
  add(home.heroMediaId, "Kezdőlap – nagy kép");
  add(home.figureMediaId, "Kezdőlap – előtérben álló alak (rajz)");

  const collect = async (label: string, rows: Promise<{ id: number | null; name: string }[]>) => {
    for (const row of await rows) add(row.id, `${label}: ${row.name}`);
  };
  await collect("Aloldal képe", db.select({ id: pages.heroMediaId, name: pages.slug }).from(pages));
  await collect("Hobbi", db.select({ id: hobbies.mediaId, name: hobbies.title }).from(hobbies));
  await collect("Játék", db.select({ id: games.coverMediaId, name: games.title }).from(games));
  await collect("YouTube", db.select({ id: youtubeItems.thumbMediaId, name: youtubeItems.title }).from(youtubeItems));
  await collect("Real Madrid szekció", db.select({ id: footballSections.mediaId, name: footballSections.type }).from(footballSections));
  await collect("Real Madrid játékos", db.select({ id: footballPlayers.mediaId, name: footballPlayers.name }).from(footballPlayers));
  await collect("Real Madrid pillanat", db.select({ id: footballMoments.mediaId, name: footballMoments.title }).from(footballMoments));
  await collect("Aloldal kártya", db.select({ id: genericItems.mediaId, name: genericItems.title }).from(genericItems));
  return map;
}

/** Hol használják a képet? (A törlés előtti figyelmeztetéshez.) */
export async function findMediaUsage(db: Db, id: number): Promise<string[]> {
  return (await mediaUsageMap(db)).get(id) ?? [];
}

/** Kép törlése: a hivatkozásokat kiüríti, a fájlt és a sort törli. */
export async function deleteMediaCompletely(db: Db, storage: MediaStorage, id: number): Promise<void> {
  const [row] = await db.select().from(media).where(eq(media.id, id));
  if (!row) return;

  const [homeRow] = await db.select().from(settings).where(eq(settings.key, "home"));
  const home = parseSetting("home", homeRow?.value);
  if (home.heroMediaId === id || home.figureMediaId === id) {
    const value = {
      ...home,
      heroMediaId: home.heroMediaId === id ? null : home.heroMediaId,
      figureMediaId: home.figureMediaId === id ? null : home.figureMediaId,
    };
    await db.update(settings).set({ value, updatedAt: Date.now() }).where(eq(settings.key, "home"));
  }
  await db.update(pages).set({ heroMediaId: null }).where(eq(pages.heroMediaId, id));
  await db.update(hobbies).set({ mediaId: null }).where(eq(hobbies.mediaId, id));
  await db.update(games).set({ coverMediaId: null }).where(eq(games.coverMediaId, id));
  await db.update(youtubeItems).set({ thumbMediaId: null }).where(eq(youtubeItems.thumbMediaId, id));
  await db.update(footballSections).set({ mediaId: null }).where(eq(footballSections.mediaId, id));
  await db.update(footballPlayers).set({ mediaId: null }).where(eq(footballPlayers.mediaId, id));
  await db.update(footballMoments).set({ mediaId: null }).where(eq(footballMoments.mediaId, id));
  await db.update(genericItems).set({ mediaId: null }).where(eq(genericItems.mediaId, id));

  await db.delete(media).where(eq(media.id, id));
  await deleteContentForEntity(db, "media", id);
  await storage.delete(row.path);
}

/** Alt szövegek frissítése (azonosító → szöveg). */
export async function updateAlts(db: Db, alts: Record<string, string> | undefined): Promise<void> {
  if (!alts) return;
  for (const [key, value] of Object.entries(alts)) {
    const id = Number(key);
    if (!Number.isInteger(id) || id <= 0) continue;
    await db.update(media).set({ alt: String(value).trim().slice(0, 300) }).where(eq(media.id, id));
  }
}

/** Létezik-e a kép (hivatkozás mentése előtt). */
export async function assertMediaExists(db: Db, id: number | null | undefined): Promise<void> {
  if (!id) return;
  const [row] = await db.select({ n: sql<number>`1` }).from(media).where(eq(media.id, id));
  if (!row) throw new ImageError("A kiválasztott kép már nem létezik – válassz másikat!");
}
