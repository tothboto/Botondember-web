import type { Metadata } from "next";
import { MediaManager } from "@/components/admin/editors/MediaManager";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { requireAdminPage } from "@/lib/auth/guard";
import { listMedia, mediaUsageMap } from "@/lib/media/library";

export const metadata: Metadata = { title: "Médiatár – Admin" };

export default async function AdminMediaPage() {
  await requireAdminPage();
  const db = getDb();
  const [items, usage] = await Promise.all([listMedia(db), mediaUsageMap(db)]);
  return (
    <>
      <AdminPageHeader
        title="Médiatár"
        description="Az összes feltöltött kép egy helyen. Itt adhatod meg (vagy javíthatod) az alt szövegüket, és törölheted a feleslegeseket."
      />
      <MediaManager items={items} usage={Object.fromEntries(usage)} />
    </>
  );
}
