import { expect, test } from "@playwright/test";

test.describe("A nyilvános oldal alapjai", () => {
  test("a kezdőlap betölt", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Botondember első weboldala/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Botondember");
    await expect(page.locator("html")).toHaveAttribute("lang", "hu");
  });

  test("a menü minden aloldalra elvisz", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Főmenü" });
    const pages: [string, RegExp, RegExp][] = [
      ["Hobbijaim", /\/hobbijaim$/, /Hobbijaim/i],
      ["Játékaim", /\/jatekaim$/, /Kedvenc játékaim/i],
      ["YouTube", /\/youtube$/, /Kedvenceim YouTube-on/i],
      ["Real Madrid", /\/real-madrid$/, /Real Madrid/i],
    ];
    for (const [label, url, heading] of pages) {
      await nav.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
      await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    }
    await page.getByRole("link", { name: /ugrás a kezdőlapra/ }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("a lábléc a két jogi oldalra visz", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await footer.getByRole("link", { name: "Adatkezelési tájékoztató" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Adatkezelési tájékoztató/i);
    await expect(page.getByRole("navigation", { name: "Tartalomjegyzék" })).toBeVisible();
    await footer.getByRole("link", { name: "Cookie (süti) tájékoztató" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Cookie/i);
  });

  test("a nyelvváltás átírja a menüt, és a választás megmarad", async ({ page }) => {
    await page.goto("/hobbijaim");
    await page.getByRole("button", { name: /English/ }).first().click();
    const nav = page.getByRole("navigation", { name: "Main menu" });
    await expect(nav.getByRole("link", { name: "My hobbies" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveURL(/\/hobbijaim$/);

    await page.reload();
    await expect(page.getByRole("navigation", { name: "Main menu" })).toBeVisible();

    await page.getByRole("button", { name: /Magyar/ }).first().click();
    await expect(page.getByRole("navigation", { name: "Főmenü" }).getByRole("link", { name: "Hobbijaim" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "hu");
  });

  test("a téma váltása működik és megmarad", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sötét" }).first().click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("button", { name: "Világos" }).first().click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("a „Rendszer” téma a számítógép beállítását követi", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("a „Vissza a tetejére” gomb megjelenik és működik", async ({ page }) => {
    await page.goto("/youtube");
    const button = page.getByRole("button", { name: "Vissza a tetejére" });
    await expect(button).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect(button).toBeVisible();
    await button.click();
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  });

  test("a YouTube fülek szűrnek, és az URL-ben is megjelennek", async ({ page }) => {
    await page.goto("/youtube");
    await page.getByRole("link", { name: "Csatornák" }).click();
    await expect(page).toHaveURL(/\?tab=csatornak$/);
    await expect(page.getByRole("heading", { name: "Kedvenc csatornáim" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Zeneszámok" })).toHaveCount(0);
  });

  test("a keresők elől alapból rejtve van (robots, meta, üres oldaltérkép)", async ({ page, request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/\s*$/m);
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).not.toContain("<url>");
    await page.goto("/");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
  });

  test("nem létező címen barátságos 404 oldal", async ({ page }) => {
    const response = await page.goto("/nincs-ilyen-oldal");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("nem található");
    await page.getByRole("link", { name: "Vissza a kezdőlapra" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("Mobil nézet", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("a hamburger menü jobbról beúszik, és elvisz az aloldalra", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menü megnyitása" }).click();
    const drawer = page.getByRole("dialog", { name: "Menü" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "Játékaim" }).click();
    await expect(page).toHaveURL(/\/jatekaim$/);
    await expect(drawer).toBeHidden();
  });

  test("egyik oldalon sincs vízszintes görgetés (360 px)", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    for (const path of ["/", "/hobbijaim", "/jatekaim", "/youtube", "/real-madrid", "/adatkezelesi-tajekoztato", "/cookie-tajekoztato"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
  });
});
