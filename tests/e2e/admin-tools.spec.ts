import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Fordítások, nyelvek, mentés", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("egy angol felirat átírása megjelenik az angol oldalon", async ({ page, context }) => {
    await page.goto("/admin/forditasok");
    await page.getByLabel("Keresés a szövegek között").fill("common.backToTop");
    const english = page.getByLabel("English – common.backToTop");
    const original = await english.inputValue();

    await english.fill("Up we go");
    await page.getByRole("button", { name: "Mentés", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Mentve!");

    await context.addCookies([{ name: "locale", value: "en", domain: new URL(page.url()).hostname, path: "/" }]);
    await page.goto("/youtube");
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect(page.getByRole("button", { name: "Up we go" })).toBeVisible();

    // Visszaállítás
    await page.goto("/admin/forditasok");
    await page.getByLabel("Keresés a szövegek között").fill("common.backToTop");
    await page.getByLabel("English – common.backToTop").fill(original);
    await page.getByRole("button", { name: "Mentés", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Mentve!");
  });

  test("a kötelező {helyőrző} nélküli fordítást nem engedi menteni", async ({ page }) => {
    await page.goto("/admin/forditasok");
    await page.getByLabel("Keresés a szövegek között").fill("youtube.itemCount");
    await page.getByLabel("English – youtube.itemCount").fill("videos");
    await expect(page.getByText("Hiányzik: {count}")).toBeVisible();
    await page.getByRole("button", { name: "Mentés", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("hiányzik: {count}");
  });

  test("új nyelv: felvétel, bekapcsolás, megjelenik a nyelvválasztóban, törlés", async ({ page }) => {
    await page.goto("/admin/forditasok");
    await page.getByRole("button", { name: "Új nyelv" }).click();
    await page.getByLabel("Nyelvkód").fill("fr");
    await page.getByLabel("A nyelv neve (az adott nyelven)").fill("Français");
    await page.getByLabel("Zászló (ország kódja)").fill("fr");
    await page.getByRole("button", { name: "Nyelv felvétele" }).click();
    await expect(page.getByRole("status")).toContainText("Új nyelv felvéve");

    const row = page.getByRole("listitem").filter({ hasText: "Français" });
    await expect(row.getByText("Kikapcsolva")).toBeVisible();
    await row.getByRole("checkbox", { name: "Bekapcsolva" }).check();
    await expect(page.getByRole("status")).toContainText("Français bekapcsolva");

    await page.goto("/");
    await expect(page.getByRole("button", { name: /Français/ }).first()).toBeAttached();

    await page.goto("/admin/forditasok");
    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Törlés: Français" }).click();
    await expect(page.getByRole("status")).toContainText("Nyelv törölve");
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Français/ })).toHaveCount(0);
  });

  test("mentés letöltése, majd visszaállítása", async ({ page }) => {
    await page.goto("/admin/mentes");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Mentés letöltése (.zip)" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^botondember-mentes-.+\.zip$/);
    const file = await download.path();

    // Változtatás a mentés után…
    await page.goto("/admin/kezdolap");
    const field = page.getByLabel("Fő üzenet (nagy, vastag, nagybetűs)");
    const original = await field.inputValue();
    await field.fill("Ez a szöveg a visszaállítás után eltűnik");
    await page.getByRole("button", { name: "Mentés", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Mentve!");

    // …majd visszaállítás.
    await page.goto("/admin/mentes");
    page.once("dialog", (dialog) => void dialog.accept());
    await page.locator('input[type="file"]').setInputFiles(file);
    await expect(page.getByRole("status").filter({ hasText: "Sikeres visszaállítás" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/automatikus-mentes-/).first()).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(original);
  });

  test("hibás mentésfájlt nem fogad el", async ({ page }) => {
    await page.goto("/admin/mentes");
    page.once("dialog", (dialog) => void dialog.accept());
    await page.locator('input[type="file"]').setInputFiles({ name: "nem-mentes.zip", mimeType: "application/zip", buffer: Buffer.from("ez nem zip") });
    await expect(page.getByRole("status")).toContainText("Ez nem egy érvényes mentésfájl");
  });
});
