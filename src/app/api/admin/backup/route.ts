/**
 * Mentés letöltése (GET) és visszaállítás mentésből (POST).
 * GET ?auto=<fájlnév> – egy automatikus biztonsági mentés letöltése.
 */
import { getDb } from "@/db/client";
import { adminRequest, jsonError } from "@/lib/admin/request";
import { logActivity } from "@/lib/audit";
import { BackupError, backupFileName, createBackup, MAX_BACKUP_BYTES, readSafetyBackup, restoreBackup } from "@/lib/backup";
import { invalidateContent } from "@/lib/cache";
import { getStorage } from "@/lib/media/storage";

export const dynamic = "force-dynamic";

function zipResponse(zip: Uint8Array, fileName: string): Response {
  return new Response(zip as Uint8Array<ArrayBuffer>, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const session = await adminRequest(request);
  if (session instanceof Response) return session;

  const auto = new URL(request.url).searchParams.get("auto");
  if (auto) {
    const data = await readSafetyBackup(auto);
    if (!data) return jsonError("Ez a biztonsági mentés nem található.", 404);
    return zipResponse(data, auto);
  }

  const db = getDb();
  const backup = await createBackup(db, getStorage());
  await logActivity(db, "Mentés", `Mentés letöltve (${backup.files} fájl)`);
  return zipResponse(backup.zip, backupFileName());
}

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
  if (!(file instanceof File) || file.size === 0) return jsonError("Nincs kiválasztva mentésfájl.", 400);
  if (file.size > MAX_BACKUP_BYTES) return jsonError("A mentésfájl túl nagy (legfeljebb 500 MB lehet).", 413);

  try {
    const db = getDb();
    const report = await restoreBackup(db, getStorage(), new Uint8Array(await file.arrayBuffer()));
    await logActivity(db, "Mentés", `Visszaállítás mentésből (${report.rows} adat, ${report.files} fájl)`);
    invalidateContent();
    return Response.json({ ok: true, report });
  } catch (error) {
    if (error instanceof BackupError) return jsonError(error.message, 400);
    console.error("[backup]", error);
    return jsonError("A visszaállítás nem sikerült. Az oldal tartalma nem változott.", 500);
  }
}
