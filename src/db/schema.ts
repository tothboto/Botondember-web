/**
 * Az adatbázis szerkezete (Drizzle ORM, SQLite / libSQL).
 *
 * Minden időbélyeg ezredmásodpercben (Unix ms) tárolt egész szám – így a
 * gyorsítótárban (JSON) is változatlan marad.
 *
 * A képekre mutató mezők (`...MediaId`) szándékosan nem idegen kulcsok: a
 * hivatkozásokat a program kezeli (lásd `src/lib/media/usage.ts`), így a
 * libSQL kapcsolatkezelésétől függetlenül mindig kiszámítható a viselkedés.
 */
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/** Kulcs–érték beállítások; az érték JSON (lásd `src/lib/settings.ts`). */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).$type<unknown>().notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/** Nyelvek (a zászló a flag-icons országkódja, pl. `hu`, `gb`). */
export const locales = sqliteTable("locales", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  flag: text("flag").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  sort: integer("sort").notNull().default(0),
});

/** A felület („keretrendszer”) szövegei nyelvenként. */
export const translations = sqliteTable(
  "translations",
  {
    key: text("key").notNull(),
    locale: text("locale").notNull(),
    value: text("value").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.key, t.locale] })],
);

/**
 * Előkészítés a beírt tartalom későbbi fordításához (felülete még nincs).
 * Ha egy mezőnek nincs fordítása, az eredeti (beírt) szöveg jelenik meg.
 */
export const contentTranslations = sqliteTable(
  "content_translations",
  {
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    field: text("field").notNull(),
    locale: text("locale").notNull(),
    value: text("value").notNull(),
    updatedAt: integer("updated_at").notNull(),
    /** Ki készítette: `auto` = gépi (ellenőrizendő) · `manual` = kézzel írt / ellenőrzött · `keep` = maradjon az eredeti. */
    origin: text("origin").notNull().default("manual"),
    /** A magyar forrásszöveg ujjlenyomata a fordítás idején – ebből látszik, ha a magyar azóta megváltozott. */
    sourceHash: text("source_hash").notNull().default(""),
  },
  (t) => [primaryKey({ columns: [t.entity, t.entityId, t.field, t.locale] })],
);

/** „Fordításra vár” lista: ezeket a szövegeket a következő `/forditas` futtatáskor fordítja le Claude. */
export const translationRequests = sqliteTable(
  "translation_requests",
  {
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    field: text("field").notNull(),
    locale: text("locale").notNull(),
    requestedAt: integer("requested_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.entity, t.entityId, t.field, t.locale] })],
);

/** Feltöltött (és a program által generált) képek. */
export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** A tároló-rétegbeli kulcs, pl. `img/2026/09/k3j2x9.webp`. */
  path: text("path").notNull().unique(),
  mime: text("mime").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  size: integer("size").notNull(),
  alt: text("alt").notNull().default(""),
  originalName: text("original_name").notNull().default(""),
  /** upload | placeholder | youtube */
  source: text("source").notNull().default("upload"),
  createdAt: integer("created_at").notNull(),
});

/** A menüben megjelenő aloldalak. */
export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Állandó azonosító a fordítási kulcsokhoz: `page.<key>.menu`, `page.<key>.title`. */
  key: text("key").notNull().unique(),
  slug: text("slug").notNull().unique(),
  /** hobbies | games | youtube | football | generic */
  template: text("template").notNull(),
  icon: text("icon").notNull().default("FileText"),
  sort: integer("sort").notNull().default(0),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  isCore: integer("is_core", { mode: "boolean" }).notNull().default(false),
  introMd: text("intro_md").notNull().default(""),
  /** Csak az „Általános” sablonnál: a fő Markdown szöveg. */
  bodyMd: text("body_md").notNull().default(""),
  heroMediaId: integer("hero_media_id"),
  /** `#RRGGBB` vagy üres (= a sablon alapszíne). */
  accentColor: text("accent_color"),
  seoDescription: text("seo_description").notNull().default(""),
  updatedAt: integer("updated_at").notNull(),
});

export const hobbies = sqliteTable("hobbies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  mediaId: integer("media_id"),
  since: text("since").notNull().default(""),
  tag: text("tag").notNull().default(""),
  sort: integer("sort").notNull().default(0),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  isExample: integer("is_example", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at").notNull(),
});

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  /** Platformkódok: pc | playstation | xbox | switch | mobile */
  platforms: text("platforms", { mode: "json" }).$type<string[]>().notNull(),
  genre: text("genre").notNull().default(""),
  /** 0 = nincs értékelés, 1–5 csillag */
  rating: integer("rating").notNull().default(0),
  review: text("review").notNull().default(""),
  link: text("link").notNull().default(""),
  coverMediaId: integer("cover_media_id"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  sort: integer("sort").notNull().default(0),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  isExample: integer("is_example", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at").notNull(),
});

export const youtubeItems = sqliteTable("youtube_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** song | video | channel | playlist */
  kind: text("kind").notNull(),
  url: text("url").notNull(),
  ytId: text("yt_id").notNull().default(""),
  title: text("title").notNull(),
  author: text("author").notNull().default(""),
  thumbMediaId: integer("thumb_media_id"),
  note: text("note").notNull().default(""),
  /** Lejátszási listánál az elemszám (nem kötelező). */
  itemCount: integer("item_count"),
  sort: integer("sort").notNull().default(0),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  isExample: integer("is_example", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at").notNull(),
});

/** A Real Madrid oldal szekciói (hero | why | players | moments | facts | link). */
export const footballSections = sqliteTable("football_sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull().unique(),
  title: text("title").notNull().default(""),
  bodyMd: text("body_md").notNull().default(""),
  mediaId: integer("media_id"),
  link: text("link").notNull().default(""),
  sort: integer("sort").notNull().default(0),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at").notNull(),
});

export const footballPlayers = sqliteTable("football_players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  number: text("number").notNull().default(""),
  position: text("position").notNull().default(""),
  mediaId: integer("media_id"),
  note: text("note").notNull().default(""),
  sort: integer("sort").notNull().default(0),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  isExample: integer("is_example", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at").notNull(),
});

export const footballMoments = sqliteTable("football_moments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: text("year").notNull().default(""),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  mediaId: integer("media_id"),
  link: text("link").notNull().default(""),
  sort: integer("sort").notNull().default(0),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  isExample: integer("is_example", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at").notNull(),
});

export const footballFacts = sqliteTable("football_facts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  value: text("value").notNull(),
  sort: integer("sort").notNull().default(0),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at").notNull(),
});

/** Az „Általános” sablonú aloldalak kártyái. */
export const genericItems = sqliteTable("generic_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pageId: integer("page_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  mediaId: integer("media_id"),
  link: text("link").notNull().default(""),
  sort: integer("sort").notNull().default(0),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  isExample: integer("is_example", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at").notNull(),
});

/** Jogi dokumentumok (privacy | cookie) Markdownban. */
export const legalDocs = sqliteTable(
  "legal_docs",
  {
    slug: text("slug").notNull(),
    locale: text("locale").notNull(),
    bodyMd: text("body_md").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.slug, t.locale] })],
);

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  /** Minden jelszó- vagy névcserénél frissül → a régi belépések érvénytelenné válnak. */
  updatedAt: integer("updated_at").notNull(),
});

/** Brute force védelem: sikertelen belépések IP-címenként. */
export const loginAttempts = sqliteTable("login_attempts", {
  ip: text("ip").primaryKey(),
  count: integer("count").notNull(),
  windowStart: integer("window_start").notNull(),
});

/** Admin műveletek naplója (az Irányítópult „utolsó módosítások” listájához). */
export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: integer("created_at").notNull(),
  area: text("area").notNull(),
  message: text("message").notNull(),
});

export type Locale = typeof locales.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Hobby = typeof hobbies.$inferSelect;
export type Game = typeof games.$inferSelect;
export type YoutubeItem = typeof youtubeItems.$inferSelect;
export type FootballSection = typeof footballSections.$inferSelect;
export type FootballPlayer = typeof footballPlayers.$inferSelect;
export type FootballMoment = typeof footballMoments.$inferSelect;
export type FootballFact = typeof footballFacts.$inferSelect;
export type GenericItem = typeof genericItems.$inferSelect;
export type LegalDoc = typeof legalDocs.$inferSelect;
export type AuditEntry = typeof auditLog.$inferSelect;
