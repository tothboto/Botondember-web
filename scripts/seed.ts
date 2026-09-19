/**
 * `npm run db:seed` – csak a kezdő adatokat tölti be (a migrációkat is lefuttatja).
 * Többször is lefuttatható: a meglévő adatokat nem írja felül és nem duplikálja.
 */
import { loadEnvConfig } from "@next/env";
import { createDb } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { seed } from "../src/db/seed";
import { getStorage } from "../src/lib/media/storage";

async function main() {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", { info: () => {}, error: console.error });
  const { db, client } = createDb();
  await runMigrations(db);
  const report = await seed(db, getStorage(), {
    adminUsername: process.env.ADMIN_USERNAME,
    adminPassword: process.env.ADMIN_PASSWORD,
    log: (message) => console.log(message),
  });
  client.close();
  console.log(
    `✔ Seed kész. Új fordítások: ${report.translationsAdded}, admin létrehozva: ${report.adminCreated ? "igen" : "nem"}, példatartalom: ${report.examplesLoaded ? "most betöltve" : "már korábban betöltve"}.`,
  );
}

main().catch((error) => {
  console.error("❌ A seed nem sikerült:", error);
  process.exit(1);
});
