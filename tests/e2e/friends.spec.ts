import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

/** Barátok: a lista, a barátok saját aloldala és a felvételük az Adminban. */
test.describe("Barátok", () => {
  test("a menüből elérhető, és a névről a barát saját oldalára visz", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Főmenü" }).getByRole("link", { name: "Barátok" }).click();
    await expect(page).toHaveURL(/\/baratok$/);
    await expect(page.getByRole("heading", { level: 1, name: "Barátaim" })).toBeVisible();
    await expect(page.getByText("2 barát")).toBeVisible();

    await page.getByRole("link", { name: /Példa Barát/ }).first().click();
    await expect(page).toHaveURL(/\/baratok\/pelda-barat$/);
    await expect(page.getByRole("heading", { level: 1, name: "Példa Barát" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Bemutatás" })).toBeVisible();

    await page.getByRole("link", { name: "Összes barát" }).click();
    await expect(page).toHaveURL(/\/baratok$/);
  });

  test("nem létező barát címén 404 jelenik meg", async ({ page }) => {
    const response = await page.goto("/baratok/nincs-ilyen-barat");
    expect(response?.status()).toBe(404);
  });

  test("az Adminban felvett barát saját aloldalt és profilgombot kap", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/baratok");
    await page.getByRole("button", { name: "Új barát" }).click();

    const form = page.locator("form").filter({ has: page.getByLabel("A barát neve") });
    await form.getByLabel("A barát neve").fill("Teszt Peti");
    await form.getByLabel("Bemutatás (a barát saját oldalán jelenik meg)", { exact: true }).fill("Együtt járunk focira.");
    await form.getByRole("button", { name: "Új link" }).click();
    await form.getByLabel("Hol?").selectOption("youtube");
    await form.getByLabel("A link címe").fill("https://www.youtube.com/@pelda");
    await expect(form.getByText("/baratok/teszt-peti")).toBeVisible();
    await form.getByRole("button", { name: "Mentés", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Mentve");

    await page.goto("/baratok/teszt-peti");
    await expect(page.getByRole("heading", { level: 1, name: "Teszt Peti" })).toBeVisible();
    await expect(page.getByText("Együtt járunk focira.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Teszt Peti.*YouTube/ })).toHaveAttribute(
      "href",
      "https://www.youtube.com/@pelda",
    );

    // Takarítás: a barát törlése.
    await page.goto("/admin/baratok");
    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Törlés: Teszt Peti" }).click();
    await expect(page.getByRole("status")).toContainText("Törölve");
    const response = await page.goto("/baratok/teszt-peti");
    expect(response?.status()).toBe(404);
  });
});
