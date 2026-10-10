import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { GadgetsList } from "@/components/admin/editors/GadgetsList";
import { PageContentForm } from "@/components/admin/editors/PageContentForm";
import { MediaLibraryProvider } from "@/components/admin/MediaLibrary";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { gadgets } from "@/db/schema";
import { requireCorePage, toPageContent } from "@/lib/admin/data";
import { requireAdminPage } from "@/lib/auth/guard";
import { listMedia } from "@/lib/media/library";

export const metadata: Metadata = { title: "Kedvenc eszközeim – Admin" };

export default async function AdminGadgetsPage() {
  await requireAdminPage();
  const db = getDb();
  const [page, items, media] = await Promise.all([
    requireCorePage("gadgets"),
    db.select().from(gadgets).orderBy(asc(gadgets.sort), asc(gadgets.id)),
    listMedia(db),
  ]);
  return (
    <MediaLibraryProvider initial={media}>
      <AdminPageHeader
        title="Kedvenc eszközeim"
        description="Az oldal bevezetője és az eszközök: számítógépek, okosórák, tabletek – és bármi más, amit szeretnél. A menüpont nevét és az URL-t a „Menü és aloldalak” részben tudod módosítani."
        viewHref={`/${page.slug}`}
      />
      <div className="space-y-8">
        <PageContentForm page={toPageContent(page)} />
        <GadgetsList items={items} />
      </div>
    </MediaLibraryProvider>
  );
}
