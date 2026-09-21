/**
 * A saját szövegek fordítójának magja – a Next.js-től független, egységtesztelt kód.
 * (A kéréshez kötött változat: `localize.ts` → `getLocalizer()`.)
 */
import { SOURCE_LOCALE } from "@/lib/i18n/messages";
import { contentKey, sourceHash } from "./status";

export type Localized = { text: string; lang: string };

/** Egy tárolt fordítás: a szöveg és a magyar eredeti ujjlenyomata a fordítás idején. */
export type StoredValue = { value: string; hash: string };

/** A szöveges mezők nevei egy sorban (pl. egy hobbinál: title, body, since, tag). */
type TextFields<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T] & string;

export type Localizer = {
  /** Az oldal nyelve. */
  locale: string;
  /**
   * Egy mező szövege és nyelve (fordítás, vagy ha nincs: a magyar eredeti).
   * Az elavult fordítás (a magyar azóta változott) is megjelenik – kivéve `strict`
   * módban (pl. a sorszámmal azonosított lábléc-linkeknél, ahol egy törlés után
   * a sorszám már egy másik linkre mutathat).
   */
  get: (entity: string, entityId: string | number, field: string, source: string, options?: { strict?: boolean }) => Localized;
  /** Egy sor (pl. hobbi) fordítható mezői lecserélve; a `lang` mezőnként megmondja a nyelvet. */
  row: <T extends { id: number }, F extends TextFields<T>>(
    entity: string,
    row: T,
    fields: readonly F[],
  ) => T & { lang: Record<F, string> };
};

/**
 * @param map a nyelv fordításai (`entitás:azonosító:mező` → szöveg); a „maradjon magyarul”
 *            és az üres fordítások már nincsenek benne.
 */
export function createLocalizer(locale: string, map: Record<string, StoredValue>): Localizer {
  const get: Localizer["get"] = (entity, entityId, field, source, options) => {
    if (locale === SOURCE_LOCALE || !source.trim()) return { text: source, lang: SOURCE_LOCALE };
    const stored = map[contentKey(entity, entityId, field)];
    if (!stored || (options?.strict && stored.hash !== sourceHash(source))) return { text: source, lang: SOURCE_LOCALE };
    return { text: stored.value, lang: locale };
  };
  return {
    locale,
    get,
    row: (entity, row, fields) => {
      const copy = { ...row } as Record<string, unknown>;
      const lang: Record<string, string> = {};
      for (const field of fields) {
        const localized = get(entity, row.id, field, String(row[field] ?? ""));
        copy[field] = localized.text;
        lang[field] = localized.lang;
      }
      copy.lang = lang;
      return copy as never;
    },
  };
}

/** Egy fordított sor típusa, pl. `LocalizedRow<Game, "title" | "genre">`. */
export type LocalizedRow<T, F extends string> = T & { lang: Record<F, string> };
