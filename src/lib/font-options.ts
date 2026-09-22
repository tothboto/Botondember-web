/**
 * Az Adminban választható betűtípusok. Mindegyik támogatja a magyar ékezeteket
 * (ő, ű, Ő, Ű – `latin-ext`), ezt a `npm run fonts:check` ellenőrzi.
 * A betűket a `next/font` a buildkor letölti és helyben szolgálja ki
 * (a látogató böngészője nem kér semmit a Google-től).
 *
 * `heroWidth`: egy karakter átlagos szélessége a kezdőlap nagy feliratában
 * (extra félkövér, csupa nagybetű, -0,045em betűköz), a betűméret arányában.
 * Böngészőben mért érték (magyar, angol, német, horvát… mondatokon, a legszélesebbre
 * kerekítve) – ebből számolja ki az oldal, mekkora lehet a felirat, hogy minden sora kiférjen.
 */
export const FONT_OPTIONS = [
  { key: "inter", label: "Inter", cssVar: "--font-inter", note: "Jól olvasható, modern (alap törzsszöveg)", heroWidth: 0.62 },
  { key: "interTight", label: "Inter Tight", cssVar: "--font-inter-tight", note: "Tömör, sportos címekhez (Real Madrid-hangulat)", heroWidth: 0.6 },
  { key: "roboto", label: "Roboto", cssVar: "--font-roboto", note: "Letisztult, semleges", heroWidth: 0.57 },
  { key: "montserrat", label: "Montserrat", cssVar: "--font-montserrat", note: "Geometrikus, barátságos", heroWidth: 0.67 },
  { key: "oswald", label: "Oswald", cssVar: "--font-oswald", note: "Keskeny, magazinos címbetű", heroWidth: 0.47 },
  { key: "playfair", label: "Playfair Display", cssVar: "--font-playfair", note: "Elegáns, talpas", heroWidth: 0.63 },
  { key: "cinzel", label: "Cinzel", cssVar: "--font-cinzel", note: "Királyi, díszes (fejléc felirat)", heroWidth: 0.67 },
  { key: "chakra", label: "Chakra Petch", cssVar: "--font-chakra", note: "Szögletes „gamer” betű", heroWidth: 0.57 },
] as const;

export type FontKey = (typeof FONT_OPTIONS)[number]["key"];

export const FONT_KEYS = FONT_OPTIONS.map((f) => f.key) as [FontKey, ...FontKey[]];

export function fontCssVar(key: FontKey): string {
  return FONT_OPTIONS.find((f) => f.key === key)?.cssVar ?? "--font-inter";
}

/** Egy karakter átlagos szélessége a kezdőlap feliratában az adott betűtípussal (lásd fent). */
export function heroCharWidth(key: FontKey): number {
  return FONT_OPTIONS.find((f) => f.key === key)?.heroWidth ?? 0.62;
}
