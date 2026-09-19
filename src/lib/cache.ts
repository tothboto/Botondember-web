/**
 * Gyorsítótár a publikus oldalak adataihoz.
 *
 * Minden publikus lekérdezés a `content` címkét kapja. Admin mentés után az
 * `invalidateContent()` azonnal lejárttá teszi (a következő kérés már friss
 * adatot kap), és frissíti a böngésző útválasztójának gyorsítótárát is.
 * Biztonsági hálóként 60 másodpercenként amúgy is frissül (pl. ha a seed
 * vagy egy script az oldal mellett módosítja az adatbázist).
 */
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

export const CONTENT_TAG = "content";

export function cached<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
): (...args: Args) => Promise<Result> {
  return unstable_cache(fn, ["botondember", ...keyParts], { tags: [CONTENT_TAG], revalidate: 60 });
}

/** Admin mentés után hívandó: a változás azonnal látszik az oldalon. */
export function invalidateContent(): void {
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}
