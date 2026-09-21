import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

/**
 * Akadálymentességi ellenőrzés (axe-core, WCAG 2.1 A és AA szabályok) –
 * minden fő oldalon, világos és sötét módban is.
 */
const PUBLIC_PAGES = ["/", "/hobbijaim", "/jatekaim", "/youtube", "/real-madrid", "/adatkezelesi-tajekoztato", "/cookie-tajekoztato", "/nincs-ilyen-oldal"];
const ADMIN_PAGES = [
  "/admin",
  "/admin/altalanos",
  "/admin/megjelenes",
  "/admin/kezdolap",
  "/admin/menu",
  "/admin/hobbijaim",
  "/admin/jatekaim",
  "/admin/youtube",
  "/admin/real-madrid",
  "/admin/jogi-oldalak",
  "/admin/tartalom-forditasa",
  "/admin/tartalom-forditasa?nyelv=is",
  "/admin/forditasok",
  "/admin/mediatar",
  "/admin/mentes",
  "/admin/fiok",
];

async function scan(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();
  return result.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
  }));
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`Akadálymentesség – ${theme === "light" ? "világos" : "sötét"} mód`, () => {
    test.use({ colorScheme: theme });

    test("nyilvános oldalak", async ({ page }) => {
      for (const path of PUBLIC_PAGES) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        expect(await scan(page), `${path} (${theme})`).toEqual([]);
      }
    });

    test("a kezdőlap leírás-ablaka nyitva", async ({ page }) => {
      await page.goto("/");
      await page.getByTestId("home-guide-button").click();
      await expect(page.getByTestId("home-guide-dialog")).toBeVisible();
      expect(await scan(page), `leírás ablak (${theme})`).toEqual([]);
    });

    test("mobil nézet (375 px, nyitott menüvel)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/hobbijaim");
      await page.getByRole("button", { name: "Menü megnyitása" }).click();
      await expect(page.getByRole("dialog", { name: "Menü" })).toBeVisible();
      expect(await scan(page), `mobil menü (${theme})`).toEqual([]);
    });

    test("Admin oldalak", async ({ page }) => {
      test.setTimeout(120_000);
      await loginAsAdmin(page);
      for (const path of ADMIN_PAGES) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        expect(await scan(page), `${path} (${theme})`).toEqual([]);
      }
    });
  });
}
