import { describe, expect, it } from "vitest";
import { heroLines, longestLine } from "@/lib/hero";

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
});
