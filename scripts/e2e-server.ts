/**
 * A böngészős tesztek szervere (a Playwright indítja).
 * Minden futtatáskor friss, elkülönített adatbázist és képmappát készít
 * (data/e2e), betölti a kezdő adatokat egy teszt-adminnal, majd elindítja a
 * lefordított (production) oldalt. A valódi adatokat nem érinti.
 * Előfeltétel: `npm run build`.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const port = process.env.E2E_PORT ?? "3100";
const password = process.env.E2E_ADMIN_PASSWORD;
const secret = process.env.E2E_SESSION_SECRET;
if (!password || !secret) {
  console.error("Az E2E_ADMIN_PASSWORD és az E2E_SESSION_SECRET hiányzik – a Playwright konfiguráció adja meg.");
  process.exit(1);
}

const env: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URL: "file:./data/e2e/site.db",
  DATABASE_AUTH_TOKEN: "",
  UPLOADS_DIR: "./data/e2e/uploads",
  BACKUPS_DIR: "./data/e2e/backups",
  ADMIN_USERNAME: process.env.E2E_ADMIN_USERNAME ?? "teszt-admin",
  ADMIN_PASSWORD: password,
  SESSION_SECRET: secret,
  COOKIE_SECURE: "false",
};

async function main() {
  fs.rmSync(path.join(root, "data", "e2e"), { recursive: true, force: true });
  Object.assign(process.env, env);

  // A modulokat csak a környezet beállítása után töltjük be.
  const { createDb } = await import("../src/db/client");
  const { runMigrations } = await import("../src/db/migrate");
  const { seed } = await import("../src/db/seed");
  const { getStorage } = await import("../src/lib/media/storage");

  const { db, client } = createDb();
  await runMigrations(db);
  await seed(db, getStorage(), { adminUsername: env.ADMIN_USERNAME, adminPassword: password });
  client.close();

  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "start", "-p", port], { env, stdio: "inherit" });
  const stop = () => child.kill();
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
