/**
 * `npm run screenshots` – teljes oldalas képernyőképek a futó oldalról
 * (alapból http://localhost:3000) több szélességen, világos és sötét módban.
 * Az eredmény: test-results/screenshots/<oldal>-<szélesség>-<téma>.png
 *
 * Paraméterek (opcionális):
 *   --base=http://localhost:3000   --widths=375,768,1024,1440   --themes=light,dark
 *   --pages=/,/hobbijaim            (alapból az összes fő oldal)
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const arg = (name: string, fallback: string) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;

const base = arg("base", "http://localhost:3000");
const widths = arg("widths", "375,768,1024,1440").split(",").map(Number);
const themes = arg("themes", "light,dark").split(",") as ("light" | "dark")[];
const pages = arg(
  "pages",
  "/,/hobbijaim,/jatekaim,/youtube,/real-madrid,/adatkezelesi-tajekoztato,/cookie-tajekoztato,/nincs-ilyen-oldal",
).split(",");

const outDir = path.join(process.cwd(), "test-results", "screenshots");

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: process.platform === "win32" ? "msedge" : undefined });
  for (const theme of themes) {
    for (const width of widths) {
      const context = await browser.newContext({
        viewport: { width, height: width < 768 ? 812 : 900 },
        colorScheme: theme,
        deviceScaleFactor: 1,
      });
      await context.addInitScript((mode) => window.localStorage.setItem("theme", mode), theme);
      const page = await context.newPage();
      for (const route of pages) {
        await page.goto(base + route, { waitUntil: "networkidle" });
        // Végiggörgetünk, hogy a „lusta” (lazy) képek is betöltődjenek.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 400) {
            window.scrollTo({ top: y, behavior: "instant" });
            await new Promise((r) => setTimeout(r, 60));
          }
          window.scrollTo({ top: 0, behavior: "instant" });
        });
        await page.waitForLoadState("networkidle");
        await page
          .waitForFunction(() => Array.from(document.images).every((img) => img.complete), undefined, { timeout: 10000 })
          .catch(() => {});
        await page.waitForTimeout(300);
        const name = route === "/" ? "kezdolap" : route.replace(/^\//, "").replace(/\//g, "_");
        const file = path.join(outDir, `${name}-${width}-${theme}.png`);
        // Vízszintes túllógás ellenőrzése (mobilon ne kelljen oldalra görgetni).
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        await page.screenshot({ path: file, fullPage: true });
        console.log(overflow > 1 ? `⚠️  ${overflow}px túllógás:` : "✔", path.relative(process.cwd(), file));
      }
      await context.close();
    }
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
