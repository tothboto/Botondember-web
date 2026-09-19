/**
 * Az Admin űrlapok ellenőrzése (zod) – minden bemenet a szerveren is
 * ellenőrzésre kerül, a felület elrejtése nem elég.
 */
import { z } from "zod";
import { isSafeHttpUrl, normalizeUrl } from "@/lib/url";

export const PLATFORM_CODES = ["pc", "playstation", "xbox", "switch", "mobile"] as const;
export const YOUTUBE_KINDS = ["song", "video", "channel", "playlist"] as const;

export const text = (max: number) => z.string().trim().max(max, `Legfeljebb ${max} karakter lehet.`);
export const required = (max: number, label: string) =>
  z.string().trim().min(1, `A(z) „${label}” mezőt ki kell tölteni.`).max(max, `Legfeljebb ${max} karakter lehet.`);

export const mediaId = z.number().int().positive().nullable();

/** Nem kötelező link: üres, vagy http(s). A `realmadrid.com` alakot is elfogadja. */
export const optionalUrl = z
  .string()
  .trim()
  .max(500, "Túl hosszú link.")
  .transform(normalizeUrl)
  .refine((v) => v === "" || isSafeHttpUrl(v), "Csak http:// vagy https:// kezdetű link adható meg.");

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"]);

export const youtubeUrl = z
  .string()
  .trim()
  .min(1, "Add meg a YouTube linket!")
  .max(500, "Túl hosszú link.")
  .transform(normalizeUrl)
  .refine((v) => {
    try {
      const url = new URL(v);
      return (url.protocol === "https:" || url.protocol === "http:") && YOUTUBE_HOSTS.has(url.hostname);
    } catch {
      return false;
    }
  }, "Csak YouTube link adható meg (youtube.com vagy youtu.be).");

export const visible = z.boolean();

/** A gyűjtemények (listák) elemeinek sémája. */
export const itemSchemas = {
  hobbies: z.object({
    title: required(80, "Név"),
    body: text(600),
    mediaId,
    since: text(30),
    tag: text(30),
    visible,
  }),
  games: z.object({
    title: required(80, "Cím"),
    platforms: z.array(z.enum(PLATFORM_CODES)).max(PLATFORM_CODES.length),
    genre: text(60),
    rating: z.number().int().min(0).max(5),
    review: text(600),
    link: optionalUrl,
    coverMediaId: mediaId,
    featured: z.boolean(),
    visible,
  }),
  youtube: z.object({
    kind: z.enum(YOUTUBE_KINDS),
    url: youtubeUrl,
    ytId: text(120),
    title: required(150, "Cím"),
    author: text(100),
    thumbMediaId: mediaId,
    note: text(300),
    itemCount: z.number().int().min(0).max(100000).nullable(),
    visible,
  }),
  players: z.object({
    name: required(80, "Név"),
    number: text(4),
    position: text(40),
    mediaId,
    note: text(300),
    visible,
  }),
  moments: z.object({
    year: text(20),
    title: required(120, "Cím"),
    body: text(800),
    mediaId,
    link: optionalUrl,
    visible,
  }),
  facts: z.object({
    label: required(60, "Megnevezés"),
    value: required(120, "Érték"),
    visible,
  }),
  generic: z.object({
    pageId: z.number().int().positive(),
    title: required(120, "Cím"),
    body: text(1000),
    mediaId,
    link: optionalUrl,
    visible,
  }),
};

export type CollectionKey = keyof typeof itemSchemas;
export const COLLECTION_KEYS = Object.keys(itemSchemas) as CollectionKey[];

/** Az adatbázis-tábla és a „csoport” oszlop (a sorrend ezen belül számít). */
export const COLLECTION_TABLES: Record<CollectionKey, { table: string; scope?: string; label: string }> = {
  hobbies: { table: "hobbies", label: "Hobbijaim" },
  games: { table: "games", label: "Játékaim" },
  youtube: { table: "youtube_items", scope: "kind", label: "YouTube" },
  players: { table: "football_players", label: "Real Madrid – játékosok" },
  moments: { table: "football_moments", label: "Real Madrid – pillanatok" },
  facts: { table: "football_facts", label: "Real Madrid – alapadatok" },
  generic: { table: "generic_items", scope: "page_id", label: "Aloldal kártyák" },
};

/** Az URL-ben megjelenő aloldal-cím (slug) szabályai. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "media",
  "icons",
  "flags",
  "_next",
  "favicon.ico",
  "robots.txt",
  "manifest.webmanifest",
  "adatkezelesi-tajekoztato",
  "cookie-tajekoztato",
]);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Az URL-cím legalább 2 karakter legyen.")
  .max(60, "Az URL-cím legfeljebb 60 karakter lehet.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Az URL-címben csak ékezet nélküli kisbetű, szám és kötőjel lehet (pl. kedvenc-filmjeim).")
  .refine((v) => !RESERVED_SLUGS.has(v), "Ez az URL-cím foglalt, válassz másikat!");
