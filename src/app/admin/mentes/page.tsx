import { count, sum } from "drizzle-orm";
import type { Metadata } from "next";
import { BackupPanel } from "@/components/admin/editors/BackupPanel";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { games, genericItems, hobbies, media, youtubeItems } from "@/db/schema";
import { requireAdminPage } from "@/lib/auth/guard";
import { listSafetyBackups } from "@/lib/backup";

export const metadata: Metadata = { title: "Mentés és visszaállítás – Admin" };

export default async function AdminBackupPage() {
  await requireAdminPage();
  const db = getDb();
  const [[mediaStats], counts, safetyBackups] = await Promise.all([
    db.select({ n: count(), bytes: sum(media.size) }).from(media),
    Promise.all([hobbies, games, youtubeItems, genericItems].map((table) => db.select({ n: count() }).from(table))),
    listSafetyBackups(),
  ]);
  const items = counts.reduce((total, [row]) => total + row.n, 0);

  return (
    <>
      <AdminPageHeader
        title="Mentés és visszaállítás"
        description="Készíts mentést az oldal teljes tartalmáról, vagy tölts vissza egy korábbit."
      />
      <BackupPanel
        stats={{ images: mediaStats.n, imageBytes: Number(mediaStats.bytes ?? 0), items }}
        safetyBackups={safetyBackups}
      />
    </>
  );
}
