"use server";

import { getDb } from "@/db/client";
import { logActivity } from "@/lib/audit";
import { deleteItem, itemTitle, moveItem, saveItem, setItemVisible } from "@/lib/admin/collections";
import { runAdmin, UserError, type ActionResult } from "@/lib/admin/result";
import { COLLECTION_KEYS, COLLECTION_TABLES, type CollectionKey } from "@/lib/admin/schemas";
import { invalidateContent } from "@/lib/cache";
import { updateAlts } from "@/lib/media/library";

function assertCollection(collection: string): asserts collection is CollectionKey {
  if (!COLLECTION_KEYS.includes(collection as CollectionKey)) throw new UserError("Ismeretlen lista.");
}

function assertId(id: unknown): asserts id is number {
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) throw new UserError("Érvénytelen azonosító.");
}

/** Egy lista-elem mentése (új vagy meglévő), a képek alt szövegeivel együtt. */
export async function saveCollectionItem(
  collection: CollectionKey,
  id: number | null,
  input: unknown,
  alts?: Record<string, string>,
): Promise<ActionResult<{ id: number }>> {
  return runAdmin(async () => {
    assertCollection(collection);
    if (id !== null) assertId(id);
    const db = getDb();
    const savedId = await saveItem(db, collection, id, input);
    await updateAlts(db, alts);
    await logActivity(
      db,
      COLLECTION_TABLES[collection].label,
      `${id === null ? "Új elem" : "Módosítva"}: ${itemTitle(collection, input as Record<string, unknown>)}`,
    );
    invalidateContent();
    return { id: savedId };
  });
}

export async function moveCollectionItem(collection: CollectionKey, id: number, direction: "up" | "down"): Promise<ActionResult> {
  return runAdmin(async () => {
    assertCollection(collection);
    assertId(id);
    if (direction !== "up" && direction !== "down") throw new UserError("Érvénytelen irány.");
    await moveItem(getDb(), collection, id, direction);
    invalidateContent();
    return null;
  });
}

export async function setCollectionItemVisible(collection: CollectionKey, id: number, visible: boolean): Promise<ActionResult> {
  return runAdmin(async () => {
    assertCollection(collection);
    assertId(id);
    const db = getDb();
    await setItemVisible(db, collection, id, visible === true);
    await logActivity(db, COLLECTION_TABLES[collection].label, visible ? "Elem megjelenítve" : "Elem elrejtve");
    invalidateContent();
    return null;
  });
}

export async function deleteCollectionItem(collection: CollectionKey, id: number): Promise<ActionResult> {
  return runAdmin(async () => {
    assertCollection(collection);
    assertId(id);
    const db = getDb();
    const title = await deleteItem(db, collection, id);
    await logActivity(db, COLLECTION_TABLES[collection].label, `Törölve: ${title}`);
    invalidateContent();
    return null;
  });
}
