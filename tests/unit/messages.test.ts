import { describe, expect, it } from "vitest";
import { MESSAGE_GROUPS, SEED_LOCALES, SEED_MESSAGES, SOURCE_LOCALE } from "@/lib/i18n/messages";

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe("a felület szövegei (seed)", () => {
  it("a forrásnyelv a magyar, és ez az alapnyelv", () => {
    expect(SOURCE_LOCALE).toBe("hu");
    expect(SEED_LOCALES.find((l) => l.isDefault)?.code).toBe("hu");
  });

  it("mind az öt nyelv szerepel: magyar, angol, spanyol, német, izlandi", () => {
    expect(SEED_LOCALES.map((l) => l.code)).toEqual(["hu", "en", "es", "de", "is"]);
  });

  it.each(Object.entries(SEED_MESSAGES))("%s – minden nyelven ki van töltve, azonos helyőrzőkkel", (_key, row) => {
    const expected = placeholders(row.hu);
    for (const locale of SEED_LOCALES.map((l) => l.code)) {
      const value = row[locale];
      expect(value, `hiányzó fordítás: ${locale}`).toBeTruthy();
      expect(value.trim()).toBe(value);
      expect(placeholders(value)).toEqual(expected);
    }
  });

  it("minden kulcs egy ismert csoportba tartozik (az Admin táblázathoz)", () => {
    for (const key of Object.keys(SEED_MESSAGES)) {
      expect(MESSAGE_GROUPS[key.split(".")[0]], key).toBeDefined();
    }
  });
});
