"use server";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { footballSections } from "@/db/schema";
import { logActivity } from "@/lib/audit";
import { runAdmin, UserError, type ActionResult } from "@/lib/admin/result";
import { mediaId, optionalUrl, text } from "@/lib/admin/schemas";
import { invalidateContent } from "@/lib/cache";
import { assertMediaExists, updateAlts } from "@/lib/media/library";

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  why: "Miért a Real Madrid?",
  players: "Kedvenc játékosaim",
  moments: "Kedvenc pillanataim",
  facts: "Klub alapadatok",
  link: "Hivatalos oldal link",
};

const sectionInput = z.object({
  title: text(120),
  bodyMd: text(8000),
  mediaId,
  link: optionalUrl,
  visible: z.boolean(),
});

async function requireSection(id: number) {
  if (!Number.isInteger(id) || id <= 0) throw new UserError("Érvénytelen azonosító.");
  const [section] = await getDb().select().from(footballSections).where(eq(footballSections.id, id));
  if (!section) throw new UserError("Ez a szekció már nem létezik – frissítsd az oldalt!");
  return section;
}

export async function saveFootballSection(id: number, input: unknown, alts?: Record<string, string>): Promise<ActionResult> {
  return runAdmin(async () => {
    const section = await requireSection(id);
    const value = sectionInput.parse(input);
    const db = getDb();
    await assertMediaExists(db, value.mediaId);
    await db.update(footballSections).set({ ...value, updatedAt: Date.now() }).where(eq(footballSections.id, section.id));
    await updateAlts(db, alts);
    await logActivity(db, "Real Madrid", `Szekció mentve: ${SECTION_LABELS[section.type] ?? section.type}`);
    invalidateContent();
    return null;
  });
}

export async function moveFootballSection(id: number, direction: "up" | "down"): Promise<ActionResult> {
  return runAdmin(async () => {
    await requireSection(id);
    const db = getDb();
    const ids = (
      await db.select({ id: footballSections.id }).from(footballSections).orderBy(asc(footballSections.sort), asc(footballSections.id))
    ).map((r) => r.id);
    const index = ids.indexOf(id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= ids.length) return null;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    for (let i = 0; i < ids.length; i++) {
      await db.update(footballSections).set({ sort: i + 1 }).where(eq(footballSections.id, ids[i]));
    }
    await logActivity(db, "Real Madrid", "Szekciók sorrendje módosítva");
    invalidateContent();
    return null;
  });
}

export async function setFootballSectionVisible(id: number, visible: boolean): Promise<ActionResult> {
  return runAdmin(async () => {
    const section = await requireSection(id);
    const db = getDb();
    await db
      .update(footballSections)
      .set({ visible: visible === true, updatedAt: Date.now() })
      .where(eq(footballSections.id, section.id));
    await logActivity(
      db,
      "Real Madrid",
      `${visible ? "Megjelenítve" : "Elrejtve"}: ${SECTION_LABELS[section.type] ?? section.type}`,
    );
    invalidateContent();
    return null;
  });
}
