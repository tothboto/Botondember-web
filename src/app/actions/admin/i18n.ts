"use server";

import fs from "node:fs";
import path from "node:path";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { locales, translations } from "@/db/schema";
import { logActivity } from "@/lib/audit";
import { runAdmin, UserError, type ActionResult } from "@/lib/admin/result";
import { writeSetting, writeTranslation } from "@/lib/admin/store";
import { invalidateContent } from "@/lib/cache";
import { SEED_MESSAGES, SOURCE_LOCALE } from "@/lib/i18n/messages";
import { missingPlaceholders } from "@/lib/i18n/translate";

const localeCode = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/, "A nyelvkód 2–3 kisbetű (pl. fr, pt), esetleg régióval (pl. pt-br).");

const changesInput = z
  .array(
    z.object({
      key: z.string().regex(/^[A-Za-z0-9_.-]{1,120}$/, "Érvénytelen kulcs."),
      locale: localeCode,
      value: z.string().max(500, "Egy szöveg legfeljebb 500 karakter lehet."),
    }),
  )
  .max(2000);

async function requireLocale(code: string) {
  const [row] = await getDb().select().from(locales).where(eq(locales.code, code));
  if (!row) throw new UserError("Ez a nyelv már nem létezik – frissítsd az oldalt!");
  return row;
}

/** Több fordítás mentése egyszerre. Az üres szöveg törli a fordítást (helyette a magyar jelenik meg). */
export async function saveTranslations(input: unknown): Promise<ActionResult<{ saved: number }>> {
  return runAdmin(async () => {
    const changes = changesInput.parse(input);
    const db = getDb();
    const known = new Set((await db.select({ code: locales.code }).from(locales)).map((l) => l.code));
    const huRows = await db
      .select({ key: translations.key, value: translations.value })
      .from(translations)
      .where(eq(translations.locale, SOURCE_LOCALE));
    const huSource = (key: string) => SEED_MESSAGES[key]?.hu ?? huRows.find((r) => r.key === key)?.value ?? "";

    for (const change of changes) {
      if (!known.has(change.locale)) throw new UserError(`Ismeretlen nyelv: ${change.locale}`);
      const value = change.value.trim();
      if (!value) continue;
      const missing = missingPlaceholders(huSource(change.key), value);
      if (missing.length > 0) {
        throw new UserError(
          `A(z) „${change.key}” szövegből (${change.locale}) hiányzik: ${missing.map((m) => `{${m}}`).join(", ")}. Ezeket a jeleket hagyd benne – ide kerül majd a szám vagy a név.`,
        );
      }
    }
    for (const change of changes) await writeTranslation(db, change.key, change.locale, change.value);
    await logActivity(db, "Fordítások", `${changes.length} szöveg mentve`);
    invalidateContent();
    return { saved: changes.length };
  });
}

export async function setShowFlags(show: boolean): Promise<ActionResult> {
  return runAdmin(async () => {
    const db = getDb();
    await writeSetting(db, "i18n", { showFlags: show === true });
    await logActivity(db, "Fordítások", show ? "Nyelvválasztó zászlók bekapcsolva" : "Nyelvválasztó zászlók kikapcsolva");
    invalidateContent();
    return null;
  });
}

export async function setLocaleEnabled(code: string, enabled: boolean): Promise<ActionResult> {
  return runAdmin(async () => {
    const locale = await requireLocale(localeCode.parse(code));
    if (!enabled && locale.isDefault) throw new UserError("Az alapnyelvet nem lehet kikapcsolni – előbb válassz másik alapnyelvet.");
    const db = getDb();
    await db.update(locales).set({ enabled: enabled === true }).where(eq(locales.code, locale.code));
    await logActivity(db, "Fordítások", `${locale.name}: ${enabled ? "bekapcsolva" : "kikapcsolva"}`);
    invalidateContent();
    return null;
  });
}

export async function setDefaultLocale(code: string): Promise<ActionResult> {
  return runAdmin(async () => {
    const locale = await requireLocale(localeCode.parse(code));
    if (!locale.enabled) throw new UserError("Csak bekapcsolt nyelv lehet az alapnyelv.");
    const db = getDb();
    await db.update(locales).set({ isDefault: false });
    await db.update(locales).set({ isDefault: true }).where(eq(locales.code, locale.code));
    await logActivity(db, "Fordítások", `Új alapnyelv: ${locale.name}`);
    invalidateContent();
    return null;
  });
}

export async function moveLocale(code: string, direction: "up" | "down"): Promise<ActionResult> {
  return runAdmin(async () => {
    const locale = await requireLocale(localeCode.parse(code));
    const db = getDb();
    const codes = (await db.select({ code: locales.code }).from(locales).orderBy(asc(locales.sort), asc(locales.code))).map(
      (l) => l.code,
    );
    const index = codes.indexOf(locale.code);
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= codes.length) return null;
    [codes[index], codes[target]] = [codes[target], codes[index]];
    for (let i = 0; i < codes.length; i++) await db.update(locales).set({ sort: i + 1 }).where(eq(locales.code, codes[i]));
    invalidateContent();
    return null;
  });
}

const newLocaleInput = z.object({
  code: localeCode,
  name: z.string().trim().min(1, "Add meg a nyelv nevét (pl. Français)!").max(40),
  flag: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{2}(-[a-z]{2,5})?$/, "A zászló kódja egy ország kétbetűs kódja (pl. fr, it, gb)."),
});

function flagExists(flag: string): boolean {
  return fs.existsSync(path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "flags", `${flag}.svg`));
}

/** Új nyelv felvétele – kikapcsolva jön létre, hogy a látogatók ne lássanak félkész fordítást. */
export async function addLocale(input: unknown): Promise<ActionResult> {
  return runAdmin(async () => {
    const value = newLocaleInput.parse(input);
    if (!flagExists(value.flag)) throw new UserError(`Nincs ilyen zászló: „${value.flag}”. Az ország kétbetűs kódját add meg (pl. fr).`, "flag");
    const db = getDb();
    const existing = await db.select({ code: locales.code, sort: locales.sort }).from(locales);
    if (existing.some((l) => l.code === value.code)) throw new UserError("Ez a nyelv már szerepel a listában.", "code");
    await db.insert(locales).values({
      code: value.code,
      name: value.name,
      flag: value.flag,
      enabled: false,
      isDefault: false,
      sort: Math.max(0, ...existing.map((l) => l.sort)) + 1,
    });
    await logActivity(db, "Fordítások", `Új nyelv: ${value.name}`);
    invalidateContent();
    return null;
  });
}

export async function deleteLocale(code: string): Promise<ActionResult> {
  return runAdmin(async () => {
    const locale = await requireLocale(localeCode.parse(code));
    if (locale.code === SOURCE_LOCALE) throw new UserError("A magyar nyelvet nem lehet törölni – ez minden szöveg alapja.");
    if (locale.isDefault) throw new UserError("Az alapnyelvet nem lehet törölni – előbb válassz másik alapnyelvet.");
    const db = getDb();
    await db.delete(translations).where(eq(translations.locale, locale.code));
    await db.delete(locales).where(eq(locales.code, locale.code));
    await logActivity(db, "Fordítások", `Nyelv törölve: ${locale.name}`);
    invalidateContent();
    return null;
  });
}
