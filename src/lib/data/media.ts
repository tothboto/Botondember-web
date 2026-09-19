import { getDb } from "@/db/client";
import { media, type Media } from "@/db/schema";
import { cached } from "@/lib/cache";
import { mediaUrl } from "@/lib/media/storage";

/** Egy kép a megjelenítéshez szükséges adatokkal. */
export type ImageInfo = {
  id: number;
  src: string;
  width: number;
  height: number;
  alt: string;
};

export function toImageInfo(row: Media): ImageInfo {
  return { id: row.id, src: mediaUrl(row.path), width: row.width, height: row.height, alt: row.alt };
}

export async function readMediaMap(): Promise<Record<number, ImageInfo>> {
  const rows = await getDb().select().from(media);
  return Object.fromEntries(rows.map((row) => [row.id, toImageInfo(row)]));
}

const getMediaMap = cached(readMediaMap, ["media"]);

/** Képek azonosító szerint (a hiányzó / törölt képekre `null`). */
export async function getImages(): Promise<(id: number | null | undefined) => ImageInfo | null> {
  const map = await getMediaMap();
  return (id) => (id ? (map[id] ?? null) : null);
}
