import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from "fflate";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { seed } from "@/db/seed";
import { adminUsers, hobbies, media, settings } from "@/db/schema";
import { BackupError, createBackup, restoreBackup } from "@/lib/backup";
import { LocalDiskStorage } from "@/lib/media/storage";
import { parseSetting } from "@/lib/settings";

/** Egy teljes, átmeneti adatbázis + képtár a data/ mappában (a Git nem látja). */
let dir: string;
let db: Db;
let close: () => void;
let storage: LocalDiskStorage;

/** Takarítás – Windowson a lezárt adatbázisfájlt a rendszer néha még egy pillanatig fogja. */
function removeDir(target: string) {
  try {
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch {
    // Nem baj, ha marad egy üres tesztmappa a data/ alatt (a Git úgysem látja).
  }
}

beforeAll(async () => {
  fs.mkdirSync("data", { recursive: true });
  for (const old of fs.readdirSync("data").filter((name) => name.startsWith("test-backup-"))) removeDir(path.join("data", old));
  dir = fs.mkdtempSync(path.join("data", "test-backup-"));
  const created = createDb(`file:./${dir.replace(/\\/g, "/")}/site.db`);
  db = created.db;
  close = () => created.client.close();
  await runMigrations(db);
  storage = new LocalDiskStorage(path.join(dir, "uploads"));
  await seed(db, storage, { adminUsername: "teszt-admin", adminPassword: "Pelda-Jelszo-2026" });
}, 120_000);

afterAll(() => {
  close();
  removeDir(dir);
});

async function homeMessage(): Promise<string> {
  const [row] = await db.select().from(settings).where(eq(settings.key, "home"));
  return parseSetting("home", row?.value).message;
}

function rezip(zip: Uint8Array, change: (entries: Record<string, Uint8Array>) => void): Uint8Array {
  const entries = unzipSync(zip);
  change(entries);
  return zipSync(Object.fromEntries(Object.entries(entries).map(([name, data]) => [name, data])) as Zippable);
}

describe("mentés", () => {
  it("benne van minden tartalom és kép, de a belépési adatok nem", async () => {
    const backup = await createBackup(db, storage);
    const entries = unzipSync(backup.zip);
    const json = strFromU8(entries["mentes.json"]);
    const data = JSON.parse(json) as { format: string; tables: Record<string, unknown[]> };

    expect(data.format).toBe("botondember-mentes");
    expect(data.tables.hobbies.length).toBeGreaterThan(0);
    expect(data.tables.adminUsers).toBeUndefined();
    expect(data.tables.loginAttempts).toBeUndefined();
    expect(json).not.toContain("$2b$"); // jelszó-hash sincs benne
    expect(json).not.toContain("teszt-admin");

    const mediaRows = await db.select().from(media);
    for (const row of mediaRows) expect(entries[`fajlok/${row.path}`], row.path).toBeDefined();
    expect(entries["fajlok/favicon/default/favicon.ico"]).toBeDefined();
    expect(backup.missingFiles).toEqual([]);
  });
});

describe("visszaállítás", () => {
  it("visszaállítja a tartalmat, törli a felesleges képeket, a fiókhoz nem nyúl", async () => {
    const originalMessage = await homeMessage();
    const originalHobbies = await db.select().from(hobbies);
    const backup = await createBackup(db, storage);

    // Változtatások a mentés után:
    const [homeRow] = await db.select().from(settings).where(eq(settings.key, "home"));
    await db
      .update(settings)
      .set({ value: { ...(homeRow.value as object), message: "Megváltozott üzenet" } })
      .where(eq(settings.key, "home"));
    await db.delete(hobbies).where(eq(hobbies.id, originalHobbies[0].id));
    await storage.put("img/2099/01/felesleges.webp", Buffer.from("RIFF0000WEBPVP8 extra"));
    await db.update(adminUsers).set({ passwordHash: "uj-hash-a-mentes-utan" });
    expect(await homeMessage()).toBe("Megváltozott üzenet");

    const safetyDir = path.join(dir, "backups");
    const report = await restoreBackup(db, storage, backup.zip, { safetyDir });

    expect(await homeMessage()).toBe(originalMessage);
    expect((await db.select().from(hobbies)).map((h) => h.title)).toEqual(originalHobbies.map((h) => h.title));
    expect(await storage.exists("img/2099/01/felesleges.webp")).toBe(false);
    const [admin] = await db.select().from(adminUsers);
    expect(admin.passwordHash).toBe("uj-hash-a-mentes-utan");
    expect(admin.username).toBe("teszt-admin");

    expect(report.warnings).toEqual([]);
    expect(report.safetyBackup).toMatch(/^automatikus-mentes-.+\.zip$/);
    expect(fs.existsSync(path.join(safetyDir, report.safetyBackup as string))).toBe(true);
  }, 60_000);

  it("a hibás fájlokat elutasítja, és ilyenkor semmi sem változik", async () => {
    const before = (await db.select().from(hobbies)).length;
    const backup = await createBackup(db, storage);
    const firstImage = (await db.select().from(media))[0].path;

    const attempts: [string, Uint8Array][] = [
      ["nem ZIP", strToU8("ez nem egy zip fájl")],
      ["nincs benne mentes.json", zipSync({ "valami.txt": strToU8("szia") })],
      ["más formátum", zipSync({ "mentes.json": strToU8(JSON.stringify({ format: "mas", version: 1, createdAt: 1, tables: {} })) })],
      ["hiányzó kép", rezip(backup.zip, (entries) => delete entries[`fajlok/${firstImage}`])],
      ["a kép nem kép", rezip(backup.zip, (entries) => (entries[`fajlok/${firstImage}`] = strToU8("<svg onload=alert(1)>")))],
    ];
    for (const [label, zip] of attempts) {
      await expect(restoreBackup(db, storage, zip, { safetyDir: null }), label).rejects.toBeInstanceOf(BackupError);
    }
    expect((await db.select().from(hobbies)).length).toBe(before);
  }, 60_000);

  it("a trükkös útvonalú fájlokat (../) figyelmen kívül hagyja", async () => {
    const backup = await createBackup(db, storage);
    const evil = rezip(backup.zip, (entries) => {
      entries["fajlok/../../kitoro.webp"] = strToU8("RIFF0000WEBPVP8 x");
      entries["../kitoro2.webp"] = strToU8("RIFF0000WEBPVP8 x");
    });
    await restoreBackup(db, storage, evil, { safetyDir: null });
    expect(fs.existsSync(path.join(dir, "kitoro.webp"))).toBe(false);
    expect(fs.existsSync(path.join(dir, "..", "kitoro2.webp"))).toBe(false);
    expect(fs.existsSync(path.join("kitoro.webp"))).toBe(false);
  }, 60_000);
});
