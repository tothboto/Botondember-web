import fs from "node:fs";
import path from "node:path";
import { asc, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { schools } from "@/db/schema";
import { seed } from "@/db/seed";
import { deleteItem, saveItem } from "@/lib/admin/collections";
import { itemSchemas } from "@/lib/admin/schemas";
import { listContentFields } from "@/lib/content-i18n/registry";
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
      name: "Bajai Szentistváni Általános Iskola",
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
      name: "Bajai Szentistváni Általános Iskola",
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
    expect(a.slug).toBe("bajai-szentistvani-altalanos-iskola");
    expect(b.slug).toBe("bajai-szentistvani-altalanos-iskola-2");

    // A saját szövegei fordíthatók (megjelennek a fordítási jegyzékben).
    const keys = (await listContentFields(db)).map((field) => field.key);
    expect(keys).toContain(`schools:${first}:name`);
    expect(keys).toContain(`schools:${first}:kind`);
    expect(keys).toContain(`schools:${first}:city`);

    await deleteItem(db, "schools", first);
    await deleteItem(db, "schools", second);
  });

  it("a hibás adatokat nem fogadja el", () => {
    const base = { name: "Iskola", slug: "", kind: "", city: "", address: "", years: "", link: "", lead: "", bodyMd: "", mediaId: null, visible: true };
    expect(itemSchemas.schools.safeParse(base).success).toBe(true);
    expect(itemSchemas.schools.safeParse({ ...base, name: "  " }).success).toBe(false);
    expect(itemSchemas.schools.safeParse({ ...base, link: "javascript:alert(1)" }).success).toBe(false);
    expect(itemSchemas.schools.safeParse({ ...base, name: "x".repeat(130) }).success).toBe(false);
  });
});
