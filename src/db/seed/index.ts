/**
 * Kezdő adatok betöltése (seed). Többször is biztonságosan lefuttatható:
 * - a szerkezeti adatokból (nyelvek, fordítási kulcsok, beállítások, alapoldalak,
 *   jogi szövegek) csak a HIÁNYZÓKAT pótolja, a meglévőket (pl. az Adminban
 *   átírtakat) soha nem írja felül;
 * - a példatartalmat csak egyszer, az első futáskor tölti be (utána az Adminban
 *   törölt példák sem jönnek vissza).
 */
import { eq } from "drizzle-orm";
import sharp from "sharp";
import type { Db } from "../client";
import {
  adminUsers,
  auditLog,
  footballFacts,
  footballMoments,
  footballPlayers,
  footballSections,
  gadgets,
  games,
  hobbies,
  legalDocs,
  locales,
  pages,
  schools,
  settings,
  translations,
  youtubeItems,
} from "../schema";
import { hashPassword, isValidPasswordLength } from "@/lib/auth/password";
import { SEED_LOCALES, SEED_MESSAGES, SOURCE_LOCALE } from "@/lib/i18n/messages";
import { buildFaviconSet, faviconKey, FAVICON_FILES } from "@/lib/media/favicon";
import type { MediaStorage } from "@/lib/media/storage";
import { parseSetting, settingDefaults, SETTING_KEYS } from "@/lib/settings";
import {
  CORE_PAGES,
  EXAMPLE_FACTS,
  EXAMPLE_GADGETS,
  EXAMPLE_GAMES,
  EXAMPLE_HOBBIES,
  EXAMPLE_MOMENTS,
  EXAMPLE_PLAYERS,
  EXAMPLE_SCHOOLS,
  EXAMPLE_YOUTUBE,
  FOOTBALL_SECTIONS,
} from "./content";
import { LEGAL_SEED } from "./legal";
import { ensurePlaceholders, monogramSvg } from "./placeholders";

/** Ezzel a kulccsal jegyezzük meg, hogy a példatartalom már be lett töltve. */
export const EXAMPLES_FLAG_KEY = "_seed.examples";

/** A „Kedvenc eszközeim” oldal később készült, ezért saját jelölője van. */
export const GADGETS_FLAG_KEY = "_seed.examples.gadgets";

export type SeedOptions = {
  adminUsername?: string;
  adminPassword?: string;
  /** false esetén nem tölt be példatartalmat (pl. tesztekhez). Alapból true. */
  withExamples?: boolean;
  log?: (message: string) => void;
};

export type SeedReport = {
  adminCreated: boolean;
  adminMissingPassword: boolean;
  examplesLoaded: boolean;
  translationsAdded: number;
};

/** Az alapértelmezett „B” monogramos favicon-készlet (ha még nincs meg). */
export async function ensureDefaultFavicon(storage: MediaStorage): Promise<void> {
  const missing = [];
  for (const file of FAVICON_FILES) {
    if (!(await storage.exists(faviconKey("default", file)))) missing.push(file);
  }
  if (missing.length === 0) return;
  const png = await sharp(Buffer.from(monogramSvg())).png().toBuffer();
  const { files } = await buildFaviconSet(png);
  for (const file of FAVICON_FILES) {
    await storage.put(faviconKey("default", file), files[file]);
  }
}

export async function seed(db: Db, storage: MediaStorage, options: SeedOptions = {}): Promise<SeedReport> {
  const log = options.log ?? (() => {});
  const now = Date.now();
  const report: SeedReport = {
    adminCreated: false,
    adminMissingPassword: false,
    examplesLoaded: false,
    translationsAdded: 0,
  };

  // 1) Nyelvek
  await db
    .insert(locales)
    .values(SEED_LOCALES.map((l) => ({ ...l, enabled: true })))
    .onConflictDoNothing();

  // 2) Fordítások – csak a hiányzó (kulcs, nyelv) párok
  const existingRows = await db.select({ key: translations.key, locale: translations.locale }).from(translations);
  const existing = new Set(existingRows.map((r) => `${r.key}\u0000${r.locale}`));
  const newRows = Object.entries(SEED_MESSAGES).flatMap(([key, row]) =>
    Object.entries(row)
      .filter(([locale]) => !existing.has(`${key}\u0000${locale}`))
      .map(([locale, value]) => ({ key, locale, value, updatedAt: now })),
  );
  for (let i = 0; i < newRows.length; i += 200) {
    await db.insert(translations).values(newRows.slice(i, i + 200)).onConflictDoNothing();
  }
  report.translationsAdded = newRows.length;
  if (newRows.length > 0) log(`Fordítások: ${newRows.length} új szöveg.`);

  // 3) Beállítások alapértékei
  for (const key of SETTING_KEYS) {
    await db
      .insert(settings)
      .values({ key, value: settingDefaults[key], updatedAt: now })
      .onConflictDoNothing();
  }

  // 4) Admin felhasználó (csak ha még nincs)
  const admins = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
  if (admins.length === 0) {
    const username = options.adminUsername?.trim() || "Botond";
    const password = options.adminPassword ?? "";
    if (!password) {
      report.adminMissingPassword = true;
      log("Figyelem: nincs admin jelszó megadva (ADMIN_PASSWORD), ezért admin felhasználó sem készült.");
    } else if (!isValidPasswordLength(password)) {
      report.adminMissingPassword = true;
      log("Figyelem: az admin jelszó legalább 8 karakter és legfeljebb 72 bájt lehet – admin felhasználó nem készült.");
    } else {
      await db.insert(adminUsers).values({
        username,
        passwordHash: await hashPassword(password),
        updatedAt: now,
      });
      report.adminCreated = true;
      log(`Admin felhasználó létrehozva: ${username}`);
    }
  }

  // 5) Alapoldalak (a menüpontok) – a kulcs alapján, ha hiányoznak
  for (const page of CORE_PAGES) {
    await db
      .insert(pages)
      .values({ ...page, isCore: true, visible: true, updatedAt: now })
      .onConflictDoNothing();
  }

  // 6) Jogi szövegek (magyarul)
  for (const doc of LEGAL_SEED) {
    await db
      .insert(legalDocs)
      .values({ slug: doc.slug, locale: SOURCE_LOCALE, bodyMd: doc.bodyMd, updatedAt: now })
      .onConflictDoNothing();
  }

  // 7) Real Madrid oldal szekciói
  for (const section of FOOTBALL_SECTIONS) {
    await db
      .insert(footballSections)
      .values({ ...section, visible: true, updatedAt: now })
      .onConflictDoNothing();
  }

  // 8) Alapértelmezett favicon
  await ensureDefaultFavicon(storage);

  // 9) Példatartalom – csak egyszer
  const flag = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, EXAMPLES_FLAG_KEY));
  if (flag.length === 0 && options.withExamples !== false) {
    log("Példatartalom és helykitöltő képek készítése…");
    const ids = await ensurePlaceholders(db, storage);

    await db.insert(hobbies).values(
      EXAMPLE_HOBBIES.map((h, i) => ({
        title: h.title,
        body: h.body,
        since: h.since,
        tag: h.tag,
        mediaId: ids[h.placeholder] ?? null,
        sort: i + 1,
        isExample: true,
        updatedAt: now,
      })),
    );

    await db.insert(games).values(
      EXAMPLE_GAMES.map((g, i) => ({
        title: g.title,
        platforms: [...g.platforms],
        genre: g.genre,
        rating: g.rating,
        review: g.review,
        link: "",
        featured: g.featured,
        coverMediaId: ids[g.placeholder] ?? null,
        sort: i + 1,
        isExample: true,
        updatedAt: now,
      })),
    );

    await db.insert(youtubeItems).values(
      EXAMPLE_YOUTUBE.map((y, i) => ({
        kind: y.kind,
        url: y.url,
        ytId: "",
        title: y.title,
        author: y.author,
        note: y.note,
        itemCount: y.itemCount,
        thumbMediaId: ids[y.placeholder] ?? null,
        sort: i + 1,
        isExample: true,
        updatedAt: now,
      })),
    );

    await db.insert(schools).values(
      EXAMPLE_SCHOOLS.map((school, i) => ({
        slug: school.slug,
        name: school.name,
        kind: school.kind,
        city: school.city,
        address: school.address,
        years: school.years,
        link: school.link,
        lead: school.lead,
        bodyMd: school.bodyMd,
        mediaId: ids[school.placeholder] ?? null,
        sort: i + 1,
        isExample: true,
        updatedAt: now,
      })),
    );

    await db.insert(footballPlayers).values(
      EXAMPLE_PLAYERS.map((p, i) => ({
        name: p.name,
        number: p.number,
        position: p.position,
        note: p.note,
        mediaId: ids[p.placeholder] ?? null,
        sort: i + 1,
        isExample: true,
        updatedAt: now,
      })),
    );

    await db.insert(footballMoments).values(
      EXAMPLE_MOMENTS.map((m, i) => ({
        year: m.year,
        title: m.title,
        body: m.body,
        link: "",
        mediaId: ids[m.placeholder] ?? null,
        sort: i + 1,
        isExample: true,
        updatedAt: now,
      })),
    );

    await db
      .insert(footballFacts)
      .values(EXAMPLE_FACTS.map((f, i) => ({ label: f.label, value: f.value, sort: i + 1, updatedAt: now })));

    // A kezdőlap és a Real Madrid oldal hero képe
    const homeRow = await db.select().from(settings).where(eq(settings.key, "home"));
    const home = parseSetting("home", homeRow[0]?.value);
    if (home.heroMediaId === null && ids["home-hero"]) {
      await db
        .update(settings)
        .set({ value: { ...home, heroMediaId: ids["home-hero"] }, updatedAt: now })
        .where(eq(settings.key, "home"));
    }
    if (ids["football-stadium"]) {
      await db
        .update(footballSections)
        .set({ mediaId: ids["football-stadium"] })
        .where(eq(footballSections.type, "hero"));
    }

    await db.insert(settings).values({ key: EXAMPLES_FLAG_KEY, value: { loadedAt: now }, updatedAt: now });
    await db.insert(auditLog).values({ createdAt: now, area: "Rendszer", message: "Kezdő adatok és példatartalom betöltve" });
    report.examplesLoaded = true;
  }

  // 10) Később hozzáadott oldalak példatartalma – saját jelölővel, hogy a már
  // meglévő oldalakra is bekerüljön egyszer. Ha törlik, többé nem jön vissza.
  if (options.withExamples !== false) {
    const gadgetFlag = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, GADGETS_FLAG_KEY));
    if (gadgetFlag.length === 0) {
      const ids = await ensurePlaceholders(db, storage);
      await db.insert(gadgets).values(
        EXAMPLE_GADGETS.map((g, i) => ({
          name: g.name,
          category: g.category,
          maker: g.maker,
          since: g.since,
          rating: g.rating,
          note: g.note,
          link: g.link,
          mediaId: ids[g.placeholder] ?? null,
          sort: i + 1,
          isExample: true,
          updatedAt: now,
        })),
      );
      await db.insert(settings).values({ key: GADGETS_FLAG_KEY, value: { loadedAt: now }, updatedAt: now });
      log("Kedvenc eszközeim: példatartalom betöltve.");
    }
  }

  return report;
}
