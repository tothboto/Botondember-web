/**
 * `npm run translate:import`
 *
 * A „/forditas” parancs utolsó lépése: betölti a kész fordításokat
 *   - `data/forditas/eredmeny*.json` és
 *   - `data/forditas/eredmeny/*.md` (hosszú szövegekhez)
 * fájlokból, és „Gépi – ellenőrizd” állapotban elmenti őket. A betöltött fájlok a
 * `data/forditas/kesz/` mappába kerülnek (így véletlenül sem töltődnek be kétszer).
 * A futó oldal legfeljebb egy percen belül átveszi a változást.
 */
import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

const DIR = path.join(process.cwd(), "data", "forditas");

async function main() {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", { info: () => {}, error: console.error });
  const { createDb } = await import("../src/db/client");
  const { runMigrations } = await import("../src/db/migrate");
  const { importResults, parseResultJson, parseResultMarkdown } = await import("../src/lib/content-i18n/worker");

  const jsonFiles = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((name) => /^eredmeny.*\.json$/.test(name)).map((name) => path.join(DIR, name)) : [];
  const mdDir = path.join(DIR, "eredmeny");
  const mdFiles = fs.existsSync(mdDir) ? fs.readdirSync(mdDir).filter((name) => name.endsWith(".md")).map((name) => path.join(mdDir, name)) : [];
  if (jsonFiles.length + mdFiles.length === 0) {
    console.log("Nincs betöltendő eredményfájl (data/forditas/eredmeny*.json vagy data/forditas/eredmeny/*.md).");
    return;
  }

  // Előbb minden fájlt beolvas és ellenőriz – hibás fájlnál semmi nem mentődik.
  const entries = [
    ...jsonFiles.flatMap((file) => parseResultJson(fs.readFileSync(file, "utf8"), path.relative(DIR, file))),
    ...mdFiles.map((file) => parseResultMarkdown(fs.readFileSync(file, "utf8"), path.relative(DIR, file))),
  ];

  const { db, client } = createDb();
  await runMigrations(db);
  const report = await importResults(db, entries);
  client.close();

  const archive = path.join(DIR, "kesz", new Date().toISOString().replace(/[:.]/g, "-"));
  fs.mkdirSync(archive, { recursive: true });
  for (const file of [...jsonFiles, ...mdFiles]) fs.renameSync(file, path.join(archive, path.relative(DIR, file).replace(/[\/]/g, "_")));

  const perLocale: Record<string, number> = {};
  for (const item of report.saved) perLocale[item.locale] = (perLocale[item.locale] ?? 0) + 1;
  console.log(`✔ ${report.saved.length} fordítás mentve („Gépi – ellenőrizd” állapotban).`);
  if (report.saved.length > 0) console.log(`  Nyelvenként: ${Object.entries(perLocale).map(([code, n]) => `${code}: ${n}`).join(", ")}`);
  if (report.skipped.length > 0) {
    console.log(`⚠ ${report.skipped.length} kihagyva:`);
    for (const item of report.skipped) console.log(`  – ${item.key} (${item.locale}): ${item.reason}`);
  }
  console.log(`A betöltött fájlok helye: ${path.relative(process.cwd(), archive)}`);
  console.log("Nézd át őket az Adminban: Saját szövegek fordítása. A futó oldal legfeljebb egy percen belül átveszi.");
}

main().catch((error) => {
  console.error("❌ A betöltés nem sikerült:", error instanceof Error ? error.message : error);
  process.exit(1);
});
