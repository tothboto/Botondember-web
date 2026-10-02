import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { PageContentForm } from "@/components/admin/editors/PageContentForm";
import { SchoolsList } from "@/components/admin/editors/SchoolsList";
import { MediaLibraryProvider } from "@/components/admin/MediaLibrary";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { schools } from "@/db/schema";
import { requireCorePage, toPageContent } from "@/lib/admin/data";
import { requireAdminPage } from "@/lib/auth/guard";
import { listMedia } from "@/lib/media/library";

export const metadata: Metadata = { title: "Iskoláim – Admin" };

export default async function AdminSchoolsPage() {
  await requireAdminPage();
  const db = getDb();
  const [page, items, media] = await Promise.all([
    requireCorePage("schools"),
    db.select().from(schools).orderBy(asc(schools.sort), asc(schools.id)),
    listMedia(db),
  ]);
  return (
    <MediaLibraryProvider initial={media}>
      <AdminPageHeader
        title="Iskoláim"
        description="Az Iskoláim oldal bevezetője és az iskolák. Minden iskolának saját aloldala van (pl. /iskolaim/bajai-szentistvani-altalanos-iskola). A menüpont nevét és az URL-t a „Menü és aloldalak” részben tudod módosítani."
        viewHref={`/${page.slug}`}
      />
      <div className="space-y-8">
        <PageContentForm page={toPageContent(page)} />
        <SchoolsList items={items} />
      </div>
    </MediaLibraryProvider>
  );
}
