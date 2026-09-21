/**
 * A saját (kézzel beírt) szövegek fordításának állapota – a Next.js-től független,
 * egységtesztelt kód. A böngészőben (Admin) és a szerveren is használható.
 */

/** Egy fordítás eredete. */
export const ORIGINS = ["auto", "manual", "keep"] as const;
export type Origin = (typeof ORIGINS)[number];

/**
 * Az Adminban mutatott állapot:
 * - `missing`   – még nincs fordítás (a látogató a magyart látja)
 * - `requested` – fordításra vár (a következő `/forditas` futtatáskor készül el)
 * - `auto`      – gépi fordítás, még senki nem nézte át
 * - `manual`    – kész (kézzel írt vagy átnézett)
 * - `keep`      – szándékosan marad az eredeti (pl. név)
 * - `outdated`  – a magyar szöveg azóta megváltozott
 */
export const CONTENT_STATUSES = ["missing", "requested", "auto", "outdated", "manual", "keep"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  missing: "Hiányzik",
  requested: "Fordításra vár",
  auto: "Gépi – ellenőrizd",
  outdated: "Elavult",
  manual: "Kész",
  keep: "Magyarul marad",
};

/**
 * A magyar forrásszöveg ujjlenyomata – ebből látszik, ha a magyar szöveg a
 * fordítás óta megváltozott. (Gyors, nem titkosító célú hash; a sorvégek
 * formája és a két végén lévő szóköz nem számít.)
 */
export function sourceHash(text: string): string {
  const input = text.replace(/\r\n?/g, "\n").trim();
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

export type TranslationRowLike = { value: string; origin: string; sourceHash: string };

export function contentStatus(source: string, row: TranslationRowLike | undefined, requested: boolean): ContentStatus {
  if (requested) return "requested";
  if (!row) return "missing";
  if (row.origin === "keep") return "keep";
  if (!row.value.trim()) return "missing";
  if (row.sourceHash && row.sourceHash !== sourceHash(source)) return "outdated";
  return row.origin === "auto" ? "auto" : "manual";
}

/** A mező azonosítója: `entitás:azonosító:mező`, pl. `hobbies:12:title` vagy `settings:home:guide.text`. */
export function contentKey(entity: string, entityId: string | number, field: string): string {
  return `${entity}:${entityId}:${field}`;
}

export function parseContentKey(key: string): { entity: string; entityId: string; field: string } | null {
  const match = /^([a-z_]+):([a-z0-9_-]+):([A-Za-z0-9_.]+)$/.exec(key);
  return match ? { entity: match[1], entityId: match[2], field: match[3] } : null;
}

/**
 * A jogi szövegek `{{HELYŐRZŐ}}` jelei (pl. `{{ADATKEZELO_NEV}}`) – ide kerül az
 * Adminban megadott adat, ezért a fordításban is benne kell maradniuk.
 */
export function lostTokens(source: string, translation: string): string[] {
  const tokens = (text: string) => new Set(Array.from(text.matchAll(/\{\{([A-Z_]+)\}\}/g), (m) => m[1]));
  const present = tokens(translation);
  return [...tokens(source)].filter((token) => !present.has(token));
}

/** Egy nyelv haladása (az Admin nyelvválasztójához és az Irányítópulthoz). */
export type LocaleProgress = {
  code: string;
  name: string;
  flag: string;
  enabled: boolean;
  total: number;
  counts: Record<ContentStatus, number>;
};

export function emptyCounts(): Record<ContentStatus, number> {
  return Object.fromEntries(CONTENT_STATUSES.map((status) => [status, 0])) as Record<ContentStatus, number>;
}
