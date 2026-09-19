import { defineConfig } from "drizzle-kit";

/**
 * A migrációs fájlokat a `drizzle/` mappába generálja (`npm run db:generate`).
 * A migrációkat az `npm run setup` (és az `npm run dev` előtt a `predev`) futtatja le.
 */
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
