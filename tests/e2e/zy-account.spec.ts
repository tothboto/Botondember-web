import { expect, test, type Page } from "@playwright/test";
import { ADMIN, login, loginAsAdmin } from "./helpers";

// A jelszócsere a többi tesztet is érintené, ezért a végén visszaállítjuk (és a fájl a sor végén fut).
async function changePassword(page: Page, current: string, next: string) {
  await page.goto("/admin/fiok");
  await page.getByLabel("Jelenlegi jelszó", { exact: true }).fill(current);
  await page.getByLabel("Új jelszó", { exact: true }).fill(next);
  await page.getByLabel("Új jelszó még egyszer").fill(next);
  await page.getByRole("button", { name: "Jelszó megváltoztatása" }).click();
}

test.describe("Fiók", () => {
  test("hibás jelenlegi jelszóval nem változtat, a helyessel igen – a régi jelszó utána nem jó", async ({ page }) => {
    const newPassword = `Uj-Teszt-Jelszo-${Date.now()}`;
    await loginAsAdmin(page);

    await changePassword(page, "ez-nem-a-jelszo", newPassword);
    await expect(page.getByText("A jelenlegi jelszó nem jó.").first()).toBeVisible();

    await changePassword(page, ADMIN.password, newPassword);
    await expect(page.getByRole("status")).toContainText("Mentve!");
    // Ez a böngésző belépve marad.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);

    // Kilépés után a régi jelszó már nem jó, az új igen.
    await page.getByRole("button", { name: /Kilépés/ }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: /Itt a Főnök!/ }).first()).toBeVisible();
    await login(page, ADMIN.username, ADMIN.password);
    await expect(page.getByTestId("login-dialog").getByRole("alert")).toHaveText("Hibás felhasználónév vagy jelszó.");
    await login(page, ADMIN.username, newPassword);
    await expect(page).toHaveURL(/\/admin$/);

    // Visszaállítás az eredetire.
    await changePassword(page, newPassword, ADMIN.password);
    await expect(page.getByRole("status")).toContainText("Mentve!");
  });

  test("a két új jelszó eltérése és a túl rövid jelszó hibát ad", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/fiok");
    await page.getByLabel("Jelenlegi jelszó", { exact: true }).fill(ADMIN.password);
    await page.getByLabel("Új jelszó", { exact: true }).fill("rovid");
    await page.getByLabel("Új jelszó még egyszer").fill("rovid");
    await page.getByRole("button", { name: "Jelszó megváltoztatása" }).click();
    await expect(page.getByRole("status")).toContainText("legalább 8 karakter");

    await page.getByLabel("Új jelszó", { exact: true }).fill("Hosszu-Jelszo-123");
    await page.getByLabel("Új jelszó még egyszer").fill("Masik-Jelszo-123");
    await page.getByRole("button", { name: "Jelszó megváltoztatása" }).click();
    await expect(page.getByRole("status")).toContainText("A két új jelszó nem egyezik.");
  });

  test("a jelszócsere a többi eszközön kilépteti az admint", async ({ browser }) => {
    const first = await browser.newContext();
    const second = await browser.newContext();
    const pageA = await first.newPage();
    const pageB = await second.newPage();
    await loginAsAdmin(pageA);
    await loginAsAdmin(pageB);

    await pageA.goto("/admin/fiok");
    await pageA.getByRole("button", { name: "Kilépés minden más eszközön" }).click();
    await expect(pageA.getByRole("status")).toContainText(/minden más eszközön kiléptél/i);

    await pageB.goto("/admin");
    await expect(pageB.getByTestId("login-dialog")).toBeVisible();
    await pageA.goto("/admin");
    await expect(pageA).toHaveURL(/\/admin$/);
    await first.close();
    await second.close();
  });
});
