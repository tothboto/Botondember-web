import { getDb } from "@/db/client";
import { settings } from "@/db/schema";
import { cached } from "@/lib/cache";
import { parseSetting, SETTING_KEYS, type SettingKey, type SettingValue } from "@/lib/settings";

export type AllSettings = { [K in SettingKey]: SettingValue<K> };

/** Az összes beállítás nyersen, közvetlenül az adatbázisból (az Adminnak). */
export async function readAllSettings(): Promise<AllSettings> {
  const rows = await getDb().select().from(settings);
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  return Object.fromEntries(SETTING_KEYS.map((key) => [key, parseSetting(key, byKey.get(key))])) as AllSettings;
}

/** Az összes beállítás (gyorsítótárazva, a publikus oldalaknak). */
export const getAllSettings = cached(readAllSettings, ["settings"]);
