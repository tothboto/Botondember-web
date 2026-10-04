import fs from "node:fs";
import path from "node:path";
import { asc, eq } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { schools } from "@/db/schema";
import { seed } from "@/db/seed";
import { deleteItem, saveItem } from "@/lib/admin/collections";
import { itemSchemas } from "@/lib/admin/schemas";
import { listContentFields } from "@/lib/content-i18n/registry";
import { deleteMediaCompletely, mediaUsageMap, saveImage } from "@/lib/media/library";
import { LocalDiskStorage } from "@/lib/media/storage";

let dir: string;
let db: Db;
let close: () => void;

function removeDir(target: string) {
  try {
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch {
    // Nem baj, ha marad egy üres tesztmappa a data/ alatt (a Git úgysem látja).
  }
}

beforeAll(async () => {
  fs.mkdirSync("data", { recursive: true });
  for (const old of fs.readdirSync("data").filter((name) => name.startsWith("test-schools-"))) removeDir(path.join("data", old));
  dir = fs.mkdtempSync(path.join("data", "test-schools-"));
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

describe("iskolák", () => {
  it("a kezdő adatok között ott a példa iskola, saját URL-címmel", async () => {
    const rows = await db.select().from(schools).orderBy(asc(schools.sort));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ slug: "pelda-iskola", name: "Példa iskola", isExample: true, visible: true });
  });

  it("az URL-cím a névből készül, és sosem ütközik", async () => {
    const first = await saveItem(db, "schools", null, {
      name: "Zöldfa Téri Általános Iskola",
      slug: "",
      kind: "általános iskola",
      city: "Baja",
      address: "",
      years: "",
      link: "",
      lead: "",
      bodyMd: "",
      mediaId: null,
      visible: true,
    });
    const second = await saveItem(db, "schools", null, {
      name: "Zöldfa Téri Általános Iskola",
      slug: "",
      kind: "",
      city: "",
      address: "",
      years: "",
      link: "",
      lead: "",
      bodyMd: "",
      mediaId: null,
      visible: true,
    });
    const [a] = await db.select().from(schools).where(eq(schools.id, first));
    const [b] = await db.select().from(schools).where(eq(schools.id, second));
    expect(a.slug).toBe("zoldfa-teri-altalanos-iskola");
    expect(b.slug).toBe("zoldfa-teri-altalanos-iskola-2");

    // A saját szövegei fordíthatók (megjelennek a fordítási jegyzékben).
    const keys = (await listContentFields(db)).map((field) => field.key);
    expect(keys).toContain(`schools:${first}:name`);
    expect(keys).toContain(`schools:${first}:kind`);
    expect(keys).toContain(`schools:${first}:city`);

    await deleteItem(db, "schools", first);
    await deleteItem(db, "schools", second);
  });

  it("az iskola képe „használatban” jelzést kap, és a kép törlésekor eltűnik a hivatkozás", async () => {
    const storage = new LocalDiskStorage(path.join(dir, "uploads"));
    const png = await sharp({ create: { width: 160, height: 90, channels: 3, background: "#2f6b4f" } }).png().toBuffer();
    const image = await saveImage(db, storage, png, { originalName: "iskola.png", alt: "Teszt kép", source: "upload" });
    const id = await saveItem(db, "schools", null, {
      name: "Képes iskola",
      slug: "",
      kind: "",
      city: "",
      address: "",
      years: "",
      link: "",
      lead: "",
      bodyMd: "",
      mediaId: image.id,
      visible: true,
    });

    expect((await mediaUsageMap(db)).get(image.id)?.join(" ")).toContain("Képes iskola");

    await deleteMediaCompletely(db, storage, image.id);
    const [row] = await db.select().from(schools).where(eq(schools.id, id));
    expect(row.mediaId).toBeNull();

    await deleteItem(db, "schools", id);
  });

  it("a hibás adatokat nem fogadja el", () => {
    const base = { name: "Iskola", slug: "", kind: "", city: "", address: "", years: "", link: "", lead: "", bodyMd: "", mediaId: null, visible: true };
    expect(itemSchemas.schools.safeParse(base).success).toBe(true);
    expect(itemSchemas.schools.safeParse({ ...base, name: "  " }).success).toBe(false);
    expect(itemSchemas.schools.safeParse({ ...base, link: "javascript:alert(1)" }).success).toBe(false);
    expect(itemSchemas.schools.safeParse({ ...base, name: "x".repeat(130) }).success).toBe(false);
  });
});
