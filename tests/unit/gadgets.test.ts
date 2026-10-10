import fs from "node:fs";
import path from "node:path";
import { asc, eq } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { gadgets } from "@/db/schema";
import { seed } from "@/db/seed";
import { deleteItem, saveItem } from "@/lib/admin/collections";
import { itemSchemas } from "@/lib/admin/schemas";
import { listContentFields } from "@/lib/content-i18n/registry";
import { deleteMediaCompletely, mediaUsageMap, saveImage } from "@/lib/media/library";
import { LocalDiskStorage } from "@/lib/media/storage";

let dir: string;
let db: Db;
let close: () => void;

const BASE = {
  name: "Eszköz",
  category: "",
  maker: "",
  since: "",
  rating: 0,
  note: "",
  link: "",
  mediaId: null,
  visible: true,
};

function removeDir(target: string) {
  try {
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch {
    // Nem baj, ha marad egy üres tesztmappa a data/ alatt (a Git úgysem látja).
  }
}

beforeAll(async () => {
  fs.mkdirSync("data", { recursive: true });
  for (const old of fs.readdirSync("data").filter((name) => name.startsWith("test-gadgets-"))) removeDir(path.join("data", old));
  dir = fs.mkdtempSync(path.join("data", "test-gadgets-"));
  const created = createDb(`file:./${dir.split(path.sep).join("/")}/site.db`);
  db = created.db;
  close = () => created.client.close();
  await runMigrations(db);
  await seed(db, new LocalDiskStorage(path.join(dir, "uploads")), { adminUsername: "teszt-admin", adminPassword: "Pelda-Jelszo-2026" });
}, 120_000);

afterAll(() => {
  close();
  removeDir(dir);
});

describe("kedvenc eszközök", () => {
  it("a kezdő adatok között ott a három példa eszköz, csoportokba rendezve", async () => {
    const rows = await db.select().from(gadgets).orderBy(asc(gadgets.sort));
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.category)).toEqual(["Számítógépek", "Okosórák", "Egyéb kincseim"]);
    expect(rows.every((row) => row.isExample && row.visible)).toBe(true);
    expect(rows[0].mediaId).not.toBeNull();
  });

  it("új eszköz felvehető, és a szövegei fordíthatók", async () => {
    const id = await saveItem(db, "gadgets", null, {
      ...BASE,
      name: "Zöld Tabletke 11",
      category: "Tabletek",
      maker: "Zöld Kft.",
      since: "2026 óta",
      rating: 4,
      note: "Ezen rajzolok és nézek videókat.",
    });
    const [row] = await db.select().from(gadgets).where(eq(gadgets.id, id));
    expect(row).toMatchObject({ name: "Zöld Tabletke 11", category: "Tabletek", rating: 4, isExample: false });

    const keys = (await listContentFields(db)).map((field) => field.key);
    for (const field of ["name", "category", "maker", "since", "note"]) {
      expect(keys).toContain(`gadgets:${id}:${field}`);
    }

    await deleteItem(db, "gadgets", id);
    expect(await db.select().from(gadgets).where(eq(gadgets.id, id))).toHaveLength(0);
  });

  it("az eszköz képe „használatban” jelzést kap, és a kép törlésekor eltűnik a hivatkozás", async () => {
    const storage = new LocalDiskStorage(path.join(dir, "uploads"));
    const png = await sharp({ create: { width: 120, height: 120, channels: 3, background: "#c2410c" } }).png().toBuffer();
    const image = await saveImage(db, storage, png, { originalName: "eszkoz.png", alt: "Teszt kép", source: "upload" });
    const id = await saveItem(db, "gadgets", null, { ...BASE, name: "Képes eszköz", mediaId: image.id });

    expect((await mediaUsageMap(db)).get(image.id)?.join(" ")).toContain("Képes eszköz");

    await deleteMediaCompletely(db, storage, image.id);
    const [row] = await db.select().from(gadgets).where(eq(gadgets.id, id));
    expect(row.mediaId).toBeNull();

    await deleteItem(db, "gadgets", id);
  });

  it("a hibás adatokat nem fogadja el", () => {
    expect(itemSchemas.gadgets.safeParse(BASE).success).toBe(true);
    expect(itemSchemas.gadgets.safeParse({ ...BASE, name: "  " }).success).toBe(false);
    expect(itemSchemas.gadgets.safeParse({ ...BASE, rating: 9 }).success).toBe(false);
    expect(itemSchemas.gadgets.safeParse({ ...BASE, link: "javascript:alert(1)" }).success).toBe(false);
    expect(itemSchemas.gadgets.safeParse({ ...BASE, name: "x".repeat(130) }).success).toBe(false);
  });
});
