/**
 * Fordítási segédfüggvények (a Next.js-től független, egységtesztelt kód).
 */

export type Dictionary = Record<string, string>;
export type TranslationRow = { key: string; locale: string; value: string };
export type TranslateVars = Record<string, string | number>;

/**
 * Egy nyelv szótára. Sorrend (az utóbbi nyer):
 * beépített magyar → adatbázisbeli forrásnyelv (magyar) → a kért nyelv.
 * Az üres fordítás hiányzónak számít, így ott is a magyar jelenik meg.
 */
export function buildDictionary(
  rows: readonly TranslationRow[],
  locale: string,
  fallbackLocale: string,
  builtin: Dictionary = {},
): Dictionary {
  const fallback: Dictionary = {};
  const primary: Dictionary = {};
  for (const row of rows) {
    if (row.value.trim() === "") continue;
    if (row.locale === locale) primary[row.key] = row.value;
    if (row.locale === fallbackLocale) fallback[row.key] = row.value;
  }
  return { ...builtin, ...fallback, ...primary };
}

/** `{név}` helyőrzők cseréje; az ismeretlen helyőrző változatlan marad. */
export function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

/** Szöveg a szótárból; ha a kulcs sehol sincs meg, magát a kulcsot adja vissza. */
export function translate(dict: Dictionary, key: string, vars?: TranslateVars): string {
  return interpolate(dict[key] ?? key, vars);
}

/** A hiányzó (vagy üres) fordítások kulcsai egy nyelvhez – az Admin kiemeléséhez. */
export function missingKeys(
  keys: readonly string[],
  rows: readonly TranslationRow[],
  locale: string,
): string[] {
  const present = new Set(
    rows.filter((r) => r.locale === locale && r.value.trim() !== "").map((r) => r.key),
  );
  return keys.filter((k) => !present.has(k));
}
