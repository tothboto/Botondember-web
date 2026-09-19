import { expect, type Page } from "@playwright/test";

/** A teszt-admin adatai (a playwright.config.ts generálja minden futtatáskor). */
export const ADMIN = {
  username: process.env.E2E_ADMIN_USERNAME ?? "teszt-admin",
  password: process.env.E2E_ADMIN_PASSWORD ?? "",
};

export async function openLoginDialog(page: Page) {
  await page.getByRole("button", { name: /Itt a Főnök!/ }).first().click();
  await expect(page.getByTestId("login-dialog")).toBeVisible();
}

/** Belépés az „Itt a Főnök!” ablakon át. */
export async function login(page: Page, username = ADMIN.username, password = ADMIN.password) {
  await page.goto("/");
  await openLoginDialog(page);
  const dialog = page.getByTestId("login-dialog");
  await dialog.getByLabel("Felhasználónév").fill(username);
  await dialog.getByLabel("Jelszó").fill(password);
  await dialog.getByRole("button", { name: "Belépés", exact: true }).click();
}

/** Belépés és megvárja, hogy az Admin betöltődjön. */
export async function loginAsAdmin(page: Page) {
  await login(page);
  await expect(page).toHaveURL(/\/admin$/);
}
