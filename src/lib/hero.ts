/**
 * A kezdőlap nagy feliratának sorokra bontása (Édesapa oldalának stílusában:
 * soronként váltakozva körvonalas és teli betűk).
 *
 * - Ha a szövegben van sortörés (Enter), az dönt.
 * - Ha nincs, a mondatok végén (. ! ? …) törik: „Helló! Botondember vagyok. Üdv…”
 *   → „Helló!” / „Botondember vagyok.” / „Üdv…”.
 */
export function heroLines(message: string): string[] {
  const byNewline = message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (byNewline.length > 1) return byNewline;
  const text = byNewline[0] ?? "";
  const bySentence = text.match(/[^.!?…]+(?:[.!?…]+|$)/g)?.map((line) => line.trim()).filter(Boolean) ?? [];
  return bySentence.length > 0 ? bySentence : text ? [text] : [];
}

/** A leghosszabb sor hossza – ehhez igazodik a betűméret, hogy minden sor kiférjen. */
export function longestLine(lines: string[]): number {
  return Math.max(6, ...lines.map((line) => [...line].length));
}
