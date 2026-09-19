import fs from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

/**
 * Nem igazi teszt: képernyőképek az Admin oldalairól (fejlesztéshez, átnézéshez).
 * Csak kérésre fut:  SCREENS=1 npx playwright test admin-screens
 * Oldalak: SCREENS_ROUTES=/admin,/admin/altalanos   Szélesség: SCREENS_WIDTH=1440
 */
test("admin képernyőképek @screens", async ({ page }) => {
  test.setTimeout(180_000);
  const width = Number(process.env.SCREENS_WIDTH ?? 1440);
  // Asztali méretben lépünk be (mobilon az „Itt a Főnök!” gomb a menüben van), utána váltunk.
  await loginAsAdmin(page);
  await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });
  const outDir = path.join(process.cwd(), "test-results", "admin-screens");
  fs.mkdirSync(outDir, { recursive: true });
  const routes = (process.env.SCREENS_ROUTES ?? "/admin").split(",");
  for (const theme of (process.env.SCREENS_THEMES ?? "light").split(",")) {
    await page.evaluate((mode) => window.localStorage.setItem("theme", mode), theme);
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const name = route.replace(/^\//, "").replace(/[/?=&]/g, "_") || "root";
      await page.screenshot({ path: path.join(outDir, `${name}-${width}-${theme}.png`), fullPage: true });
    }
  }
});
