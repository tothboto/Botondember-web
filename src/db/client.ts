import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type Db = LibSQLDatabase<typeof schema>;

const DEFAULT_URL = "file:./data/site.db";

/** Az adatbázis címe: helyben egy SQLite fájl, élesben lehet pl. Turso (libSQL). */
export function databaseUrl(): string {
  return process.env.DATABASE_URL?.trim() || DEFAULT_URL;
}

/** Helyi fájlnál a mappának léteznie kell, különben a libSQL nem tudja létrehozni a fájlt. */
function ensureLocalDir(url: string): void {
  if (!url.startsWith("file:")) return;
  const filePath = url.slice("file:".length);
  if (!filePath || filePath.includes(":memory:")) return;
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
}

export function createDb(
  url: string = databaseUrl(),
  authToken: string | undefined = process.env.DATABASE_AUTH_TOKEN?.trim() || undefined,
): { db: Db; client: Client } {
  ensureLocalDir(url);
  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });
  return { db, client };
}

const globalForDb = globalThis as unknown as {
  __botondemberDb?: { db: Db; client: Client; url: string };
};

/**
 * Egyetlen közös kapcsolat a futó alkalmazásban (fejlesztés közben az
 * újratöltések sem nyitnak újabb és újabb kapcsolatot).
 */
export function getDb(): Db {
  const url = databaseUrl();
  const cached = globalForDb.__botondemberDb;
  if (cached && cached.url === url) return cached.db;
  const { db, client } = createDb(url);
  globalForDb.__botondemberDb = { db, client, url };
  return db;
}
