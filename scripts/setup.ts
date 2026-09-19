/**
 * `npm run setup` – egy paranccsal felállítja a teljes helyi környezetet:
 *   1. `.env.local` létrehozása (ha nincs) és a titkos kulcs (SESSION_SECRET) generálása,
 *   2. adatbázis-migrációk,
 *   3. kezdő adatok (admin, nyelvek, fordítások, oldalak, példák, jogi szövegek, képek).
 *
 * Többször is lefuttatható: semmit nem duplikál és nem ír felül.
 * Az `npm run dev` előtt csendes módban (`--quiet`) automatikusan lefut.
 */
import crypto from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { createDb } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { adminUsers } from "../src/db/schema";
import { seed } from "../src/db/seed";
import { getStorage, uploadsRoot } from "../src/lib/media/storage";
import { ensureEnvFile, readEnvFile, readEnvValue, setEnvValue, writeEnvFile } from "./lib/env-file";

const root = process.cwd();
const quiet = process.argv.includes("--quiet");
const log = (message = "") => {
  if (!quiet) console.log(message);
};

function generatePassword(): string {
  // Csak betűk és számok – így a .env fájlban sem okoz gondot (pl. a $ jel).
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(20);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function main() {
  log("🛠️  Botondember első weboldala – beállítás");
  log("");

  // 1) .env.local és titkos kulcs
  if (ensureEnvFile(root)) log("✔ .env.local létrehozva a .env.example alapján.");
  let envContent = readEnvFile(root);
  const secret = readEnvValue(envContent, "SESSION_SECRET") ?? "";
  if (secret.length < 32) {
    envContent = setEnvValue(envContent, "SESSION_SECRET", crypto.randomBytes(48).toString("base64url"));
    writeEnvFile(envContent, root);
    log("✔ Titkos kulcs (SESSION_SECRET) legenerálva.");
  }
  loadEnvConfig(root, process.env.NODE_ENV !== "production", { info: () => {}, error: console.error }, true);

  // 2) Adatbázis
  const { db, client } = createDb();
  if ((process.env.DATABASE_URL ?? "file:").startsWith("file:")) {
    await client.execute("PRAGMA journal_mode = WAL");
  }
  await runMigrations(db);
  log("✔ Adatbázis naprakész.");

  // 3) Admin jelszó: ha még nincs admin és jelszó sincs megadva, generálunk egyet.
  const admins = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
  let generatedPassword: string | null = null;
  if (admins.length === 0 && !process.env.ADMIN_PASSWORD) {
    generatedPassword = generatePassword();
    envContent = setEnvValue(readEnvFile(root), "ADMIN_PASSWORD", generatedPassword);
    writeEnvFile(envContent, root);
    process.env.ADMIN_PASSWORD = generatedPassword;
  }

  // 4) Kezdő adatok
  const storage = getStorage();
  const report = await seed(db, storage, {
    adminUsername: process.env.ADMIN_USERNAME,
    adminPassword: process.env.ADMIN_PASSWORD,
    log,
  });
  client.close();

  log("✔ Kezdő adatok rendben.");
  log(`  Képek mappája: ${uploadsRoot()}`);

  if (generatedPassword) {
    // Ezt csendes módban is kiírjuk, mert fontos.
    console.log("");
    console.log("🔑 Nem volt megadva admin jelszó, ezért generáltam egyet:");
    console.log(`   Felhasználónév: ${process.env.ADMIN_USERNAME || "Botond"}`);
    console.log(`   Jelszó:         ${generatedPassword}`);
    console.log("   (A .env.local fájlba is beírtam. Belépés után az Admin > Fiók menüben megváltoztathatod.)");
  }
  if (report.adminCreated && !generatedPassword) {
    log("");
    log("ℹ️  Az admin jelszó bcrypt-hash-ként bekerült az adatbázisba. A sima jelszó ezután");
    log("   törölhető a .env.local fájlból (ADMIN_PASSWORD), és az Adminban bármikor módosítható.");
  }
  if (report.adminMissingPassword) {
    console.log("⚠️  Admin felhasználó nem jött létre – ellenőrizd az ADMIN_PASSWORD értékét a .env.local fájlban!");
  }

  log("");
  log("Kész! Indítás: npm run dev   →   http://localhost:3000");
}

main().catch((error) => {
  console.error("❌ A beállítás nem sikerült:", error);
  process.exit(1);
});
