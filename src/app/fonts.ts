/**
 * Betűtípusok – a `next/font` buildkor letölti és helyben szolgálja ki őket,
 * így a látogató böngészője nem kér semmit a Google-től.
 * Mindegyik `latin-ext` alkészlettel, hogy az ő, ű, Ő, Ű is megjelenjen
 * (ellenőrzés: `npm run fonts:check`).
 *
 * Csak a kezdőlap nagy feliratának (Roboto) és a fejléc feliratának (Cinzel)
 * betűjét töltjük elő (preload), mert ezek látszanak azonnal; a többi akkor
 * töltődik le, amikor az oldal ténylegesen használja (addig egy hasonló méretű
 * rendszerbetű látszik).
 * Így mobilon a lassú hálózaton is hamarabb megjelenik az oldal.
 * (A next/font csak kiírt, „szó szerinti” beállításokat fogad el.)
 */
import {
  Chakra_Petch,
  Cinzel,
  Inter,
  Inter_Tight,
  Montserrat,
  Oswald,
  Playfair_Display,
  Roboto,
} from "next/font/google";

export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

export const interTight = Inter_Tight({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter-tight",
  display: "swap",
  preload: false,
});

export const cinzel = Cinzel({ subsets: ["latin", "latin-ext"], variable: "--font-cinzel", display: "swap" });

export const roboto = Roboto({
  subsets: ["latin", "latin-ext"],
  variable: "--font-roboto",
  display: "swap",
});

export const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
});

export const oswald = Oswald({
  subsets: ["latin", "latin-ext"],
  variable: "--font-oswald",
  display: "swap",
  preload: false,
});

export const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});

export const chakra = Chakra_Petch({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-chakra",
  display: "swap",
  preload: false,
});

/** Az összes betű CSS változója (a `<html>` elemre kerül). */
export const fontVariables = [inter, interTight, cinzel, roboto, montserrat, oswald, playfair, chakra]
  .map((font) => font.variable)
  .join(" ");
