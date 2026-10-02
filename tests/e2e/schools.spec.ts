import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

/** Iskoláim: a lista, az iskolák saját aloldala és a felvételük az Adminban. */
test.describe("Iskoláim", () => {
  test("a menüből elérhető, és a kártyáról az iskola saját oldalára visz", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Főmenü" }).getByRole("link", { name: "Iskoláim" }).click();
    await expect(page).toHaveURL(/\/iskolaim$/);
    await expect(page.getByRole("heading", { level: 1, name: "Iskoláim" })).toBeVisible();

    await page.getByRole("link", { name: /Példa iskola/ }).first().click();
    await expect(page).toHaveURL(/\/iskolaim\/pelda-iskola$/);
    await expect(page.getByRole("heading", { level: 1, name: "Példa iskola" })).toBeVisible();
    await expect(page.getByText("2019–2027")).toBeVisible();

    await page.getByRole("link", { name: "Vissza az iskoláimhoz" }).click();
    await expect(page).toHaveURL(/\/iskolaim$/);
  });

  test("nem létező iskola címén 404 jelenik meg", async ({ page }) => {
    const response = await page.goto("/iskolaim/nincs-ilyen-iskola");
    expect(response?.status()).toBe(404);
  });

  test("az Adminban felvett iskola saját aloldalt kap", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/iskolaim");
    await page.getByRole("button", { name: "Új iskola" }).click();

    const form = page.locator("form").filter({ has: page.getByLabel("Az iskola neve") });
    await form.getByLabel("Az iskola neve").fill("Teszt Gimnázium");
    await form.getByLabel("Milyen iskola").fill("gimnázium");
    await form.getByLabel("Város").fill("Tesztváros");
    await form.getByLabel("Mettől meddig jártam ide").fill("2027–2031");
    await form.getByLabel("Rövid bemutatás").fill("Ide fogok járni középiskolába.");
    await expect(form.getByText("/iskolaim/teszt-gimnazium")).toBeVisible();
    await form.getByRole("button", { name: "Mentés", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Mentve");

    await page.goto("/iskolaim/teszt-gimnazium");
    await expect(page.getByRole("heading", { level: 1, name: "Teszt Gimnázium" })).toBeVisible();
    await expect(page.getByText("Ide fogok járni középiskolába.")).toBeVisible();
    await expect(page.getByText("Tesztváros")).toBeVisible();

    // Takarítás: az iskola törlése.
    await page.goto("/admin/iskolaim");
    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Törlés: Teszt Gimnázium" }).click();
    await expect(page.getByRole("status")).toContainText("Törölve");
    const response = await page.goto("/iskolaim/teszt-gimnazium");
    expect(response?.status()).toBe(404);
  });
});
