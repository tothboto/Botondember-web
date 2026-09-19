"use server";

import { z } from "zod";
import { getDb } from "@/db/client";
import { legalDocs } from "@/db/schema";
import { logActivity } from "@/lib/audit";
import { runAdmin, type ActionResult } from "@/lib/admin/result";
import { writeSetting } from "@/lib/admin/store";
import { invalidateContent } from "@/lib/cache";
import { readAllSettings } from "@/lib/data/settings";
import { SOURCE_LOCALE } from "@/lib/i18n/messages";
import { FAVICON_FILES, faviconKey } from "@/lib/media/favicon";
import { assertMediaExists, updateAlts } from "@/lib/media/library";
import { getStorage } from "@/lib/media/storage";
import { settingSchemas } from "@/lib/settings";

const generalInput = settingSchemas.general.omit({ faviconVersion: true });

/** Általános beállítások + lábléc (egy oldalon szerkeszthetők). */
export async function saveGeneralPage(input: { general: unknown; footer: unknown }): Promise<ActionResult> {
  return runAdmin(async () => {
    const general = generalInput.parse(input.general);
    const footer = settingSchemas.footer.parse(input.footer);
    const db = getDb();
    const current = await readAllSettings();
    await writeSetting(db, "general", { ...general, faviconVersion: current.general.faviconVersion });
    await writeSetting(db, "footer", footer);
    await logActivity(db, "Általános", "Beállítások mentve");
    invalidateContent();
    return null;
  });
}

/** A beépített „B” monogramos favicon visszaállítása. */
export async function resetFavicon(): Promise<ActionResult> {
  return runAdmin(async () => {
    const db = getDb();
    const current = await readAllSettings();
    const previous = current.general.faviconVersion;
    await writeSetting(db, "general", { ...current.general, faviconVersion: null });
    if (previous && previous !== "default") {
      const storage = getStorage();
      for (const name of FAVICON_FILES) await storage.delete(faviconKey(previous, name));
    }
    await logActivity(db, "Általános", "Favicon visszaállítva az alapértelmezettre");
    invalidateContent();
    return null;
  });
}

export async function saveAppearance(input: unknown): Promise<ActionResult> {
  return runAdmin(async () => {
    const value = settingSchemas.appearance.parse(input);
    const db = getDb();
    await writeSetting(db, "appearance", value);
    await logActivity(db, "Megjelenés", "Színek és betűk mentve");
    invalidateContent();
    return null;
  });
}

export async function saveHome(input: unknown, alts?: Record<string, string>): Promise<ActionResult> {
  return runAdmin(async () => {
    const value = settingSchemas.home.parse(input);
    const db = getDb();
    await assertMediaExists(db, value.heroMediaId);
    await writeSetting(db, "home", value);
    await updateAlts(db, alts);
    await logActivity(db, "Kezdőlap", "Kezdőlap mentve");
    invalidateContent();
    return null;
  });
}

export async function saveLegalSettings(input: unknown): Promise<ActionResult> {
  return runAdmin(async () => {
    const value = settingSchemas.legal.parse(input);
    const db = getDb();
    await writeSetting(db, "legal", value);
    await logActivity(db, "Jogi oldalak", "Az adatkezelő adatai mentve");
    invalidateContent();
    return null;
  });
}

const legalDocInput = z.object({
  slug: z.enum(["privacy", "cookie"]),
  bodyMd: z.string().trim().min(20, "A tájékoztató szövege túl rövid.").max(60_000, "A szöveg túl hosszú."),
});

export async function saveLegalDoc(input: unknown): Promise<ActionResult<{ updatedAt: number }>> {
  return runAdmin(async () => {
    const { slug, bodyMd } = legalDocInput.parse(input);
    const db = getDb();
    const updatedAt = Date.now();
    await db
      .insert(legalDocs)
      .values({ slug, locale: SOURCE_LOCALE, bodyMd, updatedAt })
      .onConflictDoUpdate({ target: [legalDocs.slug, legalDocs.locale], set: { bodyMd, updatedAt } });
    await logActivity(
      db,
      "Jogi oldalak",
      slug === "privacy" ? "Adatkezelési tájékoztató mentve" : "Cookie tájékoztató mentve",
    );
    invalidateContent();
    return { updatedAt };
  });
}
