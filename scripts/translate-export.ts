/**
 * `npm run translate:export [-- --all] [-- --lang=en,de]`
 *
 * A „/forditas” parancs első lépése: kiírja a fordításra váró saját szövegeket a
 * `data/forditas/feladat.json` fájlba (a magyar eredetivel és a célnyelvekkel).
 *   (alapból)   csak az Adminban kért szövegek („Fordításra vár”)
 *   --all       + minden hiányzó és gépi fordítású elavult szöveg a bekapcsolt nyelveken
 *   --lang=…    csak ezekre a nyelvekre (vesszővel elválasztva)
 *
 * A kész fordításokat a `npm run translate:import` tölti vissza.
 */
import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

const DIR = path.join(process.cwd(), "data", "forditas");

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const only = args
    .find((a) => a.startsWith("--lang="))
    ?.slice("--lang=".length)
    .split(",")
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean);

  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", { info: () => {}, error: console.error });
  const { createDb } = await import("../src/db/client");
  const { runMigrations } = await import("../src/db/migrate");
  const { buildExport } = await import("../src/lib/content-i18n/worker");

  const { db, client } = createDb();
  await runMigrations(db);
  const data = await buildExport(db, { all, only });
  client.close();

  fs.mkdirSync(DIR, { recursive: true });
  const leftovers = fs.readdirSync(DIR).filter((name) => /^eredmeny.*\.json$/.test(name));
  const mdDir = path.join(DIR, "eredmeny");
  const mdLeftovers = fs.existsSync(mdDir) ? fs.readdirSync(mdDir).filter((name) => name.endsWith(".md")) : [];
  if (leftovers.length + mdLeftovers.length > 0) {
    console.warn(`⚠ Van még be nem töltött eredményfájl (${[...leftovers, ...mdLeftovers.map((n) => `eredmeny/${n}`)].join(", ")}).`);
    console.warn("  Előbb töltsd be: npm run translate:import – vagy töröld őket, ha már nem kellenek.");
  }
  fs.writeFileSync(path.join(DIR, "feladat.json"), `${JSON.stringify(data, null, 2)}\n`, "utf8");

  const count = data.items.reduce((sum, item) => sum + item.targets.length, 0);
  if (count === 0) {
    console.log(all ? "✔ Nincs mit fordítani – minden szöveg le van fordítva." : "✔ Nincs fordításra váró szöveg. (Minden hiányzóhoz: npm run translate:export -- --all)");
    return;
  }
  const perLocale: Record<string, number> = {};
  for (const item of data.items) for (const t of item.targets) perLocale[t.locale] = (perLocale[t.locale] ?? 0) + 1;
  const chars = data.items.reduce((sum, item) => sum + item.source.length * item.targets.length, 0);
  console.log(`✔ data/forditas/feladat.json: ${data.items.length} szöveg, ${count} fordítás (~${Math.round(chars / 1000)}k karakter)`);
  console.log(`  Nyelvenként: ${Object.entries(perLocale).map(([code, n]) => `${code}: ${n}`).join(", ")}`);
}

main().catch((error) => {
  console.error("❌ A kiírás nem sikerült:", error);
  process.exit(1);
});
