import { describe, expect, it } from "vitest";
import { mergeWithDefaults, parseSetting, resolveBrandColors, settingDefaults } from "@/lib/settings";
import { isSafeHttpUrl, normalizeUrl } from "@/lib/url";

describe("beállítások", () => {
  it("üres adatnál az alapértékeket adja", () => {
    expect(parseSetting("home", undefined)).toEqual(settingDefaults.home);
  });

  it("a hiányzó mezőket az alapértékből pótolja", () => {
    const home = parseSetting("home", { message: "Szia!", motto: { enabled: true } });
    expect(home.message).toBe("Szia!");
    expect(home.motto).toEqual({ enabled: true, text: "", author: "" });
    expect(home.overlay).toBe(55);
  });

  it("hibás adatnál visszaáll az alapértékre", () => {
    expect(parseSetting("home", { overlay: 999 })).toEqual(settingDefaults.home);
    expect(parseSetting("general", { defaultTheme: "rózsaszín" })).toEqual(settingDefaults.general);
  });

  it("veszélyes linket nem enged a láblécbe", () => {
    const footer = parseSetting("footer", { links: [{ label: "Rossz", url: "javascript:alert(1)" }] });
    expect(footer.links).toEqual([]);
  });

  it("az ismeretlen kulcsokat eldobja", () => {
    const merged = mergeWithDefaults({ a: 1 }, { a: 2, b: 3 });
    expect(merged).toEqual({ a: 2 });
  });

  it("a márkaszíneknél a felülírás nyer, egyébként a Real Madrid színei", () => {
    const colors = resolveBrandColors({
      ...settingDefaults.appearance,
      colors: { ...settingDefaults.appearance.colors, gold: "#ffcc00" },
    });
    expect(colors.gold).toBe("#FFCC00");
    expect(colors.blue).toBe("#00529F");
  });
});

describe("linkek", () => {
  it("csak http(s) linket enged", () => {
    expect(isSafeHttpUrl("https://www.realmadrid.com")).toBe(true);
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:text/html,hello")).toBe(false);
    expect(isSafeHttpUrl("nem link")).toBe(false);
  });

  it("protokoll nélküli címhez hozzáteszi a https://-t", () => {
    expect(normalizeUrl("realmadrid.com")).toBe("https://realmadrid.com");
    expect(normalizeUrl("http://pelda.hu")).toBe("http://pelda.hu");
    expect(normalizeUrl("")).toBe("");
  });
});
