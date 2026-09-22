import { describe, expect, it } from "vitest";
import { FONT_OPTIONS, heroCharWidth } from "@/lib/font-options";
import { heroLines, heroWidthEm, longestLine } from "@/lib/hero";

describe("a kezdőlap feliratának sorai", () => {
  it("a mondatok végén tör, ha nincs sortörés", () => {
    expect(heroLines("Helló! Botondember vagyok. Üdv az első honlapomon!")).toEqual([
      "Helló!",
      "Botondember vagyok.",
      "Üdv az első honlapomon!",
    ]);
  });

  it("a kézi sortörés (Enter) az erősebb", () => {
    expect(heroLines("Botondember\nkedvenc\ndolgai")).toEqual(["Botondember", "kedvenc", "dolgai"]);
    expect(heroLines("Egy sor\r\n\r\nMásik sor")).toEqual(["Egy sor", "Másik sor"]);
  });

  it("írásjel nélkül egy sor marad, üresen nincs sor", () => {
    expect(heroLines("Szia")).toEqual(["Szia"]);
    expect(heroLines("   ")).toEqual([]);
    expect(heroLines("Mi ez?! Na jó…")).toEqual(["Mi ez?!", "Na jó…"]);
  });

  it("a betűméret a leghosszabb sorhoz igazodik (de legalább 6 karakternyi)", () => {
    expect(longestLine(["Helló!", "Botondember vagyok."])).toBe(19);
    expect(longestLine(["Hi"])).toBe(6);
  });

  it("a leghosszabb sor becsült szélessége a betűtípus karakterszélességével számol", () => {
    const lines = heroLines("Helló! Botondember vagyok. Üdv az első honlapomon!");
    expect(heroWidthEm(lines, heroCharWidth("roboto"))).toBeCloseTo(23 * 0.57, 3);
    // A keskeny betű (Oswald) kisebb, a széles (Montserrat) nagyobb szélességet ad → más betűméret.
    expect(heroWidthEm(lines, heroCharWidth("oswald"))).toBeLessThan(heroWidthEm(lines, heroCharWidth("montserrat")));
  });

  it("minden választható betűtípushoz van mért karakterszélesség", () => {
    for (const font of FONT_OPTIONS) {
      expect(font.heroWidth, font.key).toBeGreaterThan(0.35);
      expect(font.heroWidth, font.key).toBeLessThan(0.8);
    }
  });
});
