/** Kis segédfüggvények az Admin mentésekhez (beállítások, fordítások). */
import { and, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { settings, translations } from "@/db/schema";
import { settingSchemas, type SettingKey, type SettingValue } from "@/lib/settings";

export async function writeSetting<K extends SettingKey>(db: Db, key: K, value: SettingValue<K>): Promise<void> {
  const parsed = settingSchemas[key].parse(value);
  await db
    .insert(settings)
    .values({ key, value: parsed, updatedAt: Date.now() })
    .onConflictDoUpdate({ target: settings.key, set: { value: parsed, updatedAt: Date.now() } });
}

/** Fordítás mentése; üres értéknél törli (így a magyar szöveg jelenik meg helyette). */
export async function writeTranslation(db: Db, key: string, locale: string, value: string): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) {
    await db.delete(translations).where(and(eq(translations.key, key), eq(translations.locale, locale)));
    return;
  }
  await db
    .insert(translations)
    .values({ key, locale, value: trimmed, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: [translations.key, translations.locale],
      set: { value: trimmed, updatedAt: Date.now() },
    });
}
