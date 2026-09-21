/**
 * `npm run db:stats` – kiírja, melyik táblában hány sor van (hibakereséshez).
 */
import { loadEnvConfig } from "@next/env";
import { createDb } from "../src/db/client";

const TABLES = [
  "settings",
  "locales",
  "translations",
  "pages",
  "media",
  "hobbies",
  "games",
  "youtube_items",
  "football_sections",
  "football_players",
  "football_moments",
  "football_facts",
  "generic_items",
  "legal_docs",
  "admin_users",
  "login_attempts",
  "audit_log",
  "content_translations",
  "translation_requests",
];

async function main() {
  loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error });
  const { client } = createDb();
  for (const table of TABLES) {
    const result = await client.execute(`SELECT COUNT(*) AS n FROM ${table}`);
    console.log(`${table.padEnd(22)} ${String(result.rows[0].n).padStart(5)}`);
  }
  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
