import { describe, expect, it } from "vitest";
import { buildDictionary, interpolate, missingKeys, translate, type TranslationRow } from "@/lib/i18n/translate";

const rows: TranslationRow[] = [
  { key: "nav.home", locale: "hu", value: "Kezdőlap" },
  { key: "nav.home", locale: "en", value: "Home" },
  { key: "common.backToTop", locale: "hu", value: "Vissza a tetejére" },
  // az angol fordítás üres → hiányzónak számít
  { key: "common.backToTop", locale: "en", value: "   " },
  { key: "footer.privacy", locale: "hu", value: "Adatkezelési tájékoztató" },
];

describe("fordítás-visszaesés", () => {
  it("a kért nyelvet használja, ha van fordítás", () => {
    const dict = buildDictionary(rows, "en", "hu");
    expect(translate(dict, "nav.home")).toBe("Home");
  });

  it("hiányzó fordításnál a magyar szöveg jelenik meg", () => {
    const dict = buildDictionary(rows, "en", "hu");
    expect(translate(dict, "footer.privacy")).toBe("Adatkezelési tájékoztató");
  });

  it("az üres fordítás is hiányzónak számít (magyarra esik vissza)", () => {
    const dict = buildDictionary(rows, "en", "hu");
    expect(translate(dict, "common.backToTop")).toBe("Vissza a tetejére");
  });

  it("olyan nyelvnél is működik, amelyhez egyáltalán nincs fordítás", () => {
    const dict = buildDictionary(rows, "is", "hu");
    expect(translate(dict, "nav.home")).toBe("Kezdőlap");
  });

  it("ha az adatbázisban sincs meg, a beépített magyar szöveg jön", () => {
    const dict = buildDictionary(rows, "de", "hu", { "legal.toc": "Tartalomjegyzék" });
    expect(translate(dict, "legal.toc")).toBe("Tartalomjegyzék");
  });

  it("a teljesen ismeretlen kulcsot adja vissza", () => {
    const dict = buildDictionary(rows, "en", "hu");
    expect(translate(dict, "nincs.ilyen.kulcs")).toBe("nincs.ilyen.kulcs");
  });
});

describe("helyőrzők", () => {
  it("behelyettesíti a változókat", () => {
    expect(interpolate("{count} videó", { count: 12 })).toBe("12 videó");
    expect(translate({ k: "{rating} / 5 csillag" }, "k", { rating: 4 })).toBe("4 / 5 csillag");
  });

  it("az ismeretlen helyőrzőt változatlanul hagyja", () => {
    expect(interpolate("Szia {nev}!", {})).toBe("Szia {nev}!");
  });
});

describe("hiányzó fordítások listája", () => {
  it("felsorolja a hiányzó és az üres kulcsokat", () => {
    const keys = ["nav.home", "common.backToTop", "footer.privacy"];
    expect(missingKeys(keys, rows, "en")).toEqual(["common.backToTop", "footer.privacy"]);
    expect(missingKeys(keys, rows, "hu")).toEqual([]);
  });
});
