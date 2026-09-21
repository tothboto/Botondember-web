/**
 * Mentés és visszaállítás: az oldal teljes tartalma egyetlen ZIP fájlban.
 *
 * A ZIP tartalma:
 *   mentes.json      – az adatbázis tartalma (táblánként egy lista)
 *   fajlok/<kulcs>   – a képek és a favicon-készlet
 *   OLVASS-EL.txt    – rövid magyarázat
 *
 * A belépési adatok (admin felhasználó, jelszó-hash, belépési kísérletek) SOHA
 * nem kerülnek a mentésbe, és visszaállításkor sem íródnak felül.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { getTableColumns } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from "fflate";
import { z } from "zod";
import type { Db } from "@/db/client";
import * as schema from "@/db/schema";
import { FAVICON_FILES, faviconKey } from "@/lib/media/favicon";
import { detectImageType } from "@/lib/media/process";
import { isSafeKey, type MediaStorage } from "@/lib/media/storage";
import { parseSetting } from "@/lib/settings";

export const BACKUP_FORMAT = "botondember-mentes";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 500 * 1024 * 1024;
const MAX_ENTRIES = 20_000;
const MAX_UNPACKED_BYTES = 2 * 1024 * 1024 * 1024;
const DATA_FILE = "mentes.json";
const FILES_DIR = "fajlok/";
const AUTO_BACKUP_KEEP = 5;

/** A mentésbe kerülő táblák – ebben a sorrendben töltődnek vissza. */
const TABLES = {
  settings: schema.settings,
  locales: schema.locales,
  translations: schema.translations,
  contentTranslations: schema.contentTranslations,
  translationRequests: schema.translationRequests,
  media: schema.media,
  pages: schema.pages,
  hobbies: schema.hobbies,
  games: schema.games,
  youtubeItems: schema.youtubeItems,
  footballSections: schema.footballSections,
  footballPlayers: schema.footballPlayers,
  footballMoments: schema.footballMoments,
  footballFacts: schema.footballFacts,
  genericItems: schema.genericItems,
  legalDocs: schema.legalDocs,
  auditLog: schema.auditLog,
} satisfies Record<string, SQLiteTable>;

type TableName = keyof typeof TABLES;
const TABLE_NAMES = Object.keys(TABLES) as TableName[];
/** Később bevezetett táblák: a régebbi mentésekből hiányozhatnak (ilyenkor üresek lesznek). */
const OPTIONAL_TABLES: ReadonlySet<TableName> = new Set(["translationRequests"]);

type Row = Record<string, unknown>;

/** Barátságos (magyar) hibaüzenet a visszaállításnál. */
export class BackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupError";
  }
}

export function backupsDir(): string {
  return path.resolve(/*turbopackIgnore: true*/ process.env.BACKUPS_DIR?.trim() || "./data/backups");
}

/** A képek és a favicon-fájlok kulcsai, amelyekre a tartalom hivatkozik. */
function referencedFiles(tables: Record<TableName, Row[]>): { media: string[]; favicon: string[] } {
  const media = tables.media.map((row) => String(row.path));
  const general = parseSetting("general", tables.settings.find((row) => row.key === "general")?.value);
  const versions = ["default", ...(general.faviconVersion ? [general.faviconVersion] : [])];
  const favicon = versions.flatMap((version) => FAVICON_FILES.map((file) => faviconKey(version, file)));
  return { media, favicon };
}

const README = `Botondember első weboldala – mentés

Ez a fájl az oldal teljes tartalmát tartalmazza: a szövegeket, a beállításokat,
a fordításokat és a képeket. A belépési adatok (felhasználónév, jelszó) NINCSENEK benne.

Visszaállítás: Admin > Mentés és visszaállítás > Visszaállítás mentésből.
Ne csomagold ki és ne módosítsd a fájlokat benne, különben nem tölthető vissza.
`;

/** Az oldal teljes tartalmának mentése egy ZIP fájlba (a memóriában). */
export async function createBackup(
  db: Db,
  storage: MediaStorage,
): Promise<{ zip: Uint8Array; rows: number; files: number; missingFiles: string[] }> {
  const tables = {} as Record<TableName, Row[]>;
  let rows = 0;
  for (const name of TABLE_NAMES) {
    tables[name] = (await db.select().from(TABLES[name])) as Row[];
    rows += tables[name].length;
  }

  const payload = { format: BACKUP_FORMAT, version: BACKUP_VERSION, createdAt: Date.now(), tables };
  const zippable: Zippable = {
    [DATA_FILE]: [strToU8(JSON.stringify(payload)), { level: 6 }],
    "OLVASS-EL.txt": [strToU8(README), { level: 6 }],
  };

  const { media, favicon } = referencedFiles(tables);
  const missingFiles: string[] = [];
  let files = 0;
  for (const key of new Set([...media, ...favicon])) {
    const data = await storage.get(key);
    if (!data) {
      if (media.includes(key)) missingFiles.push(key);
      continue;
    }
    // A képek már tömörítettek (WEBP/PNG), ezért csak „betesszük” őket.
    zippable[FILES_DIR + key] = [new Uint8Array(data), { level: 0 }];
    files++;
  }
  return { zip: zipSync(zippable), rows, files, missingFiles };
}

/** A mentés fájlneve, pl. `botondember-mentes-2026-09-19-1342.zip`. */
export function backupFileName(prefix = "botondember-mentes", date = new Date()): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${prefix}-${get("year")}-${get("month")}-${get("day")}-${get("hour")}${get("minute")}${get("second")}.zip`;
}

/* ------------------------------------------------------------------------- */
/* Visszaállítás                                                              */
/* ------------------------------------------------------------------------- */

const headerSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number().int().min(1).max(BACKUP_VERSION),
  createdAt: z.number(),
  tables: z.record(z.string(), z.array(z.unknown())),
});

function isPlainObject(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Egy sor ellenőrzése a tábla oszlopai alapján (típusok, kötelező mezők). */
function cleanRow(tableName: TableName, row: unknown, index: number): { row: Row; dropped: number } {
  const where = `${tableName} ${index + 1}. sora`;
  if (!isPlainObject(row)) throw new BackupError(`Hibás adat a mentésben (${where}).`);
  const columns = getTableColumns(TABLES[tableName]) as Record<
    string,
    { dataType: string; notNull: boolean; hasDefault: boolean }
  >;
  const clean: Row = {};
  for (const [prop, column] of Object.entries(columns)) {
    const value = row[prop];
    if (value === undefined || value === null) {
      if (column.notNull && !column.hasDefault) throw new BackupError(`Hiányzó adat a mentésben: ${where}, „${prop}”.`);
      if (!column.notNull) clean[prop] = null;
      continue;
    }
    const ok =
      column.dataType === "json" ||
      (column.dataType === "number" && typeof value === "number" && Number.isFinite(value)) ||
      (column.dataType === "string" && typeof value === "string" && value.length <= 200_000) ||
      (column.dataType === "boolean" && typeof value === "boolean");
    if (!ok) throw new BackupError(`Hibás adattípus a mentésben: ${where}, „${prop}”.`);
    clean[prop] = value;
  }
  const dropped = Object.keys(row).filter((key) => !(key in columns)).length;
  return { row: clean, dropped };
}

export type RestoreReport = {
  rows: number;
  files: number;
  warnings: string[];
  safetyBackup: string | null;
};

/**
 * Visszaállítás egy mentésből. Lépések: ellenőrzés → automatikus biztonsági
 * mentés a jelenlegi állapotról → fájlok → adatbázis (egy tranzakcióban) →
 * a már nem használt fájlok törlése.
 */
export async function restoreBackup(
  db: Db,
  storage: MediaStorage,
  input: Uint8Array,
  options: { safetyDir?: string | null } = {},
): Promise<RestoreReport> {
  if (input.length > MAX_BACKUP_BYTES) throw new BackupError("A mentésfájl túl nagy (legfeljebb 500 MB lehet).");

  // 1) Kicsomagolás – csak az ismert fájlnevek, méretkorláttal (ZIP-bomba ellen).
  let entries: Record<string, Uint8Array>;
  let count = 0;
  let unpacked = 0;
  try {
    entries = unzipSync(input, {
      filter: (file) => {
        count++;
        unpacked += file.originalSize;
        if (count > MAX_ENTRIES || unpacked > MAX_UNPACKED_BYTES) throw new BackupError("A mentés túl nagy vagy sérült.");
        if (file.name === DATA_FILE) return true;
        return file.name.startsWith(FILES_DIR) && isSafeKey(file.name.slice(FILES_DIR.length));
      },
    });
  } catch (error) {
    if (error instanceof BackupError) throw error;
    throw new BackupError("Ez nem egy érvényes mentésfájl (ZIP). Az Admin > Mentés és visszaállítás oldalon letöltött fájlt töltsd fel!");
  }

  // 2) Az adatok ellenőrzése.
  const dataFile = entries[DATA_FILE];
  if (!dataFile) throw new BackupError("A ZIP fájlban nincs mentés (hiányzik a mentes.json).");
  let parsed: z.infer<typeof headerSchema>;
  try {
    parsed = headerSchema.parse(JSON.parse(strFromU8(dataFile)));
  } catch {
    throw new BackupError("Ez a fájl nem ennek az oldalnak a mentése, vagy sérült.");
  }

  const warnings: string[] = [];
  const tables = {} as Record<TableName, Row[]>;
  let droppedFields = 0;
  let rows = 0;
  for (const name of TABLE_NAMES) {
    const list = parsed.tables[name] ?? (OPTIONAL_TABLES.has(name) ? [] : null);
    if (!list) throw new BackupError(`Hiányos mentés: hiányzik a(z) „${name}” adatcsoport.`);
    tables[name] = list.map((row, index) => {
      const result = cleanRow(name, row, index);
      droppedFields += result.dropped;
      return result.row;
    });
    rows += list.length;
  }
  if (!tables.locales.some((row) => row.enabled === true)) throw new BackupError("Hibás mentés: nincs benne egyetlen bekapcsolt nyelv sem.");
  if (droppedFields > 0) warnings.push(`${droppedFields} ismeretlen mező kimaradt (a mentés egy másik programváltozatból származhat).`);

  // A képek: mindegyiknek benne kell lennie a ZIP-ben, és valódi képnek kell lennie.
  const files = new Map<string, Uint8Array>();
  for (const key of referencedFiles(tables).media) {
    const data = entries[FILES_DIR + key];
    if (!isSafeKey(key) || !data) throw new BackupError(`Hiányos mentés: hiányzik egy kép (${key}).`);
    if (!detectImageType(data)) throw new BackupError(`Hibás fájl a mentésben: ${key} nem kép.`);
    files.set(key, data);
  }
  // Favicon: a feltöltött készlet csak teljesen és hibátlanul állítható vissza.
  const validFile = (key: string) => {
    const data = entries[FILES_DIR + key];
    return data && detectImageType(data) ? data : null;
  };
  const settingsRow = tables.settings.find((row) => row.key === "general");
  const general = parseSetting("general", settingsRow?.value);
  if (general.faviconVersion) {
    const keys = FAVICON_FILES.map((file) => faviconKey(general.faviconVersion as string, file));
    if (keys.every(validFile)) {
      for (const key of keys) files.set(key, validFile(key) as Uint8Array);
    } else {
      if (settingsRow) settingsRow.value = { ...general, faviconVersion: null };
      warnings.push("A mentésből hiányzott a feltöltött favicon – a beépített „B” ikon lesz érvényes.");
    }
  }
  for (const file of FAVICON_FILES) {
    const key = faviconKey("default", file);
    const data = validFile(key);
    if (data) files.set(key, data);
  }

  // 3) Biztonsági mentés a jelenlegi állapotról (hogy a visszaállítás is visszavonható legyen).
  let safetyBackup: string | null = null;
  if (options.safetyDir !== null) {
    const dir = options.safetyDir ?? backupsDir();
    await fs.mkdir(dir, { recursive: true });
    const current = await createBackup(db, storage);
    safetyBackup = backupFileName("automatikus-mentes");
    await fs.writeFile(path.join(dir, safetyBackup), current.zip);
    const old = (await fs.readdir(dir)).filter((name) => /^automatikus-mentes-[\d-]+\.zip$/.test(name)).sort();
    for (const name of old.slice(0, Math.max(0, old.length - AUTO_BACKUP_KEEP))) await fs.rm(path.join(dir, name), { force: true });
  }

  // 4) Fájlok (előbb ezek – így az adatbázis sosem hivatkozik hiányzó képre).
  for (const [key, data] of files) await storage.put(key, Buffer.from(data));

  // 5) Adatbázis – egyetlen tranzakcióban: vagy minden sikerül, vagy semmi sem változik.
  await db.transaction(async (tx) => {
    for (const name of [...TABLE_NAMES].reverse()) await tx.delete(TABLES[name]);
    for (const name of TABLE_NAMES) {
      const list = tables[name];
      for (let i = 0; i < list.length; i += 100) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- a sorokat fent oszloponként ellenőriztük
        await tx.insert(TABLES[name]).values(list.slice(i, i + 100) as any);
      }
    }
  });

  // 6) A már nem használt képek törlése (a biztonsági mentésben megmaradnak).
  //    A beépített favicon-készlet (favicon/default) mindig megmarad.
  for (const prefix of ["img/", "yt/", "placeholders/", "favicon/"]) {
    for (const key of await storage.list(prefix)) {
      if (!files.has(key) && !key.startsWith("favicon/default/")) await storage.delete(key);
    }
  }

  return { rows, files: files.size, warnings, safetyBackup };
}

/** Az automatikus biztonsági mentések listája (legújabb elöl). */
export async function listSafetyBackups(dir = backupsDir()): Promise<{ name: string; size: number; createdAt: number }[]> {
  try {
    const names = (await fs.readdir(dir)).filter((name) => /^automatikus-mentes-[\d-]+\.zip$/.test(name));
    const list = await Promise.all(
      names.map(async (name) => {
        const stat = await fs.stat(path.join(dir, name));
        return { name, size: stat.size, createdAt: stat.mtimeMs };
      }),
    );
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

/** Egy automatikus biztonsági mentés beolvasása (csak érvényes fájlnévvel). */
export async function readSafetyBackup(name: string, dir = backupsDir()): Promise<Uint8Array | null> {
  if (!/^automatikus-mentes-[\d-]+\.zip$/.test(name)) return null;
  try {
    return new Uint8Array(await fs.readFile(path.join(dir, name)));
  } catch {
    return null;
  }
}
