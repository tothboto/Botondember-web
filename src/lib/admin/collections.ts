/**
 * A listák (hobbik, játékok, YouTube elemek, Real Madrid játékosok stb.)
 * közös kezelése: mentés, sorrend, láthatóság, törlés.
 * Szerkesztéskor a „Példa” jelölés eltűnik.
 */
import { and, eq, ne, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { footballFacts, footballMoments, footballPlayers, games, genericItems, hobbies, pages, youtubeItems } from "@/db/schema";
import { assertMediaExists } from "@/lib/media/library";
import { COLLECTION_TABLES, itemSchemas, type CollectionKey } from "./schemas";
import { UserError } from "./result";

type Parsed<K extends CollectionKey> = ReturnType<(typeof itemSchemas)[K]["parse"]>;

/** A lista végére kerül: a legnagyobb sorszám + 1 (a csoporton belül). */
async function nextSort(db: Db, collection: CollectionKey, scopeValue: string | number | null): Promise<number> {
  const meta = COLLECTION_TABLES[collection];
  const where = meta.scope ? sql` WHERE ${sql.raw(meta.scope)} = ${scopeValue}` : sql``;
  const rows = await db.all<{ max: number | null }>(sql`SELECT MAX(sort) AS max FROM ${sql.raw(meta.table)}${where}`);
  return (rows[0]?.max ?? 0) + 1;
}

async function requireRow(db: Db, collection: CollectionKey, id: number) {
  const meta = COLLECTION_TABLES[collection];
  const rows = await db.all<{ id: number; scope: string | number | null }>(
    sql`SELECT id, ${sql.raw(meta.scope ?? "NULL")} AS scope FROM ${sql.raw(meta.table)} WHERE id = ${id}`,
  );
  if (!rows[0]) throw new UserError("Ez az elem már nem létezik – frissítsd az oldalt!");
  return rows[0];
}

export function itemTitle(collection: CollectionKey, values: Record<string, unknown>): string {
  const title = values.title ?? values.name ?? values.label ?? "";
  return String(title).slice(0, 80);
}

/** Új elem létrehozása vagy meglévő módosítása. Visszaadja az azonosítót. */
export async function saveItem(db: Db, collection: CollectionKey, id: number | null, input: unknown): Promise<number> {
  const now = Date.now();
  const values = itemSchemas[collection].parse(input) as Parsed<typeof collection>;
  const record = values as Record<string, unknown>;
  for (const key of ["mediaId", "coverMediaId", "thumbMediaId"]) {
    if (key in record) await assertMediaExists(db, record[key] as number | null);
  }

  if (id !== null) await requireRow(db, collection, id);

  switch (collection) {
    case "hobbies": {
      const v = values as Parsed<"hobbies">;
      if (id === null) {
        const [row] = await db
          .insert(hobbies)
          .values({ ...v, sort: await nextSort(db, collection, null), isExample: false, updatedAt: now })
          .returning({ id: hobbies.id });
        return row.id;
      }
      await db.update(hobbies).set({ ...v, isExample: false, updatedAt: now }).where(eq(hobbies.id, id));
      return id;
    }
    case "games": {
      const v = values as Parsed<"games">;
      let savedId = id;
      if (savedId === null) {
        const [row] = await db
          .insert(games)
          .values({ ...v, sort: await nextSort(db, collection, null), isExample: false, updatedAt: now })
          .returning({ id: games.id });
        savedId = row.id;
      } else {
        await db.update(games).set({ ...v, isExample: false, updatedAt: now }).where(eq(games.id, savedId));
      }
      // Egyszerre csak egy kiemelt játék lehet.
      if (v.featured) await db.update(games).set({ featured: false }).where(ne(games.id, savedId));
      return savedId;
    }
    case "youtube": {
      const v = values as Parsed<"youtube">;
      if (id === null) {
        const [row] = await db
          .insert(youtubeItems)
          .values({ ...v, sort: await nextSort(db, collection, v.kind), isExample: false, updatedAt: now })
          .returning({ id: youtubeItems.id });
        return row.id;
      }
      await db.update(youtubeItems).set({ ...v, isExample: false, updatedAt: now }).where(eq(youtubeItems.id, id));
      return id;
    }
    case "players": {
      const v = values as Parsed<"players">;
      if (id === null) {
        const [row] = await db
          .insert(footballPlayers)
          .values({ ...v, sort: await nextSort(db, collection, null), isExample: false, updatedAt: now })
          .returning({ id: footballPlayers.id });
        return row.id;
      }
      await db.update(footballPlayers).set({ ...v, isExample: false, updatedAt: now }).where(eq(footballPlayers.id, id));
      return id;
    }
    case "moments": {
      const v = values as Parsed<"moments">;
      if (id === null) {
        const [row] = await db
          .insert(footballMoments)
          .values({ ...v, sort: await nextSort(db, collection, null), isExample: false, updatedAt: now })
          .returning({ id: footballMoments.id });
        return row.id;
      }
      await db.update(footballMoments).set({ ...v, isExample: false, updatedAt: now }).where(eq(footballMoments.id, id));
      return id;
    }
    case "facts": {
      const v = values as Parsed<"facts">;
      if (id === null) {
        const [row] = await db
          .insert(footballFacts)
          .values({ ...v, sort: await nextSort(db, collection, null), updatedAt: now })
          .returning({ id: footballFacts.id });
        return row.id;
      }
      await db.update(footballFacts).set({ ...v, updatedAt: now }).where(eq(footballFacts.id, id));
      return id;
    }
    case "generic": {
      const v = values as Parsed<"generic">;
      const [page] = await db.select({ id: pages.id }).from(pages).where(and(eq(pages.id, v.pageId), eq(pages.template, "generic")));
      if (!page) throw new UserError("Ez az aloldal már nem létezik.");
      if (id === null) {
        const [row] = await db
          .insert(genericItems)
          .values({ ...v, sort: await nextSort(db, collection, v.pageId), isExample: false, updatedAt: now })
          .returning({ id: genericItems.id });
        return row.id;
      }
      await db.update(genericItems).set({ ...v, isExample: false, updatedAt: now }).where(eq(genericItems.id, id));
      return id;
    }
  }
}

/** Elem mozgatása eggyel feljebb vagy lejjebb (a csoportján belül), majd sorszámozás 1..n. */
export async function moveItem(db: Db, collection: CollectionKey, id: number, direction: "up" | "down"): Promise<void> {
  const meta = COLLECTION_TABLES[collection];
  const current = await requireRow(db, collection, id);
  const where = meta.scope ? sql` WHERE ${sql.raw(meta.scope)} = ${current.scope}` : sql``;
  const rows = await db.all<{ id: number }>(sql`SELECT id FROM ${sql.raw(meta.table)}${where} ORDER BY sort, id`);
  const ids = rows.map((r) => r.id);
  const index = ids.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= ids.length) return;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  for (let i = 0; i < ids.length; i++) {
    await db.run(sql`UPDATE ${sql.raw(meta.table)} SET sort = ${i + 1} WHERE id = ${ids[i]}`);
  }
}

export async function setItemVisible(db: Db, collection: CollectionKey, id: number, visible: boolean): Promise<void> {
  const meta = COLLECTION_TABLES[collection];
  await requireRow(db, collection, id);
  await db.run(sql`UPDATE ${sql.raw(meta.table)} SET visible = ${visible ? 1 : 0}, updated_at = ${Date.now()} WHERE id = ${id}`);
}

export async function deleteItem(db: Db, collection: CollectionKey, id: number): Promise<string> {
  const meta = COLLECTION_TABLES[collection];
  await requireRow(db, collection, id);
  const titleColumn = collection === "players" ? "name" : collection === "facts" ? "label" : "title";
  const rows = await db.all<{ title: string }>(sql`SELECT ${sql.raw(titleColumn)} AS title FROM ${sql.raw(meta.table)} WHERE id = ${id}`);
  await db.run(sql`DELETE FROM ${sql.raw(meta.table)} WHERE id = ${id}`);
  return rows[0]?.title ?? "";
}
