/**
 * A saját szövegek fordításainak írása/olvasása (a Next.js-től független: az
 * Admin műveletei és a fordító parancs is ezt használja).
 *
 * Alapszabály: a kézzel írt vagy jóváhagyott fordítást (`manual`) gép soha nem
 * írja felül – kivéve, ha kifejezetten új fordítást kérsz rá.
 */
import { and, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { contentTranslations, translationRequests } from "@/db/schema";
import {
  contentKey,
  contentStatus,
  emptyCounts,
  parseContentKey,
  sourceHash,
  type ContentStatus,
  type LocaleProgress,
  type Origin,
} from "./status";

export type StoredTranslation = {
  key: string;
  locale: string;
  value: string;
  origin: Origin;
  sourceHash: string;
  updatedAt: number;
};

function keyParts(key: string) {
  const parts = parseContentKey(key);
  if (!parts) throw new Error(`Érvénytelen szövegazonosító: ${key}`);
  return parts;
}

const rowWhere = (key: string, locale: string) => {
  const { entity, entityId, field } = keyParts(key);
  return and(
    eq(contentTranslations.entity, entity),
    eq(contentTranslations.entityId, entityId),
    eq(contentTranslations.field, field),
    eq(contentTranslations.locale, locale),
  );
};

const requestWhere = (key: string, locale: string) => {
  const { entity, entityId, field } = keyParts(key);
  return and(
    eq(translationRequests.entity, entity),
    eq(translationRequests.entityId, entityId),
    eq(translationRequests.field, field),
    eq(translationRequests.locale, locale),
  );
};

/** Egy nyelv (vagy az összes nyelv) tárolt fordításai. */
export async function readStoredTranslations(db: Db, locale?: string): Promise<StoredTranslation[]> {
  const rows = await db
    .select()
    .from(contentTranslations)
    .where(locale ? eq(contentTranslations.locale, locale) : undefined);
  return rows.map((row) => ({
    key: contentKey(row.entity, row.entityId, row.field),
    locale: row.locale,
    value: row.value,
    origin: (row.origin === "auto" || row.origin === "keep" ? row.origin : "manual") as Origin,
    sourceHash: row.sourceHash,
    updatedAt: row.updatedAt,
  }));
}

/** A „fordításra vár” lista (`kulcs|nyelv` formában, a gyors kereséshez). */
export async function readRequestSet(db: Db, locale?: string): Promise<Set<string>> {
  const rows = await db
    .select()
    .from(translationRequests)
    .where(locale ? eq(translationRequests.locale, locale) : undefined);
  return new Set(rows.map((row) => requestId(contentKey(row.entity, row.entityId, row.field), row.locale)));
}

export const requestId = (key: string, locale: string) => `${key}|${locale}`;

/**
 * Fordítás mentése.
 * - `manual`: kézzel írt / átnézett (üres szövegnél törli a fordítást → a magyar látszik),
 * - `auto`: gépi fordítás (ellenőrizendő),
 * - `keep`: szándékosan marad az eredeti (a szöveg ilyenkor üres).
 * A mentés egyúttal teljesíti a „fordításra vár” kérést is.
 */
export async function writeContentTranslation(
  db: Db,
  input: { key: string; locale: string; value: string; origin: Origin; source: string; hash?: string },
): Promise<void> {
  const value = input.origin === "keep" ? "" : input.value.trim();
  if (!value && input.origin !== "keep") {
    await db.delete(contentTranslations).where(rowWhere(input.key, input.locale));
  } else {
    const { entity, entityId, field } = keyParts(input.key);
    const hash = input.hash ?? sourceHash(input.source);
    const now = Date.now();
    await db
      .insert(contentTranslations)
      .values({ entity, entityId, field, locale: input.locale, value, origin: input.origin, sourceHash: hash, updatedAt: now })
      .onConflictDoUpdate({
        target: [contentTranslations.entity, contentTranslations.entityId, contentTranslations.field, contentTranslations.locale],
        set: { value, origin: input.origin, sourceHash: hash, updatedAt: now },
      });
  }
  await db.delete(translationRequests).where(requestWhere(input.key, input.locale));
}

/** A tárolt fordítás törlése (pl. „Mégis lefordítom” egy „Magyarul marad” szövegnél). */
export async function deleteContentTranslation(db: Db, key: string, locale: string): Promise<void> {
  await db.delete(contentTranslations).where(rowWhere(key, locale));
}

export async function addTranslationRequest(db: Db, key: string, locale: string): Promise<void> {
  const { entity, entityId, field } = keyParts(key);
  await db
    .insert(translationRequests)
    .values({ entity, entityId, field, locale, requestedAt: Date.now() })
    .onConflictDoNothing();
}

export async function removeTranslationRequest(db: Db, key: string, locale: string): Promise<void> {
  await db.delete(translationRequests).where(requestWhere(key, locale));
}

/** Egy törölt elem (pl. hobbi, kép, aloldal) összes fordítása és kérése is törlődik. */
export async function deleteContentForEntity(db: Db, entity: string, entityId: string | number): Promise<void> {
  const id = String(entityId);
  await db
    .delete(contentTranslations)
    .where(and(eq(contentTranslations.entity, entity), eq(contentTranslations.entityId, id)));
  await db
    .delete(translationRequests)
    .where(and(eq(translationRequests.entity, entity), eq(translationRequests.entityId, id)));
}

/** Egy törölt nyelv összes saját-szöveg fordítása és kérése is törlődik. */
export async function deleteContentForLocale(db: Db, locale: string): Promise<void> {
  await db.delete(contentTranslations).where(eq(contentTranslations.locale, locale));
  await db.delete(translationRequests).where(eq(translationRequests.locale, locale));
}

/**
 * Egy mező állapota egy nyelven (a tárolt fordítás és a kérések alapján).
 * Segédfüggvény az Adminhoz és a fordító parancshoz.
 */
export function statusOf(
  source: string,
  stored: Map<string, StoredTranslation>,
  requests: Set<string>,
  key: string,
  locale: string,
): ContentStatus {
  const id = requestId(key, locale);
  return contentStatus(source, stored.get(id), requests.has(id));
}

/** A tárolt fordítások `kulcs|nyelv` szerint. */
export function indexStored(rows: StoredTranslation[]): Map<string, StoredTranslation> {
  return new Map(rows.map((row) => [requestId(row.key, row.locale), row]));
}

/**
 * Gépi fordításra szoruló-e egy mező (a „minden hiányzó és elavult” kéréshez):
 * a hiányzók és a gépi fordítású elavultak. A kézzel írt elavult szöveget nem
 * kéri automatikusan – azt te döntöd el (átírod, jóváhagyod, vagy egyenként kérsz rá új fordítást).
 */
export function needsMachineTranslation(status: ContentStatus, stored: StoredTranslation | undefined): boolean {
  if (status === "missing") return true;
  return status === "outdated" && stored?.origin === "auto";
}

const FOOTER_LINK = /^links\.(\d+)\.label$/;

/**
 * A lábléc linkjei sorszámmal azonosítottak (`links.0.label`, `links.1.label`…).
 * Ha a linkeket átrendezed vagy törlöd, a fordításaik a linkkel együtt „költöznek”:
 * azonos szövegű link → ugyanaz a fordítás; átírt link a helyén → a régi fordítás
 * marad (elavultként); törölt link → a fordítása is törlődik.
 */
export async function remapFooterLinkTranslations(db: Db, oldLabels: string[], newLabels: string[]): Promise<void> {
  const used = new Set<number>();
  const mapping = new Map<number, number>(); // új sorszám → régi sorszám
  newLabels.forEach((label, j) => {
    const candidates = oldLabels.map((old, i) => (old.trim() === label.trim() && !used.has(i) ? i : -1)).filter((i) => i >= 0);
    const i = candidates.includes(j) ? j : candidates[0];
    if (i !== undefined) {
      mapping.set(j, i);
      used.add(i);
    }
  });
  newLabels.forEach((_, j) => {
    if (!mapping.has(j) && j < oldLabels.length && !used.has(j)) {
      mapping.set(j, j);
      used.add(j);
    }
  });
  if ([...mapping].every(([j, i]) => i === j) && oldLabels.length === newLabels.length) return;

  const inFooter = (entity: string, entityId: string) => entity === "settings" && entityId === "footer";
  const rows = (await db.select().from(contentTranslations)).filter((row) => inFooter(row.entity, row.entityId) && FOOTER_LINK.test(row.field));
  const requests = (await db.select().from(translationRequests)).filter((row) => inFooter(row.entity, row.entityId) && FOOTER_LINK.test(row.field));
  const oldIndex = (field: string) => Number(FOOTER_LINK.exec(field)?.[1]);

  const footerLinks = and(eq(contentTranslations.entity, "settings"), eq(contentTranslations.entityId, "footer"));
  for (const row of rows) await db.delete(contentTranslations).where(and(footerLinks, eq(contentTranslations.field, row.field)));
  const footerRequests = and(eq(translationRequests.entity, "settings"), eq(translationRequests.entityId, "footer"));
  for (const row of requests) await db.delete(translationRequests).where(and(footerRequests, eq(translationRequests.field, row.field)));

  for (const [j, i] of mapping) {
    const field = `links.${j}.label`;
    for (const row of rows.filter((r) => oldIndex(r.field) === i)) await db.insert(contentTranslations).values({ ...row, field });
    for (const row of requests.filter((r) => oldIndex(r.field) === i)) await db.insert(translationRequests).values({ ...row, field });
  }
}

/** Nyelvenként: hány szöveg van az egyes állapotokban. */
export function computeProgress(
  fields: { key: string; source: string }[],
  stored: Map<string, StoredTranslation>,
  requests: Set<string>,
  locales: { code: string; name: string; flag: string; enabled: boolean }[],
): LocaleProgress[] {
  return locales.map((locale) => {
    const counts = emptyCounts();
    for (const field of fields) counts[statusOf(field.source, stored, requests, field.key, locale.code)]++;
    return { code: locale.code, name: locale.name, flag: locale.flag, enabled: locale.enabled, total: fields.length, counts };
  });
}
