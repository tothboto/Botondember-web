import { expect, test, type Page } from "@playwright/test";

/**
 * Fordítás-ellenőrzés: MINDEN nyelven végignézi az összes oldalt – a látható
 * szövegeket és a rejtett feliratokat (aria-label, title, alt, placeholder) is.
 *
 * Hogyan derül ki, hogy valami magyarul maradt? Minden nyelvhez felsoroljuk azokat
 * a magyar ékezetes betűket, amelyek abban a nyelvben nem fordulhatnak elő (pl. a
 * horvátban egyik sem, a németben viszont az ä/ö/ü igen, ezért azokat ott nem
 * nézzük). Ha ilyen betű mégis előkerül olyan szövegben, amit a kód nem jelölt meg
 * más nyelvűnek (pl. `lang="hu"`), akkor az a szöveg lefordítatlan maradt.
 */
const PAGES = ["/", "/hobbijaim", "/jatekaim", "/youtube", "/real-madrid", "/iskolaim", "/iskolaim/pelda-iskola", "/eszkozeim", "/baratok", "/baratok/pelda-barat", "/adatkezelesi-tajekoztato", "/cookie-tajekoztato", "/nincs-ilyen-oldal"];

/** Nyelv → a benne elő nem forduló magyar ékezetes betűk. */
const LANGUAGES = [
  { code: "en", name: "Angol", letters: "áéíóöőúüű" },
  { code: "es", name: "Spanyol", letters: "öőű" },
  { code: "de", name: "Német", letters: "áéíóőúű" },
  { code: "is", name: "Izlandi", letters: "őűü" },
  { code: "hr", name: "Horvát", letters: "áéíóöőúüű" },
] as const;

const pattern = (letters: string) => `[${letters}${letters.toUpperCase()}]`;
const HUNGARIAN = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/;

async function untranslated(page: Page, source: string = HUNGARIAN.source): Promise<string[]> {
  return page.evaluate((pattern) => {
    const hungarian = new RegExp(pattern);
    const pageLang = document.documentElement.lang;
    // Ami szándékosan marad más nyelven: az oldal neve, a nyelvválasztó nyelvnevei, és minden
    // olyan rövid szöveg, amit a kód más nyelvűnek jelöl (pl. a még le nem fordított saját
    // szövegek `lang="hu"` jelöléssel). Ezek a böngészőfül címében is megjelenhetnek.
    const brand = document.querySelector("[data-brand-link]")?.textContent?.trim() ?? "";
    const marked = Array.from(document.querySelectorAll("[lang]"))
      .filter((el) => el !== document.documentElement && (el.getAttribute("lang") ?? pageLang) !== pageLang)
      .map((el) => el.textContent?.replace(/\s+/g, " ").trim() ?? "")
      .filter((text) => text.length > 0 && text.length <= 120);
    const names = [brand, "Botondember", ...marked].filter(Boolean);
    const clean = (text: string) => names.reduce((acc, name) => acc.split(name).join(""), text);
    // Egy elem a saját (legközelebbi) lang jelölése szerint melyik nyelvű.
    const langOf = (el: Element) => el.closest("[lang]")?.getAttribute("lang") ?? pageLang;

    const found = new Set<string>();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const el = node.parentElement;
      const text = node.textContent?.replace(/\s+/g, " ").trim() ?? "";
      if (!el || !text || el.closest("script, style, noscript")) continue;
      if (langOf(el) !== pageLang) continue;
      if (hungarian.test(clean(text))) found.add(`szöveg: „${text.slice(0, 90)}”`);
    }
    for (const el of Array.from(document.body.querySelectorAll("[aria-label], [title], [alt], [placeholder]"))) {
      if (langOf(el) !== pageLang) continue;
      for (const attr of ["aria-label", "title", "alt", "placeholder"]) {
        const value = el.getAttribute(attr);
        if (value && hungarian.test(clean(value))) found.add(`${attr}: „${value.slice(0, 90)}”`);
      }
    }
    const title = clean(document.title);
    if (hungarian.test(title)) found.add(`böngészőfül címe: „${document.title}”`);
    return [...found];
  }, source);
}

/** Minden nyelven, minden oldalon: maradt-e magyar szöveg? */
test.describe("Fordítás-ellenőrzés minden nyelven", () => {
  for (const language of LANGUAGES) {
    test(`${language.name}: egyik oldalon sem maradt lefordítatlan (magyar) felirat`, async ({ page, context, baseURL }) => {
      await context.addCookies([
        { name: "locale", value: language.code, domain: new URL(baseURL ?? "http://localhost").hostname, path: "/" },
      ]);
      const problems: string[] = [];
      for (const path of PAGES) {
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute("lang", language.code);
        for (const item of await untranslated(page, pattern(language.letters))) problems.push(`${path} → ${item}`);
      }
      expect(problems, problems.join("\n")).toEqual([]);
    });
  }
});

test.describe("Horvát fordítás", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "hr", domain: new URL(baseURL ?? "http://localhost").hostname, path: "/" }]);
  });

  test("a menü, a fejléc és a lábléc horvátul jelenik meg", async ({ page }) => {
    await page.goto("/hobbijaim");
    await expect(page.locator("html")).toHaveAttribute("lang", "hr");
    const nav = page.getByRole("navigation", { name: "Glavni izbornik" });
    for (const label of ["Moji hobiji", "Moje igre", "YouTube", "Real Madrid"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Moji hobiji");
    await expect(page).toHaveTitle(/^Moji hobiji · /);
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: "Obavijest o privatnosti" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Obavijest o kolačićima" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Šef je ovdje!" }).first()).toBeVisible();
  });

  test("egyik oldalon sem maradt lefordítatlan (magyar) felirat", async ({ page }) => {
    const problems: string[] = [];
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", "hr");
      for (const item of await untranslated(page)) problems.push(`${path} → ${item}`);
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });

  test("mobilon a menü is horvát, és vissza lehet váltani magyarra", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.getByRole("button", { name: "Otvori izbornik" }).click();
    const drawer = page.getByRole("dialog", { name: "Izbornik" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Moje igre" })).toBeVisible();
    expect(await untranslated(page)).toEqual([]);
    await drawer.getByRole("button", { name: /Magyar/ }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "hu");
  });
});
