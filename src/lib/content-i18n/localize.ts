/**
 * A saját szövegek megjelenítése a látogató nyelvén.
 *
 * A fordítások az adatbázisban vannak (nincs online fordítás oldalbetöltéskor).
 * Ha egy mezőnek nincs fordítása, a magyar eredeti jelenik meg `lang="hu"`
 * jelöléssel (így a képernyőolvasó is magyarul olvassa fel). Az „elavult”
 * fordítás (a magyar azóta változott) is megjelenik, amíg nem frissíted.
 */
import { eq } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db/client";
import { contentTranslations } from "@/db/schema";
import { cached } from "@/lib/cache";
import { SOURCE_LOCALE } from "@/lib/i18n/messages";
import { getI18n } from "@/lib/i18n/server";
import { createLocalizer, type Localizer, type StoredValue } from "./localizer";
import { contentKey } from "./status";

export type { Localized, LocalizedRow, Localizer } from "./localizer";

/** Egy nyelv összes megjeleníthető fordítása: `entitás:azonosító:mező` → szöveg. */
export async function readContentTranslationMap(locale: string): Promise<Record<string, StoredValue>> {
  const rows = await getDb()
    .select({
      entity: contentTranslations.entity,
      entityId: contentTranslations.entityId,
      field: contentTranslations.field,
      value: contentTranslations.value,
      origin: contentTranslations.origin,
      sourceHash: contentTranslations.sourceHash,
    })
    .from(contentTranslations)
    .where(eq(contentTranslations.locale, locale));
  const map: Record<string, StoredValue> = {};
  for (const row of rows) {
    if (row.origin === "keep" || !row.value.trim()) continue;
    map[contentKey(row.entity, row.entityId, row.field)] = { value: row.value, hash: row.sourceHash };
  }
  return map;
}

const getContentTranslationMap = cached(readContentTranslationMap, ["content-translations"]);

/** A kérés nyelvéhez tartozó fordító (kérésenként egyszer töltődik be). */
export const getLocalizer = cache(async (): Promise<Localizer> => {
  const { locale } = await getI18n();
  const map = locale === SOURCE_LOCALE ? {} : await getContentTranslationMap(locale);
  return createLocalizer(locale, map);
});
