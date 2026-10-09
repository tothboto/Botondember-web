/**
 * A fejléc emblémájának (az oldal neve a fejlécben) választható stílusai – Admin > Megjelenés.
 * Mindegyik egy kész, megtervezett kinézet saját betűvel és mozgással; a rajzuk a
 * `src/app/globals.css`-ben van (`.brand[data-style="…"]`), a betűik a `src/app/fonts.ts`-ben.
 */
export const LOGO_STYLES = [
  {
    key: "esport",
    label: "E-sport",
    note: "Vastag, dőlt betű árnyékkal és ferde címkével – néha „glitch” villanás fut át rajta.",
  },
  {
    key: "neon",
    label: "Neon",
    note: "Világító neoncső-felirat sötét táblán, néha megvillan.",
  },
  {
    key: "sticker",
    label: "3D matrica",
    note: "Rajzfilmes, vastag körvonalas arany betű, ami néha megbillen.",
  },
  {
    key: "glass",
    label: "Üveg",
    note: "Áttetsző kapszula forgó színes gyűrűvel és áramló színátmenettel.",
  },
  {
    key: "royal",
    label: "Királyi",
    note: "Az eredeti: korona és díszes, arany felirat (a „Fejléc felirat” betűtípussal).",
  },
] as const;

export type LogoStyle = (typeof LOGO_STYLES)[number]["key"];

export const LOGO_STYLE_KEYS = LOGO_STYLES.map((style) => style.key) as [LogoStyle, ...LogoStyle[]];
