import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { GamesList } from "@/components/admin/editors/GamesList";
import { PageContentForm } from "@/components/admin/editors/PageContentForm";
import { MediaLibraryProvider } from "@/components/admin/MediaLibrary";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { games } from "@/db/schema";
import { requireCorePage, toPageContent } from "@/lib/admin/data";
import { requireAdminPage } from "@/lib/auth/guard";
import { listMedia } from "@/lib/media/library";

export const metadata: Metadata = { title: "Játékaim – Admin" };

export default async function AdminGamesPage() {
  await requireAdminPage();
  const db = getDb();
  const [page, items, media] = await Promise.all([
    requireCorePage("games"),
    db.select().from(games).orderBy(asc(games.sort), asc(games.id)),
    listMedia(db),
  ]);
  return (
    <MediaLibraryProvider initial={media}>
      <AdminPageHeader
        title="Játékaim"
        description="A Kedvenc játékaim oldal bevezetője és a játékok (borító, platformok, értékelés, vélemény)."
        viewHref={`/${page.slug}`}
      />
      <div className="space-y-8">
        <PageContentForm page={toPageContent(page)} />
        <GamesList items={items} />
      </div>
    </MediaLibraryProvider>
  );
}
