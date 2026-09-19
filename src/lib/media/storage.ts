/**
 * Tároló-réteg a feltöltött fájlokhoz.
 *
 * Most a fájlok a gépen, a `data/uploads` mappában vannak (`LocalDiskStorage`).
 * Élesítéskor egy másik megvalósítás (pl. S3 / Cloudflare R2 / Vercel Blob)
 * ugyanezt a felületet valósíthatja meg – a többi kódot nem kell átírni.
 */
import fs from "node:fs/promises";
import path from "node:path";

export interface MediaStorage {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  /** Az összes kulcs (opcionálisan egy előtaggal szűrve), `/` elválasztóval. */
  list(prefix?: string): Promise<string[]>;
}

/** Engedélyezett kiterjesztések és a hozzájuk tartozó MIME típusok. */
export const MIME_BY_EXT: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  ico: "image/x-icon",
};

/**
 * Biztonságos kulcs-e: csak kisbetű, szám, `-`, `_`, `/` és egy engedélyezett
 * kiterjesztés. Így semmilyen trükkös útvonal (`..`, `\`, abszolút út) nem jut át.
 */
export function isSafeKey(key: string): boolean {
  if (key.length > 200) return false;
  if (!/^[a-z0-9][a-z0-9_/-]*\.(webp|png|jpe?g|gif|ico)$/.test(key)) return false;
  return !key.split("/").some((part) => part === "" || part === "." || part === "..");
}

export function mimeForKey(key: string): string | null {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? null;
}

export class LocalDiskStorage implements MediaStorage {
  constructor(private readonly root: string) {}

  private resolve(key: string): string {
    if (!isSafeKey(key)) throw new Error(`Érvénytelen fájlkulcs: ${key}`);
    const full = path.resolve(this.root, ...key.split("/"));
    const rootWithSep = path.resolve(this.root) + path.sep;
    if (!full.startsWith(rootWithSep)) throw new Error(`Érvénytelen fájlkulcs: ${key}`);
    return full;
  }

  async put(key: string, data: Buffer): Promise<void> {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    // Előbb ideiglenes fájlba írunk, majd átnevezzük – így félkész fájl sosem látszik.
    const tmp = `${full}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, data);
    await fs.rename(tmp, full);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(this.resolve(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { force: true });
  }

  async list(prefix = ""): Promise<string[]> {
    const out: string[] = [];
    const walk = async (dir: string, rel: string) => {
      let entries: import("node:fs").Dirent[];
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const relPath = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) await walk(path.join(dir, entry.name), relPath);
        else if (isSafeKey(relPath) && relPath.startsWith(prefix)) out.push(relPath);
      }
    };
    await walk(path.resolve(this.root), "");
    return out.sort();
  }
}

export function uploadsRoot(): string {
  return path.resolve(process.env.UPLOADS_DIR?.trim() || "./data/uploads");
}

const globalForStorage = globalThis as unknown as {
  __botondemberStorage?: { storage: MediaStorage; root: string };
};

export function getStorage(): MediaStorage {
  const root = uploadsRoot();
  const cached = globalForStorage.__botondemberStorage;
  if (cached && cached.root === root) return cached.storage;
  const storage = new LocalDiskStorage(root);
  globalForStorage.__botondemberStorage = { storage, root };
  return storage;
}

/** A böngésző ezen a címen éri el a fájlt (a `/media/...` route szolgálja ki). */
export function mediaUrl(key: string): string {
  return `/media/${key}`;
}
