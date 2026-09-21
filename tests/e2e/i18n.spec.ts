import { expect, test, type Page } from "@playwright/test";

/**
 * Fordítás-ellenőrzés: horvát nyelven minden oldalon végignézi a szövegeket és a
 * rejtett feliratokat (aria-label, title, alt, placeholder). A horvát ábécében nincs
 * á, é, í, ó, ö, ő, ú, ü, ű – ha ilyen betű mégis előfordul olyan szövegben, ami
 * nincs más nyelvűnek (pl. lang="hu") jelölve, akkor az lefordítatlan maradt.
 */
const PAGES = ["/", "/hobbijaim", "/jatekaim", "/youtube", "/real-madrid", "/adatkezelesi-tajekoztato", "/cookie-tajekoztato", "/nincs-ilyen-oldal"];
const HUNGARIAN = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/;

async function untranslated(page: Page): Promise<string[]> {
  return page.evaluate((pattern) => {
    const hungarian = new RegExp(pattern);
    const pageLang = document.documentElement.lang;
    // Tulajdonnevek, amelyek szándékosan maradnak eredetiben (az oldal neve, a nyelvek neve).
    const brand = document.querySelector("[data-brand-link]")?.textContent?.trim() ?? "";
    const names = [brand, "Botondember", ...Array.from(document.querySelectorAll("[lang]"))
      .filter((el) => el !== document.documentElement && el.closest("ul")?.getAttribute("aria-label"))
      .map((el) => el.textContent?.trim() ?? "")].filter(Boolean);
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
  }, HUNGARIAN.source);
}

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
