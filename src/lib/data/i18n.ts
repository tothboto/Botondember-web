import { asc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { locales, translations } from "@/db/schema";
import { cached } from "@/lib/cache";

export async function readLocales() {
  return getDb().select().from(locales).orderBy(asc(locales.sort), asc(locales.code));
}

export async function readTranslationRows() {
  return getDb()
    .select({ key: translations.key, locale: translations.locale, value: translations.value })
    .from(translations);
}

export const getLocales = cached(readLocales, ["locales"]);
export const getTranslationRows = cached(readTranslationRows, ["translations"]);
