import path from "node:path";
import { migrate } from "drizzle-orm/libsql/migrator";
import type { Db } from "./client";

/** Lefuttatja a még hiányzó migrációkat (többször is biztonságosan hívható). */
export async function runMigrations(db: Db): Promise<void> {
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
}
