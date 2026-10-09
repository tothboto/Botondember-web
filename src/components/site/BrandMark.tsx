import { Crown } from "lucide-react";
import { splitBrandTitle } from "@/lib/brand-title";
import type { LogoStyle } from "@/lib/logo-styles";

/**
 * A fejléc emblémája: az oldal neve a választott stílusban (Admin > Megjelenés).
 * A szerkezet minden stílusnál ugyanaz – jel (korona / monogram), a kiemelt szó és a kis
 * sor –, a kinézetet a CSS adja (`.brand[data-style="…"]` a globals.css-ben).
 * A díszítő másolatokat (glitch-rétegek, körvonal) a CSS rajzolja ki a `data-text`-ből,
 * így az elem szövege maga a felirat marad.
 */
export function BrandMark({ title, lang, style }: { title: string; lang?: string; style: LogoStyle }) {
  const brand = splitBrandTitle(title);
  const tagline = brand.rest ? (
    <span className="brand-tagline">
      <span>{brand.rest}</span>
    </span>
  ) : null;

  return (
    <span className="brand" data-style={style} data-rest-first={brand.rest && brand.restFirst ? "" : undefined}>
      <span aria-hidden className="brand-emblem" data-letter={brand.initial}>
        <Crown />
      </span>
      <span lang={lang} className="brand-words">
        {brand.restFirst && tagline}
        {brand.restFirst && tagline && " "}
        <span className="brand-lead" data-text={brand.lead}>
          <Crown aria-hidden className="brand-lead-crown" />
          {brand.lead}
        </span>
        {!brand.restFirst && tagline && " "}
        {!brand.restFirst && tagline}
      </span>
    </span>
  );
}
