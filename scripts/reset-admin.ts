/**
 * `npm run admin:reset` – elfelejtett jelszó esetén: az admin jelszavát (és ha
 * meg van adva, a felhasználónevét) a `.env.local` fájlban lévő értékre állítja.
 *
 * Használat:
 *   1. A .env.local fájlba írd be az ÚJ jelszót:  ADMIN_PASSWORD="valami-uj-jelszo"
 *   2. Futtasd:  npm run admin:reset
 *   3. Lépj be, majd töröld a jelszót a .env.local fájlból.
 *
 * Mivel ehhez a gépen lévő projektmappához kell hozzáférni, ez biztonságos:
 * a weboldalon keresztül senki nem tudja így átállítani a jelszót.
 * A jelszót a script soha nem írja ki.
 */
import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import { createDb } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { adminUsers, loginAttempts } from "../src/db/schema";
import { hashPassword, isValidPasswordLength, verifyPassword } from "../src/lib/auth/password";

async function main() {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", { info: () => {}, error: console.error });
  const password = process.env.ADMIN_PASSWORD ?? "";
  const username = process.env.ADMIN_USERNAME?.trim() || "";

  if (!password) {
    console.error('❌ Nincs megadva új jelszó. Írd be a .env.local fájlba: ADMIN_PASSWORD="az-uj-jelszo", majd futtasd újra.');
    process.exit(1);
  }
  if (!isValidPasswordLength(password)) {
    console.error("❌ A jelszó legalább 8 karakter legyen (és legfeljebb kb. 70 betű).");
    process.exit(1);
  }

  const { db, client } = createDb();
  await runMigrations(db);
  const [admin] = await db.select().from(adminUsers).limit(1);
  const now = Date.now();

  if (!admin) {
    await db.insert(adminUsers).values({ username: username || "Botond", passwordHash: await hashPassword(password), updatedAt: now });
    console.log(`✔ Admin felhasználó létrehozva: ${username || "Botond"}`);
  } else {
    if (await verifyPassword(password, admin.passwordHash)) {
      console.log("ℹ️  A .env.local fájlban lévő jelszó már most is az admin jelszava – nem változtattam semmit.");
    } else {
      await db
        .update(adminUsers)
        .set({
          passwordHash: await hashPassword(password),
          ...(username ? { username } : {}),
          updatedAt: Math.max(now, admin.updatedAt + 1),
        })
        .where(eq(adminUsers.id, admin.id));
      console.log(`✔ Az admin jelszava visszaállítva${username ? ` (felhasználónév: ${username})` : ""}.`);
      console.log("  Minden korábbi belépés érvénytelen lett – lépj be újra.");
    }
  }
  // Ha a sok hibás próbálkozás miatt le volt tiltva a belépés, ez feloldja.
  await db.delete(loginAttempts);
  client.close();

  console.log("");
  console.log("⚠️  Belépés után töröld a jelszót a .env.local fájlból (az ADMIN_PASSWORD= sor végéről)!");
}

main().catch((error) => {
  console.error("❌ A visszaállítás nem sikerült:", error);
  process.exit(1);
});
