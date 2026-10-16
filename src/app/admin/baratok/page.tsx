import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { FriendsList } from "@/components/admin/editors/FriendsList";
import { PageContentForm } from "@/components/admin/editors/PageContentForm";
import { MediaLibraryProvider } from "@/components/admin/MediaLibrary";
import { AdminPageHeader } from "@/components/admin/ui";
import { TriangleAlert } from "lucide-react";
import { getDb } from "@/db/client";
import { friends } from "@/db/schema";
import { requireCorePage, toPageContent } from "@/lib/admin/data";
import { requireAdminPage } from "@/lib/auth/guard";
import { listMedia } from "@/lib/media/library";

export const metadata: Metadata = { title: "Barátok – Admin" };

export default async function AdminFriendsPage() {
  await requireAdminPage();
  const db = getDb();
  const [page, items, media] = await Promise.all([
    requireCorePage("friends"),
    db.select().from(friends).orderBy(asc(friends.sort), asc(friends.id)),
    listMedia(db),
  ]);
  return (
    <MediaLibraryProvider initial={media}>
      <AdminPageHeader
        title="Barátok"
        description="Az oldal bevezetője és a barátok. Mindenkinek saját aloldala van (pl. /baratok/pelda-barat). A menüpont nevét és az URL-t a „Menü és aloldalak” részben tudod módosítani."
        viewHref={`/${page.slug}`}
      />
      <div className="space-y-8">
        <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-50 dark:ring-amber-800">
          <TriangleAlert aria-hidden className="h-6 w-6 shrink-0" />
          <p>
            <strong>Mások adatai – kérdezd meg őket előbb!</strong> Ez az oldal bárki számára elérhető lehet az
            interneten. Más nevét és fényképét csak akkor tedd ki, ha ő és a szülei is beleegyeztek. Ha bizonytalan
            vagy, a becenév és egy rajzolt kép is tökéletes.
          </p>
        </div>
        <PageContentForm page={toPageContent(page)} />
        <FriendsList items={items} />
      </div>
    </MediaLibraryProvider>
  );
}
