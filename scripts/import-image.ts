/**
 * `npm run image:import -- <fájl> --alt="mit ábrázol" [--as=figure|hero]`
 *
 * Betesz egy képet a médiatárba (ugyanúgy, mint az Admin feltöltése: WEBP-be
 * alakítja, kicsinyíti, a rejtett adatokat eltávolítja), és ha kéred, rögtön
 * be is állítja a kezdőlapon:
 *   --as=figure  → az előtérben álló alak (rajz)
 *   --as=hero    → a kezdőlap nagy háttérképe
 *
 * A futó fejlesztői szerver a változást legfeljebb egy percen belül átveszi
 * (vagy indítsd újra).
 */
import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  const alt = args.find((a) => a.startsWith("--alt="))?.slice("--alt=".length) ?? "";
  const as = args.find((a) => a.startsWith("--as="))?.slice("--as=".length);

  if (!file || !fs.existsSync(file)) {
    console.error('Használat: npm run image:import -- <fájl> --alt="mit ábrázol a kép" [--as=figure|hero]');
    process.exit(1);
  }
  if (as && as !== "figure" && as !== "hero") {
    console.error("A --as csak „figure” vagy „hero” lehet.");
    process.exit(1);
  }
  if (!alt.trim()) {
    console.error('Add meg az alt szöveget is: --alt="rövid leírás a képről" (a képernyőolvasóknak).');
    process.exit(1);
  }

  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", { info: () => {}, error: console.error });
  const { createDb } = await import("../src/db/client");
  const { runMigrations } = await import("../src/db/migrate");
  const { saveImage } = await import("../src/lib/media/library");
  const { getStorage } = await import("../src/lib/media/storage");
  const { writeSetting } = await import("../src/lib/admin/store");
  const { readAllSettings } = await import("../src/lib/data/settings");

  const { db, client } = createDb();
  await runMigrations(db);
  const media = await saveImage(db, getStorage(), fs.readFileSync(file), {
    originalName: path.basename(file),
    alt: alt.trim(),
    source: "upload",
  });
  console.log(`✔ Kép a médiatárban: #${media.id} (${media.width}×${media.height}, ${Math.round(media.size / 1024)} KB)`);

  if (as) {
    const settings = await readAllSettings();
    const home = as === "figure" ? { ...settings.home, figureMediaId: media.id } : { ...settings.home, heroMediaId: media.id };
    await writeSetting(db, "home", home);
    console.log(as === "figure" ? "✔ Beállítva az előtérben álló alaknak." : "✔ Beállítva a kezdőlap nagy képének.");
  }
  client.close();
  console.log("A futó oldal legfeljebb egy percen belül átveszi (vagy indítsd újra: Ctrl+C, majd npm run dev).");
}

main().catch((error) => {
  console.error("❌ A kép behozatala nem sikerült:", error);
  process.exit(1);
});
