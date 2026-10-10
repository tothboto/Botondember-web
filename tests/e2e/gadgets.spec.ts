import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

/** Kedvenc eszközeim: a csoportosított lista és az eszközök felvétele az Adminban. */
test.describe("Kedvenc eszközeim", () => {
  test("a menüből elérhető, és csoportokba rendezve mutatja az eszközöket", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Főmenü" }).getByRole("link", { name: "Kedvenc eszközeim" }).click();
    await expect(page).toHaveURL(/\/eszkozeim$/);
    await expect(page.getByRole("heading", { level: 1, name: "Kedvenc eszközeim" })).toBeVisible();

    await expect(page.getByRole("heading", { level: 2, name: "Számítógépek" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Okosórák" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Egyéb kincseim" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Példa laptop" })).toBeVisible();
  });

  test("az Adminban felvett eszköz a saját csoportjában jelenik meg", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/eszkozeim");
    await page.getByRole("button", { name: "Új eszköz" }).click();

    const form = page.locator("form").filter({ has: page.getByLabel("Az eszköz neve") });
    await form.getByLabel("Az eszköz neve").fill("Teszt Tablet 10");
    await form.getByLabel("Csoport").fill("Tabletek");
    await form.getByLabel("Gyártó / márka (nem kötelező)").fill("Teszt Kft.");
    await form.getByLabel("Mióta van meg (nem kötelező)").fill("2026 óta");
    await form.getByLabel("Miért szereted? Mire használod?").fill("Ezen rajzolok a szünetben.");
    await form.getByRole("button", { name: "Mentés", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Mentve");

    await page.goto("/eszkozeim");
    await expect(page.getByRole("heading", { level: 2, name: "Tabletek" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Teszt Tablet 10" })).toBeVisible();
    await expect(page.getByText("Teszt Kft.", { exact: true })).toBeVisible();
    await expect(page.getByText("2026 óta", { exact: true })).toBeVisible();
    await expect(page.getByText("Ezen rajzolok a szünetben.")).toBeVisible();

    // Takarítás: az eszköz törlése.
    await page.goto("/admin/eszkozeim");
    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Törlés: Teszt Tablet 10" }).click();
    await expect(page.getByRole("status")).toContainText("Törölve");

    await page.goto("/eszkozeim");
    await expect(page.getByRole("heading", { level: 2, name: "Tabletek" })).toHaveCount(0);
  });
});
