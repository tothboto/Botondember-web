/**
 * Képernyőképek az Admin oldalairól a homokozóból (npm run dev:sandbox).
 * Belép a teszt-adminnal (data/sandbox/credentials.json), és lefotózza az oldalakat.
 * Eredmény: test-results/admin-screens/<oldal>-<szélesség>-<téma>.png
 *
 *   npx tsx scripts/admin-shots.ts --routes=/admin,/admin/hobbijaim --widths=1440,375 --themes=light,dark
 *
 * A --click="Gomb neve|Másik gomb" a fotó előtt rákattint a megadott nevű gombokra
 * (pl. egy szerkesztő űrlap kinyitásához).
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const arg = (name: string, fallback: string) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;

const base = arg("base", "http://localhost:3000");
const routes = arg("routes", "/admin").split(",");
const widths = arg("widths", "1440").split(",").map(Number);
const themes = arg("themes", "light").split(",");
const clicks = arg("click", "").split("|").filter(Boolean);
const outDir = path.join(process.cwd(), "test-results", "admin-screens");

async function main() {
  const credentials = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "sandbox", "credentials.json"), "utf8"),
  ) as { username: string; password: string };
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ channel: process.platform === "win32" ? "msedge" : undefined });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Belépés az „Itt a Főnök!” ablakon át.
  await page.goto(base + "/");
  await page.getByRole("button", { name: /Itt a Főnök!/ }).first().click();
  const dialog = page.getByTestId("login-dialog");
  await dialog.getByLabel("Felhasználónév").fill(credentials.username);
  await dialog.getByLabel("Jelszó").fill(credentials.password);
  await dialog.getByRole("button", { name: "Belépés", exact: true }).click();
  await page.waitForURL(/\/admin$/);

  for (const theme of themes) {
    await page.evaluate((mode) => window.localStorage.setItem("theme", mode), theme);
    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });
      for (const route of routes) {
        await page.goto(base + route, { waitUntil: "networkidle" });
        for (const label of clicks) await page.getByRole("button", { name: label }).first().click();
        // A lustán betöltődő képekhez végiggörget az oldalon.
        await page.evaluate(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
            window.scrollTo({ top: y, behavior: "instant" });
            await new Promise((resolve) => setTimeout(resolve, 60));
          }
          window.scrollTo({ top: 0, behavior: "instant" });
        });
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        const name = (route.replace(/^\//, "").replace(/[/?=&]/g, "_") || "root") + (clicks.length ? "-open" : "");
        const file = path.join(outDir, `${name}-${width}-${theme}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(overflow > 1 ? `⚠️  ${overflow}px túllógás:` : "✔", path.relative(process.cwd(), file));
      }
    }
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
