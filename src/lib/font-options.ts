/**
 * Az Adminban választható betűtípusok. Mindegyik támogatja a magyar ékezeteket
 * (ő, ű, Ő, Ű – `latin-ext`), ezt a `npm run fonts:check` ellenőrzi.
 * A betűket a `next/font` a buildkor letölti és helyben szolgálja ki
 * (a látogató böngészője nem kér semmit a Google-től).
 */
export const FONT_OPTIONS = [
  { key: "inter", label: "Inter", cssVar: "--font-inter", note: "Jól olvasható, modern (alap törzsszöveg)" },
  { key: "interTight", label: "Inter Tight", cssVar: "--font-inter-tight", note: "Tömör, sportos címekhez (Real Madrid-hangulat)" },
  { key: "roboto", label: "Roboto", cssVar: "--font-roboto", note: "Letisztult, semleges" },
  { key: "montserrat", label: "Montserrat", cssVar: "--font-montserrat", note: "Geometrikus, barátságos" },
  { key: "oswald", label: "Oswald", cssVar: "--font-oswald", note: "Keskeny, magazinos címbetű" },
  { key: "playfair", label: "Playfair Display", cssVar: "--font-playfair", note: "Elegáns, talpas" },
  { key: "cinzel", label: "Cinzel", cssVar: "--font-cinzel", note: "Királyi, díszes (fejléc felirat)" },
  { key: "chakra", label: "Chakra Petch", cssVar: "--font-chakra", note: "Szögletes „gamer” betű" },
] as const;

export type FontKey = (typeof FONT_OPTIONS)[number]["key"];

export const FONT_KEYS = FONT_OPTIONS.map((f) => f.key) as [FontKey, ...FontKey[]];

export function fontCssVar(key: FontKey): string {
  return FONT_OPTIONS.find((f) => f.key === key)?.cssVar ?? "--font-inter";
}
