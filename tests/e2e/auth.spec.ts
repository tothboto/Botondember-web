import { expect, test } from "@playwright/test";
import { ADMIN, login, loginAsAdmin } from "./helpers";

test.describe("Belépés és az Admin védelme", () => {
  test("belépés nélkül az /admin a kezdőlapra küld, megnyitott belépő ablakkal", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("login-dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Belépés" })).toBeVisible();
  });

  test("az admin aloldalai sem érhetők el belépés nélkül", async ({ page }) => {
    for (const path of ["/admin/altalanos", "/admin/kezdolap", "/admin/menu", "/admin/oldal/1", "/admin/mediatar"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/\?login=1$|\/$/);
      await expect(page.getByTestId("login-dialog")).toBeVisible();
    }
  });

  test("az Admin műveletei belépés nélkül el vannak utasítva (szerveroldali ellenőrzés)", async ({ request }) => {
    const upload = await request.post("/api/admin/media", { multipart: { file: { name: "a.png", mimeType: "image/png", buffer: Buffer.from("x") } } });
    expect(upload.status()).toBe(401);
    const favicon = await request.post("/api/admin/favicon", { multipart: { file: { name: "a.png", mimeType: "image/png", buffer: Buffer.from("x") } } });
    expect(favicon.status()).toBe(401);
  });

  test("hibás belépés elutasítva, általános hibaüzenettel", async ({ page }) => {
    await login(page, ADMIN.username, "ez-biztosan-rossz-jelszo");
    await expect(page.getByTestId("login-dialog").getByRole("alert")).toHaveText("Hibás felhasználónév vagy jelszó.");
    await expect(page).not.toHaveURL(/\/admin/);

    await login(page, "nincs-ilyen-felhasznalo", "ez-biztosan-rossz-jelszo");
    await expect(page.getByTestId("login-dialog").getByRole("alert")).toHaveText("Hibás felhasználónév vagy jelszó.");
  });

  test("az Esc bezárja a belépő ablakot", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Itt a Főnök!/ }).first().click();
    await expect(page.getByTestId("login-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("login-dialog")).toBeHidden();
  });

  test("sikeres belépés után az Adminba kerül, a fejlécben Admin és Kilépés látszik", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(ADMIN.username);

    await page.goto("/");
    const header = page.locator("header").first();
    await expect(header.getByRole("link", { name: "Admin" }).first()).toBeVisible();
    await expect(header.getByRole("button", { name: "Kilépés" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Itt a Főnök!/ })).toHaveCount(0);
  });

  test("a kilépés után az Admin újra védett", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("button", { name: /Kilépés/ }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/admin");
    await expect(page.getByTestId("login-dialog")).toBeVisible();
  });
});
