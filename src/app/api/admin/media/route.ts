/**
 * Képfeltöltés az Adminból: POST multipart/form-data (file, alt).
 * Csak PNG, JPG, WEBP, GIF (a tartalom alapján ellenőrizve), max. 10 MB.
 * A kép újrakódolva (WEBP), kicsinyítve és a rejtett adatok nélkül kerül mentésre.
 */
import { getDb } from "@/db/client";
import { adminRequest, jsonError } from "@/lib/admin/request";
import { logActivity } from "@/lib/audit";
import { invalidateContent } from "@/lib/cache";
import { saveImage } from "@/lib/media/library";
import { ImageError, MAX_UPLOAD_BYTES } from "@/lib/media/process";
import { getStorage } from "@/lib/media/storage";

export async function POST(request: Request) {
  const session = await adminRequest(request);
  if (session instanceof Response) return session;

  if (Number(request.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 512 * 1024) {
    return jsonError("A kép túl nagy – legfeljebb 10 MB lehet.", 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("A feltöltés nem sikerült – próbáld újra!", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return jsonError("Nincs kiválasztva kép.", 400);
  if (file.size > MAX_UPLOAD_BYTES) return jsonError("A kép túl nagy – legfeljebb 10 MB lehet.", 413);

  try {
    const db = getDb();
    const info = await saveImage(db, getStorage(), Buffer.from(await file.arrayBuffer()), {
      originalName: file.name,
      alt: String(form.get("alt") ?? ""),
      source: "upload",
    });
    await logActivity(db, "Médiatár", `Új kép feltöltve: ${file.name}`);
    invalidateContent();
    return Response.json({ ok: true, media: info });
  } catch (error) {
    if (error instanceof ImageError) return jsonError(error.message, 400);
    console.error("[feltöltés]", error);
    return jsonError("A kép mentése nem sikerült.", 500);
  }
}
