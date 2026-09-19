"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { media } from "@/db/schema";
import { logActivity } from "@/lib/audit";
import { runAdmin, UserError, type ActionResult } from "@/lib/admin/result";
import { invalidateContent } from "@/lib/cache";
import { deleteMediaCompletely, findMediaUsage } from "@/lib/media/library";
import { getStorage } from "@/lib/media/storage";

function assertId(id: unknown): asserts id is number {
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) throw new UserError("Érvénytelen azonosító.");
}

export async function updateMediaAlt(id: number, alt: string): Promise<ActionResult> {
  return runAdmin(async () => {
    assertId(id);
    const db = getDb();
    await db.update(media).set({ alt: String(alt ?? "").trim().slice(0, 300) }).where(eq(media.id, id));
    invalidateContent();
    return null;
  });
}

/**
 * Kép törlése. Ha a kép használatban van, és nincs „mégis törlöm” megerősítés,
 * nem töröl, hanem visszaadja, hol használják.
 */
export async function deleteMediaItem(
  id: number,
  force: boolean,
): Promise<ActionResult<{ deleted: boolean; usage: string[] }>> {
  return runAdmin(async () => {
    assertId(id);
    const db = getDb();
    const usage = await findMediaUsage(db, id);
    if (usage.length > 0 && !force) return { deleted: false, usage };
    const [row] = await db.select({ name: media.originalName }).from(media).where(eq(media.id, id));
    await deleteMediaCompletely(db, getStorage(), id);
    await logActivity(db, "Médiatár", `Kép törölve: ${row?.name || `#${id}`}`);
    invalidateContent();
    return { deleted: true, usage };
  });
}

export async function getMediaUsage(id: number): Promise<ActionResult<string[]>> {
  return runAdmin(async () => {
    assertId(id);
    return findMediaUsage(getDb(), id);
  });
}
