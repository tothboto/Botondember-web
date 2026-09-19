/**
 * Favicon feltöltése: PNG (legalább 512×512 px ajánlott) vagy ICO.
 * A 16, 32, 180, 192 és 512 px-es méreteket és a favicon.ico-t automatikusan elkészíti.
 */
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { settings } from "@/db/schema";
import { adminRequest, jsonError } from "@/lib/admin/request";
import { logActivity } from "@/lib/audit";
import { invalidateContent } from "@/lib/cache";
import { readAllSettings } from "@/lib/data/settings";
import { buildFaviconSet, faviconKey, FAVICON_FILES } from "@/lib/media/favicon";
import { ImageError, MAX_UPLOAD_BYTES } from "@/lib/media/process";
import { getStorage } from "@/lib/media/storage";

export async function POST(request: Request) {
  const session = await adminRequest(request);
  if (session instanceof Response) return session;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("A feltöltés nem sikerült – próbáld újra!", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return jsonError("Nincs kiválasztva fájl.", 400);
  if (file.size > MAX_UPLOAD_BYTES) return jsonError("A fájl túl nagy – legfeljebb 10 MB lehet.", 413);

  try {
    const { files, warning } = await buildFaviconSet(Buffer.from(await file.arrayBuffer()));
    const storage = getStorage();
    const version = `v${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
    for (const name of FAVICON_FILES) await storage.put(faviconKey(version, name), files[name]);

    const db = getDb();
    const current = await readAllSettings();
    const previous = current.general.faviconVersion;
    await db
      .update(settings)
      .set({ value: { ...current.general, faviconVersion: version }, updatedAt: Date.now() })
      .where(eq(settings.key, "general"));
    // A régi (nem alapértelmezett) készlet törlése.
    if (previous && previous !== "default") {
      for (const name of FAVICON_FILES) await storage.delete(faviconKey(previous, name));
    }
    await logActivity(db, "Általános", "Új favicon feltöltve");
    invalidateContent();
    return Response.json({ ok: true, version, warning });
  } catch (error) {
    if (error instanceof ImageError) return jsonError(error.message, 400);
    console.error("[favicon]", error);
    return jsonError("A favicon mentése nem sikerült.", 500);
  }
}
