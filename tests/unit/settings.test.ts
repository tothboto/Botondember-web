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

  it("a régi (guide nélküli) mentésnél is megjelenik az útbaigazító leírás", () => {
    // Így viselkedik egy korábban elmentett kezdőlap-beállítás, amiben még nincs „guide”.
    const home = parseSetting("home", { message: "Szia!", focal: "center", overlay: 40, subtitle: "" });
    expect(home.guide.enabled).toBe(true);
    expect(home.guide.button).toBe("Hol vagy? Mi ez?");
    expect(home.guide.text).toContain("Botondember");
    expect(home.guide.showPages).toBe(true);
    // Az előtérben álló alak alapból nincs beállítva.
    expect(home.figureMediaId).toBeNull();
    expect(home.figurePosition).toBe("center");
    expect(home.figureSize).toBe(78);
  });

  it("az előtérben álló alak beállításai ellenőrzöttek", () => {
    const ok = parseSetting("home", { ...settingDefaults.home, figureMediaId: 12, figurePosition: "right", figureSize: 60 });
    expect(ok.figureMediaId).toBe(12);
    expect(ok.figurePosition).toBe("right");
    expect(ok.figureSize).toBe(60);
    // Hibás érték (pl. túl nagy méret vagy ismeretlen hely) → minden visszaáll az alapértékre.
    expect(parseSetting("home", { ...settingDefaults.home, figureSize: 300 })).toEqual(settingDefaults.home);
    expect(parseSetting("home", { ...settingDefaults.home, figurePosition: "fent" })).toEqual(settingDefaults.home);
  });

  it("a rajz a felirathoz is igazítható (a felirat szélességének 0–100%-ánál)", () => {
    expect(settingDefaults.home.figureOffset).toBe(70);
    const text = parseSetting("home", { ...settingDefaults.home, figurePosition: "text", figureOffset: 71 });
    expect(text.figurePosition).toBe("text");
    expect(text.figureOffset).toBe(71);
    expect(parseSetting("home", { ...settingDefaults.home, figureOffset: 120 })).toEqual(settingDefaults.home);
    expect(parseSetting("home", { ...settingDefaults.home, figureOffset: 12.5 })).toEqual(settingDefaults.home);
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
