import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { seed } from "@/db/seed";
import { contentTranslations, hobbies, translationRequests } from "@/db/schema";
import { deleteItem } from "@/lib/admin/collections";
import { createLocalizer } from "@/lib/content-i18n/localizer";
import { listContentFields, type ContentField } from "@/lib/content-i18n/registry";
import { contentKey, contentStatus, lostTokens, parseContentKey, sourceHash } from "@/lib/content-i18n/status";
import {
  addTranslationRequest,
  indexStored,
  readRequestSet,
  readStoredTranslations,
  remapFooterLinkTranslations,
  requestId,
  statusOf,
  writeContentTranslation,
} from "@/lib/content-i18n/store";
import { buildExport, importResults, parseResultJson, parseResultMarkdown } from "@/lib/content-i18n/worker";
import { LocalDiskStorage } from "@/lib/media/storage";

describe("állapot és azonosítók", () => {
  it("a forrás ujjlenyomata stabil, a sorvégek és a szélső szóközök nem számítanak", () => {
    const hash = sourceHash("Szia!\nEz az oldalam.");
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
    expect(sourceHash("  Szia!\r\nEz az oldalam.  ")).toBe(hash);
    expect(sourceHash("Szia!\nEz az oldalam!")).not.toBe(hash);
  });

  it("kiszámolja a fordítás állapotát", () => {
    const source = "Foci";
    const row = (origin: string, value = "Football", hash = sourceHash(source)) => ({ origin, value, sourceHash: hash });
    expect(contentStatus(source, undefined, false)).toBe("missing");
    expect(contentStatus(source, undefined, true)).toBe("requested");
    expect(contentStatus(source, row("auto"), false)).toBe("auto");
    expect(contentStatus(source, row("manual"), false)).toBe("manual");
    expect(contentStatus(source, row("keep", ""), false)).toBe("keep");
    expect(contentStatus(source, row("manual", "Football", sourceHash("Kosárlabda")), false)).toBe("outdated");
    expect(contentStatus(source, row("auto", "   "), false)).toBe("missing");
  });

  it("a mezők azonosítója oda-vissza alakítható, a hibásat elutasítja", () => {
    const key = contentKey("settings", "home", "guide.text");
    expect(key).toBe("settings:home:guide.text");
    expect(parseContentKey(key)).toEqual({ entity: "settings", entityId: "home", field: "guide.text" });
    expect(parseContentKey("hobbies:12:title")).toEqual({ entity: "hobbies", entityId: "12", field: "title" });
    expect(parseContentKey("hobbies:12")).toBeNull();
    expect(parseContentKey("hobbies:1 2:title")).toBeNull();
    expect(parseContentKey("x:1:title; DROP")).toBeNull();
  });

  it("jelzi, ha a fordításból kimaradt egy {{HELYŐRZŐ}}", () => {
    const source = "Az adatkezelő: {{ADATKEZELO_NEV}} ({{ADATKEZELO_EMAIL}})";
    expect(lostTokens(source, "Controller: {{ADATKEZELO_NEV}} ({{ADATKEZELO_EMAIL}})")).toEqual([]);
    expect(lostTokens(source, "Controller: {{ADATKEZELO_NEV}}")).toEqual(["ADATKEZELO_EMAIL"]);
  });
});

describe("megjelenítés a látogató nyelvén", () => {
  const map = {
    "hobbies:1:title": { value: "Football", hash: sourceHash("Foci") },
    "settings:footer:links.0.label": { value: "My channel", hash: sourceHash("Csatornám") },
  };

  it("magyarul mindig az eredeti jelenik meg", () => {
    expect(createLocalizer("hu", map).get("hobbies", 1, "title", "Foci")).toEqual({ text: "Foci", lang: "hu" });
  });

  it("fordítás esetén a fordítás, egyébként a magyar – a helyes lang jelöléssel", () => {
    const l = createLocalizer("en", map);
    expect(l.get("hobbies", 1, "title", "Foci")).toEqual({ text: "Football", lang: "en" });
    expect(l.get("hobbies", 2, "title", "Úszás")).toEqual({ text: "Úszás", lang: "hu" });
    expect(l.get("hobbies", 3, "title", "")).toEqual({ text: "", lang: "hu" });
  });

  it("az elavult fordítás megjelenik, kivéve szigorú módban", () => {
    const l = createLocalizer("en", map);
    expect(l.get("hobbies", 1, "title", "Foci!!").text).toBe("Football");
    expect(l.get("settings", "footer", "links.0.label", "Instagram", { strict: true })).toEqual({ text: "Instagram", lang: "hu" });
    expect(l.get("settings", "footer", "links.0.label", "Csatornám", { strict: true }).text).toBe("My channel");
  });

  it("egy sor mezőit egyszerre fordítja, mezőnkénti nyelvvel", () => {
    const row = createLocalizer("en", map).row("hobbies", { id: 1, title: "Foci", body: "Hétvégén", sort: 1 }, ["title", "body"] as const);
    expect(row).toMatchObject({ id: 1, title: "Football", body: "Hétvégén", sort: 1, lang: { title: "en", body: "hu" } });
  });
});

describe("eredményfájlok beolvasása", () => {
  it("JSON: kulcsonként több nyelv", () => {
    const entries = parseResultJson(JSON.stringify({ items: [{ key: "hobbies:1:title", sourceHash: "abc", translations: { en: "Football", de: "Fußball" } }] }));
    expect(entries).toEqual([
      { key: "hobbies:1:title", locale: "en", sourceHash: "abc", text: "Football", file: "eredmeny.json" },
      { key: "hobbies:1:title", locale: "de", sourceHash: "abc", text: "Fußball", file: "eredmeny.json" },
    ]);
    expect(() => parseResultJson("{ nem json")).toThrow(/hibás JSON/);
    expect(() => parseResultJson(JSON.stringify({ items: [{ key: "x" }] }))).toThrow(/hibás elem/);
  });

  it("Markdown fejléccel (hosszú szövegekhez)", () => {
    const entry = parseResultMarkdown("---\nkey: legal_docs:privacy:bodyMd\nlocale: en\nsourceHash: abc\n---\n## 1. Introduction\n\nText.\n");
    expect(entry).toMatchObject({ key: "legal_docs:privacy:bodyMd", locale: "en", sourceHash: "abc", text: "## 1. Introduction\n\nText.\n" });
    expect(() => parseResultMarkdown("nincs fejléc")).toThrow(/fejléc/);
  });
});

/* -------------------------------------------------------------------------- */
/* Adatbázissal (átmeneti, feltöltött adatbázis a data/ mappában)             */
/* -------------------------------------------------------------------------- */

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
  for (const old of fs.readdirSync("data").filter((name) => name.startsWith("test-content-i18n-"))) removeDir(path.join("data", old));
  dir = fs.mkdtempSync(path.join("data", "test-content-i18n-"));
  const created = createDb(`file:./${dir.replace(/\\/g, "/")}/site.db`);
  db = created.db;
  close = () => created.client.close();
  await runMigrations(db);
  await seed(db, new LocalDiskStorage(path.join(dir, "uploads")), { adminUsername: "teszt-admin", adminPassword: "Pelda-Jelszo-2026" });
}, 120_000);

afterAll(() => {
  close();
  removeDir(dir);
});

async function field(key: string): Promise<ContentField> {
  const found = (await listContentFields(db)).find((f) => f.key === key);
  if (!found) throw new Error(`nincs ilyen mező: ${key}`);
  return found;
}

async function status(key: string, locale: string) {
  const f = await field(key);
  const index = indexStored(await readStoredTranslations(db));
  return statusOf(f.source, index, await readRequestSet(db), key, locale);
}

describe("a fordítható mezők jegyzéke", () => {
  it("minden saját szöveg benne van, az üresek nem, és minden kulcs egyedi", async () => {
    const fields = await listContentFields(db);
    const keys = fields.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("settings:home:message");
    expect(keys).toContain("settings:home:guide.text");
    expect(keys).toContain("settings:general:siteName");
    expect(keys).toContain("legal_docs:privacy:bodyMd");
    expect(keys.some((k) => k.startsWith("hobbies:") && k.endsWith(":title"))).toBe(true);
    expect(keys.some((k) => k.startsWith("media:") && k.endsWith(":alt"))).toBe(true);
    for (const f of fields) {
      expect(f.source.trim(), f.key).not.toBe("");
      expect(parseContentKey(f.key), f.key).not.toBeNull();
      expect(f.editHref, f.key).toMatch(/^\/admin/);
    }
  });

  it("a Real Madrid oldalról csak a látható szekciószövegek fordíthatók", async () => {
    const fields = (await listContentFields(db)).filter((f) => f.entity === "football_sections");
    expect(fields.map((f) => f.label).every((label) => /^(Nyitókép|Miért a Real Madrid\?)/.test(label))).toBe(true);
  });
});

describe("kiírás → fordítás → betöltés", () => {
  it("a kérés nélküli kiírás üres, a --all minden hiányzót kiír a bekapcsolt nyelvekre", async () => {
    expect((await buildExport(db)).items).toEqual([]);
    const all = await buildExport(db, { all: true, only: ["en"] });
    const message = all.items.find((item) => item.key === "settings:home:message");
    expect(message?.targets).toEqual([{ locale: "en", language: "English" }]);
    expect(message?.sourceHash).toBe(sourceHash((await field("settings:home:message")).source));
  });

  it("a kész fordítás „Gépi – ellenőrizd” lesz, és a kérés teljesül", async () => {
    const f = await field("settings:home:message");
    await addTranslationRequest(db, f.key, "de");
    expect(await status(f.key, "de")).toBe("requested");
    expect((await buildExport(db)).items.map((i) => i.key)).toEqual([f.key]);

    const report = await importResults(db, [{ key: f.key, locale: "de", sourceHash: sourceHash(f.source), text: "Hallo! Ich bin Botondember." }]);
    expect(report.saved).toEqual([{ key: f.key, locale: "de" }]);
    expect(await status(f.key, "de")).toBe("auto");
    expect(await readRequestSet(db)).toEqual(new Set());
  });

  it("a kézzel írt fordítást nem írja felül – csak ha kifejezetten új fordítást kértek rá", async () => {
    const f = await field("settings:home:subtitle").catch(() => field("settings:general:headerTitle"));
    await writeContentTranslation(db, { key: f.key, locale: "en", value: "My own words", origin: "manual", source: f.source });
    const entry = { key: f.key, locale: "en", sourceHash: sourceHash(f.source), text: "Machine words" };

    const first = await importResults(db, [entry]);
    expect(first.saved).toEqual([]);
    expect(first.skipped[0].reason).toMatch(/kézzel írt/);

    await addTranslationRequest(db, f.key, "en");
    const second = await importResults(db, [entry]);
    expect(second.saved).toHaveLength(1);
    const stored = indexStored(await readStoredTranslations(db, "en")).get(requestId(f.key, "en"));
    expect(stored).toMatchObject({ value: "Machine words", origin: "auto" });
  });

  it("ha a magyar szöveg közben megváltozott, kihagyja; a régi fordítás „Elavult” lesz", async () => {
    const [hobby] = await db.select().from(hobbies).limit(1);
    const key = contentKey("hobbies", hobby.id, "title");
    const oldHash = sourceHash(hobby.title);
    await importResults(db, [{ key, locale: "en", sourceHash: oldHash, text: "Old title" }]);
    expect(await status(key, "en")).toBe("auto");

    await db.update(hobbies).set({ title: `${hobby.title} (új)` }).where(eq(hobbies.id, hobby.id));
    expect(await status(key, "en")).toBe("outdated");
    const report = await importResults(db, [{ key, locale: "es", sourceHash: oldHash, text: "Título" }]);
    expect(report.skipped[0].reason).toMatch(/megváltozott/);

    // A „minden hiányzó” kiírás a gépi elavultat is újrakéri.
    const all = await buildExport(db, { all: true, only: ["en"] });
    expect(all.items.find((item) => item.key === key)?.targets[0]).toMatchObject({ locale: "en", previous: "Old title" });
  });

  it("a jogi szövegből nem hiányozhat {{HELYŐRZŐ}}, az egysoros mezőbe nem kerül sortörés", async () => {
    const legal = await field("legal_docs:privacy:bodyMd");
    const broken = await importResults(db, [{ key: legal.key, locale: "en", sourceHash: sourceHash(legal.source), text: "## Privacy\n\nNo tokens here." }]);
    expect(broken.skipped[0].reason).toMatch(/hiányzik belőle/);

    const title = await field("settings:general:headerTitle");
    await importResults(db, [{ key: title.key, locale: "is", sourceHash: sourceHash(title.source), text: "Fyrsta\nvefsíðan" }]);
    const stored = indexStored(await readStoredTranslations(db, "is")).get(requestId(title.key, "is"));
    expect(stored?.value).toBe("Fyrsta vefsíðan");
  });

  it("egy elem törlésekor a fordításai és a kérései is törlődnek", async () => {
    const [hobby] = await db.select().from(hobbies).limit(1);
    const key = contentKey("hobbies", hobby.id, "title");
    await addTranslationRequest(db, key, "hr");
    await deleteItem(db, "hobbies", hobby.id);
    const left = await db.select().from(contentTranslations).where(eq(contentTranslations.entityId, String(hobby.id)));
    expect(left.filter((row) => row.entity === "hobbies")).toEqual([]);
    const requests = await db.select().from(translationRequests).where(eq(translationRequests.entity, "hobbies"));
    expect(requests).toEqual([]);
  });

  it("a lábléc linkjeinek fordítása a linkkel együtt költözik", async () => {
    const put = (index: number, value: string) =>
      writeContentTranslation(db, { key: `settings:footer:links.${index}.label`, locale: "en", value, origin: "manual", source: value });
    await put(0, "YouTube EN");
    await put(1, "Instagram EN");
    await remapFooterLinkTranslations(db, ["YouTube", "Instagram"], ["Instagram"]);
    const rows = (await readStoredTranslations(db, "en")).filter((row) => row.key.startsWith("settings:footer:links."));
    expect(rows.map((row) => [row.key, row.value])).toEqual([["settings:footer:links.0.label", "Instagram EN"]]);
  });
});
