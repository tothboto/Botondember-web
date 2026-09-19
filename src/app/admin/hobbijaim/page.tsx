import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { HobbiesList } from "@/components/admin/editors/HobbiesList";
import { PageContentForm } from "@/components/admin/editors/PageContentForm";
import { MediaLibraryProvider } from "@/components/admin/MediaLibrary";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { hobbies } from "@/db/schema";
import { requireCorePage, toPageContent } from "@/lib/admin/data";
import { requireAdminPage } from "@/lib/auth/guard";
import { listMedia } from "@/lib/media/library";

export const metadata: Metadata = { title: "Hobbijaim – Admin" };

export default async function AdminHobbiesPage() {
  await requireAdminPage();
  const db = getDb();
  const [page, items, media] = await Promise.all([
    requireCorePage("hobbies"),
    db.select().from(hobbies).orderBy(asc(hobbies.sort), asc(hobbies.id)),
    listMedia(db),
  ]);
  return (
    <MediaLibraryProvider initial={media}>
      <AdminPageHeader
        title="Hobbijaim"
        description="A Hobbijaim oldal bevezetője és a hobbi-kártyák. A menüpont nevét és az URL-t a „Menü és aloldalak” részben tudod módosítani."
        viewHref={`/${page.slug}`}
      />
      <div className="space-y-8">
        <PageContentForm page={toPageContent(page)} />
        <HobbiesList items={items} />
      </div>
    </MediaLibraryProvider>
  );
}
