"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, type Db } from "@/db/client";
import { locales } from "@/db/schema";
import { logActivity } from "@/lib/audit";
import { runAdmin, UserError, type ActionResult } from "@/lib/admin/result";
import { invalidateContent } from "@/lib/cache";
import { listContentFields, type ContentField } from "@/lib/content-i18n/registry";
import { lostTokens } from "@/lib/content-i18n/status";
import {
  addTranslationRequest,
  deleteContentTranslation,
  indexStored,
  needsMachineTranslation,
  readRequestSet,
  readStoredTranslations,
  removeTranslationRequest,
  requestId,
  statusOf,
  writeContentTranslation,
} from "@/lib/content-i18n/store";
import { SOURCE_LOCALE } from "@/lib/i18n/messages";

const AREA = "Saját szövegek fordítása";

const localeCode = z.string().trim().toLowerCase().regex(/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/, "Érvénytelen nyelvkód.");
const fieldKey = z.string().regex(/^[a-z_]+:[a-z0-9_-]+:[A-Za-z0-9_.]+$/, "Érvénytelen szövegazonosító.");
const target = z.object({ key: fieldKey, locale: localeCode });

async function requireTargetLocale(db: Db, code: string) {
  if (code === SOURCE_LOCALE) throw new UserError("A magyar az eredeti nyelv – azt a saját szerkesztőjében módosíthatod.");
  const [row] = await db.select().from(locales).where(eq(locales.code, code));
  if (!row) throw new UserError("Ez a nyelv már nem létezik – frissítsd az oldalt!");
  return row;
}

/** A fordítható mezők kulcs szerint (a törölt / kiürült mezőkre hibát ad). */
async function fieldMap(db: Db): Promise<Map<string, ContentField>> {
  return new Map((await listContentFields(db)).map((field) => [field.key, field]));
}

function requireField(fields: Map<string, ContentField>, key: string): ContentField {
  const field = fields.get(key);
  if (!field) throw new UserError("Ez a szöveg közben megváltozott vagy törlődött – frissítsd az oldalt!");
  return field;
}

const saveInput = z.object({
  locale: localeCode,
  items: z.array(z.object({ key: fieldKey, value: z.string().max(80_000) })).min(1).max(2000),
});

/** Kézzel írt / javított fordítások mentése („Kész” lesz). Az üres szöveg törli a fordítást. */
export async function saveContentTranslations(input: unknown): Promise<ActionResult<{ saved: number }>> {
  return runAdmin(async () => {
    const { locale, items } = saveInput.parse(input);
    const db = getDb();
    const language = await requireTargetLocale(db, locale);
    const fields = await fieldMap(db);
    for (const item of items) {
      const field = requireField(fields, item.key);
      if (item.value.length > field.maxLength) {
        throw new UserError(`„${field.label}”: a fordítás legfeljebb ${field.maxLength} karakter lehet.`);
      }
      const lost = item.value.trim() ? lostTokens(field.source, item.value) : [];
      if (lost.length > 0) {
        throw new UserError(
          `„${field.label}”: hiányzik a fordításból: ${lost.map((t) => `{{${t}}}`).join(", ")}. Ezeket a jeleket hagyd benne – ide kerülnek az Adminban megadott adatok.`,
        );
      }
    }
    for (const item of items) {
      const field = requireField(fields, item.key);
      await writeContentTranslation(db, { key: item.key, locale, value: item.value, origin: "manual", source: field.source });
    }
    await logActivity(db, AREA, `${language.name}: ${items.length} szöveg mentve`);
    invalidateContent();
    return { saved: items.length };
  });
}

/** A gépi (vagy elavult) fordítás jóváhagyása: így ahogy van, jó („Kész” lesz). */
export async function approveContentTranslation(input: unknown): Promise<ActionResult> {
  return runAdmin(async () => {
    const { key, locale } = target.parse(input);
    const db = getDb();
    await requireTargetLocale(db, locale);
    const field = requireField(await fieldMap(db), key);
    const stored = indexStored(await readStoredTranslations(db, locale)).get(requestId(key, locale));
    if (!stored || stored.origin === "keep" || !stored.value.trim()) throw new UserError("Ehhez a szöveghez még nincs fordítás, amit jóvá lehetne hagyni.");
    await writeContentTranslation(db, { key, locale, value: stored.value, origin: "manual", source: field.source });
    await logActivity(db, AREA, `Jóváhagyva: ${field.label} (${locale})`);
    invalidateContent();
    return null;
  });
}

/** A szöveg ezen a nyelven is maradjon az eredeti (pl. egy név vagy márkanév). */
export async function keepContentOriginal(input: unknown): Promise<ActionResult> {
  return runAdmin(async () => {
    const { key, locale } = target.parse(input);
    const db = getDb();
    await requireTargetLocale(db, locale);
    const field = requireField(await fieldMap(db), key);
    await writeContentTranslation(db, { key, locale, value: "", origin: "keep", source: field.source });
    await logActivity(db, AREA, `Magyarul marad: ${field.label} (${locale})`);
    invalidateContent();
    return null;
  });
}

/** „Mégis lefordítom”: a „Magyarul marad” jelölés törlése. */
export async function undoKeepOriginal(input: unknown): Promise<ActionResult> {
  return runAdmin(async () => {
    const { key, locale } = target.parse(input);
    const db = getDb();
    await requireTargetLocale(db, locale);
    const stored = indexStored(await readStoredTranslations(db, locale)).get(requestId(key, locale));
    if (stored?.origin === "keep") await deleteContentTranslation(db, key, locale);
    invalidateContent();
    return null;
  });
}

/** Egy szöveg (gépi) fordításának kérése – a következő `/forditas` futtatáskor készül el. */
export async function requestContentTranslation(input: unknown): Promise<ActionResult> {
  return runAdmin(async () => {
    const { key, locale } = target.parse(input);
    const db = getDb();
    await requireTargetLocale(db, locale);
    const field = requireField(await fieldMap(db), key);
    await addTranslationRequest(db, key, locale);
    await logActivity(db, AREA, `Fordítás kérve: ${field.label} (${locale})`);
    return null;
  });
}

export async function cancelContentTranslationRequest(input: unknown): Promise<ActionResult> {
  return runAdmin(async () => {
    const { key, locale } = target.parse(input);
    const db = getDb();
    await requireTargetLocale(db, locale);
    await removeTranslationRequest(db, key, locale);
    return null;
  });
}

const bulkInput = z.object({ locale: z.union([localeCode, z.literal("all")]) });

/**
 * Minden hiányzó és (gépi fordítású) elavult szöveg fordításának kérése egy
 * nyelvre, vagy az összes bekapcsolt idegen nyelvre (`all`).
 * A kézzel írt fordításokat nem kéri újra – azokat a gép nem írja felül.
 */
export async function requestMissingTranslations(input: unknown): Promise<ActionResult<{ requested: number }>> {
  return runAdmin(async () => {
    const { locale } = bulkInput.parse(input);
    const db = getDb();
    let codes: string[];
    if (locale === "all") {
      codes = (await db.select().from(locales)).filter((l) => l.enabled && l.code !== SOURCE_LOCALE).map((l) => l.code);
    } else {
      codes = [(await requireTargetLocale(db, locale)).code];
    }
    const [fields, stored, requests] = await Promise.all([listContentFields(db), readStoredTranslations(db), readRequestSet(db)]);
    const index = indexStored(stored);
    let requested = 0;
    for (const code of codes) {
      for (const field of fields) {
        const status = statusOf(field.source, index, requests, field.key, code);
        if (!needsMachineTranslation(status, index.get(requestId(field.key, code)))) continue;
        await addTranslationRequest(db, field.key, code);
        requested++;
      }
    }
    if (requested > 0) await logActivity(db, AREA, `${requested} szöveg fordítása kérve (${locale === "all" ? "minden nyelv" : locale})`);
    return { requested };
  });
}
