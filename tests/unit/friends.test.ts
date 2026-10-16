import fs from "node:fs";
import path from "node:path";
import { asc, eq } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { friends } from "@/db/schema";
import { seed } from "@/db/seed";
import { deleteItem, saveItem } from "@/lib/admin/collections";
import { itemSchemas } from "@/lib/admin/schemas";
import { listContentFields } from "@/lib/content-i18n/registry";
import { deleteMediaCompletely, mediaUsageMap, saveImage } from "@/lib/media/library";
import { LocalDiskStorage } from "@/lib/media/storage";

let dir: string;
let db: Db;
let close: () => void;

const BASE = { name: "Barát", slug: "", mediaId: null, bodyMd: "", links: [], visible: true };

function removeDir(target: string) {
  try {
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch {
    // Nem baj, ha marad egy üres tesztmappa a data/ alatt (a Git úgysem látja).
  }
}

beforeAll(async () => {
  fs.mkdirSync("data", { recursive: true });
  for (const old of fs.readdirSync("data").filter((name) => name.startsWith("test-friends-"))) removeDir(path.join("data", old));
  dir = fs.mkdtempSync(path.join("data", "test-friends-"));
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

describe("barátok", () => {
  it("a kezdő adatok között ott a két példa barát, profilképpel", async () => {
    const rows = await db.select().from(friends).orderBy(asc(friends.sort));
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.slug)).toEqual(["pelda-barat", "zold-sarkany"]);
    expect(rows.every((row) => row.isExample && row.visible && row.mediaId !== null)).toBe(true);
    expect(rows[0].links).toEqual([{ kind: "game", url: "https://example.com" }]);
  });

  it("az URL-cím a névből készül, és sosem ütközik", async () => {
    const first = await saveItem(db, "friends", null, { ...BASE, name: "Zöld Sárkány" });
    const second = await saveItem(db, "friends", null, { ...BASE, name: "Zöld Sárkány" });
    const [a] = await db.select().from(friends).where(eq(friends.id, first));
    const [b] = await db.select().from(friends).where(eq(friends.id, second));
    // A kezdő adatok között már van „zold-sarkany”, ezért mindkettő sorszámot kap.
    expect(a.slug).toBe("zold-sarkany-2");
    expect(b.slug).toBe("zold-sarkany-3");

    await deleteItem(db, "friends", first);
    await deleteItem(db, "friends", second);
  });

  it("a linkek közül az üreseket eldobja, a rosszat nem fogadja el", async () => {
    const id = await saveItem(db, "friends", null, {
      ...BASE,
      name: "Linkes Barát",
      links: [
        { kind: "youtube", url: "youtube.com/@pelda" },
        { kind: "website", url: "" },
      ],
    });
    const [row] = await db.select().from(friends).where(eq(friends.id, id));
    expect(row.links).toEqual([{ kind: "youtube", url: "https://youtube.com/@pelda" }]);

    expect(itemSchemas.friends.safeParse({ ...BASE, links: [{ kind: "nincs-ilyen", url: "https://pelda.hu" }] }).success).toBe(false);
    expect(itemSchemas.friends.safeParse({ ...BASE, links: [{ kind: "other", url: "javascript:alert(1)" }] }).success).toBe(false);

    await deleteItem(db, "friends", id);
  });

  it("a szövegei fordíthatók, a profilképe pedig „használatban” van", async () => {
    const storage = new LocalDiskStorage(path.join(dir, "uploads"));
    const png = await sharp({ create: { width: 120, height: 120, channels: 3, background: "#6d3fc4" } }).png().toBuffer();
    const image = await saveImage(db, storage, png, { originalName: "barat.png", alt: "Teszt kép", source: "upload" });
    const id = await saveItem(db, "friends", null, { ...BASE, name: "Képes Barát", bodyMd: "Együtt focizunk.", mediaId: image.id });

    const keys = (await listContentFields(db)).map((field) => field.key);
    expect(keys).toContain(`friends:${id}:name`);
    expect(keys).toContain(`friends:${id}:bodyMd`);
    expect((await mediaUsageMap(db)).get(image.id)?.join(" ")).toContain("Képes Barát");

    await deleteMediaCompletely(db, storage, image.id);
    const [row] = await db.select().from(friends).where(eq(friends.id, id));
    expect(row.mediaId).toBeNull();

    await deleteItem(db, "friends", id);
  });

  it("a hibás adatokat nem fogadja el", () => {
    expect(itemSchemas.friends.safeParse(BASE).success).toBe(true);
    expect(itemSchemas.friends.safeParse({ ...BASE, name: "  " }).success).toBe(false);
    expect(itemSchemas.friends.safeParse({ ...BASE, name: "x".repeat(90) }).success).toBe(false);
    const many = Array.from({ length: 9 }, () => ({ kind: "other", url: "https://pelda.hu" }));
    expect(itemSchemas.friends.safeParse({ ...BASE, links: many }).success).toBe(false);
  });
});
