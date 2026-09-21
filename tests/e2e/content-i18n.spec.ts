import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

/** Saját szövegek fordítása (Admin) → a látogató a saját nyelvén látja. */
test.describe("Saját szövegek fordítása", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("egy hobbi nevének angol fordítása megjelenik az angol oldalon", async ({ page, context }) => {
    await page.goto("/admin/tartalom-forditasa?nyelv=en");
    await expect(page.getByRole("heading", { level: 1, name: "Saját szövegek fordítása" })).toBeVisible();
    const languages = page.getByRole("navigation", { name: "Melyik nyelvre fordítasz?" });
    await expect(languages.getByRole("link", { name: /English/ })).toHaveAttribute("aria-current", "page");

    const card = page.getByRole("article", { name: "Foci – név" });
    await expect(card.getByText("Hiányzik", { exact: true })).toBeVisible();
    await card.getByLabel("English (Foci – név)").fill("Football");
    await expect(page.getByText("1 mentetlen fordítás")).toBeVisible();
    await page.getByRole("button", { name: "Mentés", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Mentve!");
    await expect(card.getByText("Kész", { exact: true })).toBeVisible();

    await context.addCookies([{ name: "locale", value: "en", domain: new URL(page.url()).hostname, path: "/" }]);
    await page.goto("/hobbijaim");
    await expect(page.getByRole("heading", { level: 2, name: "Football" })).toHaveAttribute("lang", "en");
    // Ami nincs lefordítva, magyarul marad – magyarnak jelölve (a képernyőolvasónak).
    await expect(page.getByRole("heading", { level: 2, name: "Rajzolás" })).toHaveAttribute("lang", "hu");
  });

  test("fordítás kérése és visszavonása, „Maradjon magyarul” és vissza", async ({ page }) => {
    await page.goto("/admin/tartalom-forditasa?nyelv=de");
    const card = page.getByRole("article", { name: "Rajzolás – név" });

    await card.getByRole("button", { name: "Fordítás kérése: Rajzolás – név" }).click();
    await expect(page.getByRole("status")).toContainText("Kérés rögzítve");
    await expect(card.getByText("Fordításra vár", { exact: true })).toBeVisible();
    await expect(page.getByText(/szöveg vár fordításra ezen a nyelven/)).toBeVisible();

    await card.getByRole("button", { name: "Kérés visszavonása: Rajzolás – név" }).click();
    await expect(card.getByText("Hiányzik", { exact: true })).toBeVisible();

    await card.getByRole("button", { name: "Maradjon magyarul: Rajzolás – név" }).click();
    await expect(card.getByText("Magyarul marad", { exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Mégis lefordítom: Rajzolás – név" }).click();
    await expect(card.getByText("Hiányzik", { exact: true })).toBeVisible();
  });

  test("a szűrők: állapot és keresés", async ({ page }) => {
    await page.goto("/admin/tartalom-forditasa?nyelv=es");
    await page.getByLabel("Keresés a szövegek között").fill("Programozás");
    await expect(page.getByRole("article", { name: "Programozás – név" })).toBeVisible();
    await expect(page.getByRole("article", { name: "Foci – név" })).toHaveCount(0);

    await page.getByLabel("Keresés a szövegek között").fill("");
    await page.getByRole("button", { name: /^Kész/ }).click();
    await expect(page.getByText("Nincs ilyen szöveg.")).toBeVisible();
  });
});
