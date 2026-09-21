import { getDb } from "@/db/client";
import { media, type Media } from "@/db/schema";
import { cached } from "@/lib/cache";
import { getLocalizer } from "@/lib/content-i18n/localize";
import { SOURCE_LOCALE } from "@/lib/i18n/messages";
import { mediaUrl } from "@/lib/media/storage";

/** Egy kép a megjelenítéshez szükséges adatokkal. */
export type ImageInfo = {
  id: number;
  src: string;
  width: number;
  height: number;
  alt: string;
  /** A képleírás (alt) nyelve: a látogató nyelve, ha van fordítás, különben magyar. */
  altLang: string;
};

export function toImageInfo(row: Media): ImageInfo {
  return { id: row.id, src: mediaUrl(row.path), width: row.width, height: row.height, alt: row.alt, altLang: SOURCE_LOCALE };
}

export async function readMediaMap(): Promise<Record<number, ImageInfo>> {
  const rows = await getDb().select().from(media);
  return Object.fromEntries(rows.map((row) => [row.id, toImageInfo(row)]));
}

const getMediaMap = cached(readMediaMap, ["media"]);

/** Képek azonosító szerint (a hiányzó / törölt képekre `null`); a képleírás a látogató nyelvén. */
export async function getImages(): Promise<(id: number | null | undefined) => ImageInfo | null> {
  const [map, l] = await Promise.all([getMediaMap(), getLocalizer()]);
  return (id) => {
    const image = id ? map[id] : undefined;
    if (!image) return null;
    const alt = l.get("media", image.id, "alt", image.alt);
    return { ...image, alt: alt.text, altLang: alt.lang };
  };
}
