import { expect, test, type Locator, type Page } from "@playwright/test";
import sharp from "sharp";
import { loginAsAdmin } from "./helpers";

/** Kattintás a „Mentés” gombra (az oldalon vagy egy űrlapon belül), és megvárja a „Mentve!” visszajelzést. */
async function save(page: Page, scope: Page | Locator = page) {
  await scope.getByRole("button", { name: "Mentés", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Mentve!");
}

test.describe("Admin szerkesztők", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("az Irányítópulton az „Első lépések” lista mutatja a teendőket", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Első lépések" })).toBeVisible();
    const passwordStep = page.getByRole("link", { name: /Hátravan: Változtasd meg a kezdő jelszót/ });
    await expect(passwordStep).toBeVisible();
    await passwordStep.click();
    await expect(page).toHaveURL(/\/admin\/fiok$/);
  });

  test("a kezdőlap fő üzenetének átírása megjelenik a kezdőlapon", async ({ page }) => {
    await page.goto("/admin/kezdolap");
    const field = page.getByLabel("Fő üzenet (nagy, vastag, nagybetűs)");
    const original = await field.inputValue();
    const message = `Botondember tesztüzenete ${Date.now()}`;

    await field.fill(message);
    await expect(page.getByText("Mentetlen változások")).toBeVisible();
    await save(page);

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(message);

    // Visszaállítás, hogy a többi teszt az eredeti szöveget lássa.
    await page.goto("/admin/kezdolap");
    await page.getByLabel("Fő üzenet (nagy, vastag, nagybetűs)").fill(original);
    await save(page);
  });

  test("az előtérben álló alak feltöltése megjelenik a kezdőlapon", async ({ page }) => {
    // Egy álló (30×80-as), egyszínű kép – nagyjából olyan arányú, mint egy rajzolt alak.
    const png = await sharp({ create: { width: 30, height: 80, channels: 4, background: { r: 200, g: 40, b: 40, alpha: 1 } } })
      .png()
      .toBuffer();
    await page.goto("/admin/kezdolap");
    const field = page.locator("fieldset").filter({ has: page.locator("#home-figure-file") });
    await page.locator("#home-figure-file").setInputFiles({ name: "alak.png", mimeType: "image/png", buffer: png });
    await expect(page.getByRole("status")).toContainText("Kép feltöltve");
    await page.locator("#home-figure-alt").fill("Teszt rajz Botondemberről");
    await save(page);

    await page.goto("/");
    await expect(page.getByAltText("Teszt rajz Botondemberről")).toBeVisible();

    // A felirathoz igazítva: a rajz bal széle a „vagyok” szó „o” betűjénél (71%).
    await page.goto("/admin/kezdolap");
    await page.getByText("A felirathoz igazítva").click();
    const offset = page.getByLabel(/A rajz bal széle a felirat/);
    await expect(offset).toHaveValue("70");
    await offset.focus();
    await page.keyboard.press("ArrowRight");
    await expect(offset).toHaveValue("71");
    await save(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const gap = await page.evaluate(() => {
      const line = document.querySelectorAll("h1 span")[1].firstChild as Text;
      const at = line.textContent!.toLowerCase().lastIndexOf("vagyok") + 4;
      const range = document.createRange();
      range.setStart(line, at);
      range.setEnd(line, at + 1);
      const figure = document.querySelector('img[alt="Teszt rajz Botondemberről"]')!;
      return figure.getBoundingClientRect().left - range.getBoundingClientRect().left;
    });
    expect(Math.abs(gap)).toBeLessThan(15);

    // Takarítás: az alak eltávolítása, a hely vissza középre.
    await page.goto("/admin/kezdolap");
    await page.getByText("Középen", { exact: true }).click();
    await field.getByRole("button", { name: "Eltávolítás" }).click();
    await save(page);
    await page.goto("/");
    await expect(page.getByAltText("Teszt rajz Botondemberről")).toHaveCount(0);
  });

  test("üres fő üzenet nem menthető – magyar hibaüzenet jelenik meg", async ({ page }) => {
    await page.goto("/admin/kezdolap");
    await page.getByLabel("Fő üzenet (nagy, vastag, nagybetűs)").fill("   ");
    await page.getByRole("button", { name: "Mentés", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("A fő üzenet nem lehet üres!");
  });

  test("mentetlen változásnál figyelmeztet, ha elnavigálnék", async ({ page }) => {
    await page.goto("/admin/kezdolap");
    await page.getByLabel("Alcím (nem kötelező)").fill("Még nincs elmentve");
    let message = "";
    page.once("dialog", (dialog) => {
      message = dialog.message();
      void dialog.dismiss();
    });
    await page.getByRole("navigation", { name: "Admin menü" }).getByRole("link", { name: "Hobbijaim" }).click();
    await expect.poll(() => message).toContain("Mentetlen változtatásaid vannak");
    await expect(page).toHaveURL(/\/admin\/kezdolap$/);
  });

  test("új hobbi felvétele megjelenik a Hobbijaim oldalon, majd törölhető", async ({ page }) => {
    const title = `Teszthobbi ${Date.now()}`;
    await page.goto("/admin/hobbijaim");
    await page.getByRole("button", { name: "Új hobbi" }).click();
    const form = page.locator("form").filter({ has: page.getByRole("heading", { name: "Új hobbi" }) });
    await form.getByLabel("A hobbi neve").fill(title);
    await form.getByLabel("Rövid leírás", { exact: true }).fill("Ezt a tesztet a Playwright írta.");
    await save(page, form);
    await expect(page.getByText(title)).toBeVisible();

    await page.goto("/hobbijaim");
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    await page.goto("/admin/hobbijaim");
    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: `Törlés: ${title}` }).click();
    await expect(page.getByRole("status")).toContainText("Törölve");
    await page.goto("/hobbijaim");
    await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
  });

  test("új aloldal: létrehozás, megjelenik a menüben, majd törlés", async ({ page }) => {
    const stamp = Date.now().toString(36);
    const title = `Tesztoldal ${stamp}`;
    await page.goto("/admin/menu");
    await page.getByRole("button", { name: "Új aloldal" }).click();
    await page.getByLabel("Az oldal címe").fill(title);
    await expect(page.getByLabel("URL-cím (a böngésző címsorában)")).toHaveValue(`tesztoldal-${stamp}`);
    await page.getByRole("button", { name: "Aloldal létrehozása" }).click();
    await expect(page).toHaveURL(/\/admin\/oldal\/\d+$/);

    await page.getByLabel("Fő szöveg", { exact: true }).fill("## Szia!\n\nEz egy **tesztoldal**.");
    await save(page);

    await page.goto("/");
    await page.getByRole("navigation", { name: "Főmenü" }).getByRole("link", { name: title }).click();
    await expect(page).toHaveURL(new RegExp(`/tesztoldal-${stamp}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByRole("heading", { name: "Szia!" })).toBeVisible();

    await page.goto("/admin/menu");
    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: `Törlés: ${title}` }).click();
    await expect(page.getByRole("status")).toContainText("Aloldal törölve");
    const response = await page.goto(`/tesztoldal-${stamp}`);
    expect(response?.status()).toBe(404);
  });

  test("a márkaszín módosítása az egész oldalon érvényes, és visszaállítható", async ({ page }) => {
    const readBlue = () =>
      page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--rm-blue").trim().toUpperCase());

    await page.goto("/admin/megjelenes");
    await page.getByLabel("Királykék – színkód").fill("#123456");
    await save(page);
    await page.goto("/");
    expect(await readBlue()).toBe("#123456");

    await page.goto("/admin/megjelenes");
    await page.getByRole("button", { name: "Összes alaphelyzetbe" }).click();
    await save(page);
    await page.goto("/");
    expect(await readBlue()).toBe("#00529F");
  });
});
