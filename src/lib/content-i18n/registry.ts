/**
 * A fordítható saját szövegek jegyzéke: minden szabad szöveges mező, amit az
 * Adminban beírsz (kezdőlap, lábléc, aloldalak, kártyák, képleírások, jogi szövegek).
 *
 * Ezt használja az Admin „Saját szövegek fordítása” oldala, a fordító parancs
 * (`npm run translate:export` / `translate:import`) és a mentések ellenőrzése is.
 * A magyar szöveg mindig az eredeti helyén marad; a fordítások a
 * `content_translations` táblába kerülnek.
 */
import { and, asc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import {
  footballFacts,
  footballMoments,
  footballPlayers,
  footballSections,
  games,
  genericItems,
  hobbies,
  legalDocs,
  media,
  pages,
  settings as settingsTable,
  translations,
  youtubeItems,
} from "@/db/schema";
import { contentEditorHref } from "@/lib/admin/page-editors";
import { SEED_MESSAGES, SOURCE_LOCALE } from "@/lib/i18n/messages";
import { parseSetting } from "@/lib/settings";
import { contentKey } from "./status";

export type ContentFormat = "text" | "multiline" | "markdown";

export type ContentField = {
  key: string;
  entity: string;
  entityId: string;
  field: string;
  /** Csoport az Adminban (pl. „Kezdőlap”, „Hobbijaim”). */
  section: string;
  /** Mi ez a mező (pl. „Foci – leírás”). */
  label: string;
  format: ContentFormat;
  /** A fordítás legnagyobb hossza (a magyar határ kétszerese – a németet is kibírja). */
  maxLength: number;
  /** Az eredeti (magyar) szöveg. */
  source: string;
  /** Hol szerkeszthető a magyar szöveg az Adminban. */
  editHref: string;
};

const YOUTUBE_KIND_LABELS: Record<string, string> = {
  song: "Zeneszám",
  video: "Videó",
  channel: "Csatorna",
  playlist: "Lejátszási lista",
};

const FOOTBALL_SECTION_LABELS: Record<string, string> = {
  hero: "Nyitókép",
  why: "Miért a Real Madrid?",
};

const short = (text: string, max = 40) => {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean || "(névtelen)";
};

/** Az összes fordítható mező, az Admin sorrendjében. Az üres magyar szövegek kimaradnak. */
export async function listContentFields(db: Db): Promise<ContentField[]> {
  const [settingRows, pageRows, pageLabels, hobbyRows, gameRows, youtubeRows, sectionRows, playerRows, momentRows, factRows, genericRows, mediaRows, legalRows] =
    await Promise.all([
      db.select().from(settingsTable),
      db.select().from(pages).orderBy(asc(pages.sort), asc(pages.id)),
      db.select({ key: translations.key, value: translations.value }).from(translations).where(eq(translations.locale, SOURCE_LOCALE)),
      db.select().from(hobbies).orderBy(asc(hobbies.sort), asc(hobbies.id)),
      db.select().from(games).orderBy(asc(games.sort), asc(games.id)),
      db.select().from(youtubeItems).orderBy(asc(youtubeItems.kind), asc(youtubeItems.sort), asc(youtubeItems.id)),
      db.select().from(footballSections).orderBy(asc(footballSections.sort), asc(footballSections.id)),
      db.select().from(footballPlayers).orderBy(asc(footballPlayers.sort), asc(footballPlayers.id)),
      db.select().from(footballMoments).orderBy(asc(footballMoments.sort), asc(footballMoments.id)),
      db.select().from(footballFacts).orderBy(asc(footballFacts.sort), asc(footballFacts.id)),
      db.select().from(genericItems).orderBy(asc(genericItems.pageId), asc(genericItems.sort), asc(genericItems.id)),
      db.select().from(media).orderBy(asc(media.id)),
      db.select().from(legalDocs).where(and(eq(legalDocs.locale, SOURCE_LOCALE))),
    ]);

  const out: ContentField[] = [];
  const add = (
    entity: string,
    entityId: string | number,
    field: string,
    source: string | null | undefined,
    meta: { section: string; label: string; format: ContentFormat; max: number; editHref: string },
  ) => {
    const text = (source ?? "").trim();
    if (!text) return;
    out.push({
      key: contentKey(entity, entityId, field),
      entity,
      entityId: String(entityId),
      field,
      section: meta.section,
      label: meta.label,
      format: meta.format,
      maxLength: meta.max * 2,
      source: text,
      editHref: meta.editHref,
    });
  };

  const settingValue = (key: string) => settingRows.find((row) => row.key === key)?.value;
  const general = parseSetting("general", settingValue("general"));
  const home = parseSetting("home", settingValue("home"));
  const footer = parseSetting("footer", settingValue("footer"));

  // --- Kezdőlap -------------------------------------------------------------
  const homeMeta = (label: string, format: ContentFormat, max: number) => ({ section: "Kezdőlap", label, format, max, editHref: "/admin/kezdolap" });
  add("settings", "home", "message", home.message, homeMeta("Fő üzenet (a nagy felirat)", "multiline", 200));
  add("settings", "home", "subtitle", home.subtitle, homeMeta("Alcím", "text", 300));
  if (home.motto.enabled) {
    add("settings", "home", "motto.text", home.motto.text, homeMeta("Mottó", "text", 300));
    add("settings", "home", "motto.author", home.motto.author, homeMeta("Mottó szerzője", "text", 100));
  }
  if (home.guide.enabled) {
    add("settings", "home", "guide.button", home.guide.button, homeMeta("„Hol vagy? Mi ez?” – a gomb felirata", "text", 60));
    add("settings", "home", "guide.title", home.guide.title, homeMeta("„Hol vagy? Mi ez?” – az ablak címe", "text", 120));
    add("settings", "home", "guide.text", home.guide.text, homeMeta("„Hol vagy? Mi ez?” – a leírás", "markdown", 3000));
  }

  // --- Általános és lábléc ------------------------------------------------------
  const generalMeta = (label: string, format: ContentFormat, max: number) => ({ section: "Általános és lábléc", label, format, max, editHref: "/admin/altalanos" });
  add("settings", "general", "siteName", general.siteName, generalMeta("Az oldal neve (böngészőfül)", "text", 80));
  add("settings", "general", "headerTitle", general.headerTitle, generalMeta("A fejléc felirata", "text", 80));
  add("settings", "footer", "text", footer.text, generalMeta("Lábléc szövege", "multiline", 500));
  footer.links.forEach((link, index) => add("settings", "footer", `links.${index}.label`, link.label, generalMeta(`Lábléc link: ${short(link.label)}`, "text", 60)));

  // --- Aloldalak (a saját kártyáikkal együtt) ------------------------------------
  const pageName = (page: (typeof pageRows)[number]) =>
    pageLabels.find((row) => row.key === `page.${page.key}.menu`)?.value ?? SEED_MESSAGES[`page.${page.key}.menu`]?.hu ?? page.slug;

  for (const page of pageRows) {
    const section = pageName(page);
    const editHref = contentEditorHref(page);
    const pageMeta = (label: string, format: ContentFormat, max: number) => ({ section, label, format, max, editHref });
    add("pages", page.id, "introMd", page.introMd, pageMeta("Az oldal bevezetője", "markdown", 2000));
    if (page.template === "generic") add("pages", page.id, "bodyMd", page.bodyMd, pageMeta("Fő szöveg", "markdown", 20_000));
    add("pages", page.id, "seoDescription", page.seoDescription, pageMeta("Rövid leírás a keresőknek", "text", 300));

    if (page.template === "hobbies") {
      for (const row of hobbyRows) {
        const name = short(row.title);
        add("hobbies", row.id, "title", row.title, pageMeta(`${name} – név`, "text", 80));
        add("hobbies", row.id, "tag", row.tag, pageMeta(`${name} – címke`, "text", 30));
        add("hobbies", row.id, "since", row.since, pageMeta(`${name} – mióta csinálom`, "text", 30));
        add("hobbies", row.id, "body", row.body, pageMeta(`${name} – leírás`, "multiline", 600));
      }
    }
    if (page.template === "games") {
      for (const row of gameRows) {
        const name = short(row.title);
        add("games", row.id, "title", row.title, pageMeta(`${name} – cím`, "text", 80));
        add("games", row.id, "genre", row.genre, pageMeta(`${name} – műfaj`, "text", 60));
        add("games", row.id, "review", row.review, pageMeta(`${name} – véleményem`, "multiline", 600));
      }
    }
    if (page.template === "youtube") {
      for (const row of youtubeRows) {
        const name = `${YOUTUBE_KIND_LABELS[row.kind] ?? "Elem"}: ${short(row.title, 32)}`;
        add("youtube_items", row.id, "title", row.title, pageMeta(`${name} – cím`, "text", 150));
        add("youtube_items", row.id, "author", row.author, pageMeta(`${name} – előadó / csatorna`, "text", 100));
        add("youtube_items", row.id, "note", row.note, pageMeta(`${name} – megjegyzés`, "multiline", 300));
      }
    }
    if (page.template === "football") {
      // Csak a nyitókép címe/alcíme és a „Miért a Real Madrid?” szövege látszik az oldalon
      // (a többi szekció címe a felület szövegei közül jön).
      for (const row of sectionRows) {
        const name = FOOTBALL_SECTION_LABELS[row.type] ?? row.type;
        if (row.type === "hero") {
          add("football_sections", row.id, "title", row.title, pageMeta(`${name} – cím`, "text", 120));
          add("football_sections", row.id, "bodyMd", row.bodyMd, pageMeta(`${name} – alcím`, "text", 200));
        }
        if (row.type === "why") add("football_sections", row.id, "bodyMd", row.bodyMd, pageMeta(`${name} – szöveg`, "markdown", 20_000));
      }
      for (const row of playerRows) {
        const name = `Játékos: ${short(row.name, 30)}`;
        add("football_players", row.id, "name", row.name, pageMeta(`${name} – név`, "text", 80));
        add("football_players", row.id, "position", row.position, pageMeta(`${name} – poszt`, "text", 40));
        add("football_players", row.id, "note", row.note, pageMeta(`${name} – megjegyzés`, "multiline", 300));
      }
      for (const row of momentRows) {
        const name = `Pillanat: ${short(row.title, 30)}`;
        add("football_moments", row.id, "year", row.year, pageMeta(`${name} – év`, "text", 20));
        add("football_moments", row.id, "title", row.title, pageMeta(`${name} – cím`, "text", 120));
        add("football_moments", row.id, "body", row.body, pageMeta(`${name} – szöveg`, "multiline", 800));
      }
      for (const row of factRows) {
        const name = `Alapadat: ${short(row.label, 30)}`;
        add("football_facts", row.id, "label", row.label, pageMeta(`${name} – megnevezés`, "text", 60));
        add("football_facts", row.id, "value", row.value, pageMeta(`${name} – érték`, "text", 120));
      }
    }
    if (page.template === "generic") {
      for (const row of genericRows.filter((item) => item.pageId === page.id)) {
        const name = `Kártya: ${short(row.title, 30)}`;
        add("generic_items", row.id, "title", row.title, pageMeta(`${name} – cím`, "text", 120));
        add("generic_items", row.id, "body", row.body, pageMeta(`${name} – szöveg`, "multiline", 1000));
      }
    }
  }

  // --- Képleírások (alt szövegek) -------------------------------------------------
  for (const row of mediaRows) {
    add("media", row.id, "alt", row.alt, {
      section: "Képleírások",
      label: `Kép #${row.id}${row.originalName ? ` (${short(row.originalName, 28)})` : ""}`,
      format: "text",
      max: 300,
      editHref: "/admin/mediatar",
    });
  }

  // --- Jogi szövegek ---------------------------------------------------------------
  for (const slug of ["privacy", "cookie"] as const) {
    const doc = legalRows.find((row) => row.slug === slug);
    add("legal_docs", slug, "bodyMd", doc?.bodyMd, {
      section: "Jogi szövegek",
      label: slug === "privacy" ? "Adatkezelési tájékoztató" : "Cookie (süti) tájékoztató",
      format: "markdown",
      max: 30_000,
      editHref: "/admin/jogi-oldalak",
    });
  }

  return out;
}
