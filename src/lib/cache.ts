/**
 * Gyorsítótár a publikus oldalak adataihoz.
 *
 * Minden publikus lekérdezés a `content` címkét kapja. Admin mentés után az
 * `invalidateContent()` azonnal lejárttá teszi (a következő kérés már friss
 * adatot kap), és frissíti a böngésző útválasztójának gyorsítótárát is.
 * Biztonsági hálóként 60 másodpercenként amúgy is frissül (pl. ha a seed
 * vagy egy script az oldal mellett módosítja az adatbázist).
 *
 * A gyorsítótár a lemezen (`.next/cache`) a szerver újraindítása után is
 * megmarad, ezért a kulcsban az adatbázis „ujjlenyomata” is benne van: így a
 * build közben (a valódi adatbázisból) tárolt adatot sosem kapja meg egy másik
 * adatbázissal futó szerver (pl. a tesztek vagy a homokozó).
 */
import { createHash } from "node:crypto";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { databaseUrl } from "@/db/client";

export const CONTENT_TAG = "content";

/** Az adatbázis azonosítója a kulcsban – csak a lenyomata, maga a cím nem kerül a lemezre. */
function databaseKey(): string {
  return createHash("sha256").update(databaseUrl()).digest("hex").slice(0, 16);
}

export function cached<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
): (...args: Args) => Promise<Result> {
  return unstable_cache(fn, ["botondember", databaseKey(), ...keyParts], { tags: [CONTENT_TAG], revalidate: 60 });
}

/** Admin mentés után hívandó: a változás azonnal látszik az oldalon. */
export function invalidateContent(): void {
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}
