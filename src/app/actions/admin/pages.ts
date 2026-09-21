"use server";

import crypto from "node:crypto";
import { and, asc, eq, like, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { genericItems, locales, pages, translations } from "@/db/schema";
import { logActivity } from "@/lib/audit";
import { runAdmin, UserError, type ActionResult } from "@/lib/admin/result";
import { hexColor } from "@/lib/settings";
import { mediaId, required, slugSchema, text } from "@/lib/admin/schemas";
import { writeTranslation } from "@/lib/admin/store";
import { invalidateContent } from "@/lib/cache";
import { deleteContentForEntity } from "@/lib/content-i18n/store";
import { pageMenuKey, pageTitleKey } from "@/lib/data/pages";
import { SOURCE_LOCALE } from "@/lib/i18n/messages";
import { isKnownIcon } from "@/lib/icons";
import { assertMediaExists, updateAlts } from "@/lib/media/library";

const pageId = z.number().int().positive();
const iconName = z.string().refine(isKnownIcon, "Ismeretlen ikon.");

async function requirePage(id: number) {
  const [page] = await getDb().select().from(pages).where(eq(pages.id, id));
  if (!page) throw new UserError("Ez az aloldal már nem létezik – frissítsd az oldalt!");
  return page;
}

async function assertSlugFree(slug: string, exceptId: number | null) {
  const rows = await getDb()
    .select({ id: pages.id })
    .from(pages)
    .where(exceptId ? and(eq(pages.slug, slug), ne(pages.id, exceptId)) : eq(pages.slug, slug));
  if (rows.length > 0) throw new UserError("Ez az URL-cím már foglalt – válassz másikat!");
}

const contentInput = z.object({
  introMd: text(2000),
  bodyMd: text(20_000),
  seoDescription: text(300),
  heroMediaId: mediaId,
});

/** Egy aloldal tartalma: bevezető, (Általános sablonnál) szöveg, kép, keresőknek szóló leírás. */
export async function savePageContent(id: number, input: unknown, alts?: Record<string, string>): Promise<ActionResult> {
  return runAdmin(async () => {
    const page = await requirePage(pageId.parse(id));
    const value = contentInput.parse(input);
    const db = getDb();
    await assertMediaExists(db, value.heroMediaId);
    await db.update(pages).set({ ...value, updatedAt: Date.now() }).where(eq(pages.id, page.id));
    await updateAlts(db, alts);
    await logActivity(db, "Aloldalak", `Tartalom mentve: /${page.slug}`);
    invalidateContent();
    return null;
  });
}

const menuInput = z.object({
  icon: iconName,
  slug: slugSchema,
  visible: z.boolean(),
  labels: z.record(
    z.string().regex(/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/),
    z.object({ menu: text(40), title: text(120) }),
  ),
});

/** Menüpont beállításai: ikon, URL-cím, láthatóság, menüpont neve és címe nyelvenként. */
export async function savePageMenu(id: number, input: unknown): Promise<ActionResult> {
  return runAdmin(async () => {
    const page = await requirePage(pageId.parse(id));
    const value = menuInput.parse(input);
    const hu = value.labels[SOURCE_LOCALE];
    if (!hu?.menu.trim() || !hu.title.trim()) {
      throw new UserError("A magyar menüpont-nevet és címet ki kell tölteni.");
    }
    await assertSlugFree(value.slug, page.id);
    const db = getDb();
    const known = new Set((await db.select({ code: locales.code }).from(locales)).map((l) => l.code));
    await db
      .update(pages)
      .set({ icon: value.icon, slug: value.slug, visible: value.visible, updatedAt: Date.now() })
      .where(eq(pages.id, page.id));
    for (const [locale, label] of Object.entries(value.labels)) {
      if (!known.has(locale)) continue;
      await writeTranslation(db, pageMenuKey(page), locale, label.menu);
      await writeTranslation(db, pageTitleKey(page), locale, label.title);
    }
    await logActivity(db, "Menü", `Menüpont mentve: ${hu.menu}`);
    invalidateContent();
    return null;
  });
}

export async function movePage(id: number, direction: "up" | "down"): Promise<ActionResult> {
  return runAdmin(async () => {
    await requirePage(pageId.parse(id));
    const db = getDb();
    const ids = (await db.select({ id: pages.id }).from(pages).orderBy(asc(pages.sort), asc(pages.id))).map((r) => r.id);
    const index = ids.indexOf(id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= ids.length) return null;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    for (let i = 0; i < ids.length; i++) await db.update(pages).set({ sort: i + 1 }).where(eq(pages.id, ids[i]));
    await logActivity(db, "Menü", "Menüpontok sorrendje módosítva");
    invalidateContent();
    return null;
  });
}

export async function setPageVisible(id: number, visible: boolean): Promise<ActionResult> {
  return runAdmin(async () => {
    const page = await requirePage(pageId.parse(id));
    const db = getDb();
    await db.update(pages).set({ visible: visible === true, updatedAt: Date.now() }).where(eq(pages.id, page.id));
    await logActivity(db, "Menü", `${visible ? "Megjelenítve" : "Elrejtve"}: /${page.slug}`);
    invalidateContent();
    return null;
  });
}

const createInput = z.object({
  title: required(120, "Cím"),
  menu: required(40, "Menüpont neve"),
  slug: slugSchema,
  icon: iconName,
});

/** Új aloldal az „Általános” sablonnal (cím, bevezető, kép, szöveg, kártyák). */
export async function createGenericPage(input: unknown): Promise<ActionResult<{ id: number }>> {
  return runAdmin(async () => {
    const value = createInput.parse(input);
    await assertSlugFree(value.slug, null);
    const db = getDb();
    const all = await db.select({ sort: pages.sort }).from(pages);
    const key = `p${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
    const [page] = await db
      .insert(pages)
      .values({
        key,
        slug: value.slug,
        template: "generic",
        icon: value.icon,
        sort: Math.max(0, ...all.map((p) => p.sort)) + 1,
        visible: true,
        isCore: false,
        updatedAt: Date.now(),
      })
      .returning({ id: pages.id });
    await writeTranslation(db, `page.${key}.menu`, SOURCE_LOCALE, value.menu);
    await writeTranslation(db, `page.${key}.title`, SOURCE_LOCALE, value.title);
    await logActivity(db, "Menü", `Új aloldal: ${value.menu} (/${value.slug})`);
    invalidateContent();
    return { id: page.id };
  });
}

/** Aloldal törlése – csak az Adminban létrehozott („Általános”) oldalak törölhetők. */
export async function deletePage(id: number): Promise<ActionResult> {
  return runAdmin(async () => {
    const page = await requirePage(pageId.parse(id));
    if (page.isCore) throw new UserError("Az alap aloldalak nem törölhetők, csak elrejthetők.");
    const db = getDb();
    const items = await db.select({ id: genericItems.id }).from(genericItems).where(eq(genericItems.pageId, page.id));
    for (const item of items) await deleteContentForEntity(db, "generic_items", item.id);
    await deleteContentForEntity(db, "pages", page.id);
    await db.delete(genericItems).where(eq(genericItems.pageId, page.id));
    await db.delete(translations).where(like(translations.key, `page.${page.key}.%`));
    await db.delete(pages).where(eq(pages.id, page.id));
    await logActivity(db, "Menü", `Aloldal törölve: /${page.slug}`);
    invalidateContent();
    return null;
  });
}

const accentsInput = z.record(z.string().regex(/^\d+$/), hexColor.nullable());

/** Aloldalanként az akcentusszín (Megjelenés). `null` = a sablon alapszíne. */
export async function savePageAccents(input: unknown): Promise<ActionResult> {
  return runAdmin(async () => {
    const value = accentsInput.parse(input);
    const db = getDb();
    for (const [idText, color] of Object.entries(value)) {
      await db.update(pages).set({ accentColor: color, updatedAt: Date.now() }).where(eq(pages.id, Number(idText)));
    }
    await logActivity(db, "Megjelenés", "Aloldalak színei mentve");
    invalidateContent();
    return null;
  });
}
