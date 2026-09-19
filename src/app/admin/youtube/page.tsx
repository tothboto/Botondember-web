import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { PageContentForm } from "@/components/admin/editors/PageContentForm";
import { YoutubeLists } from "@/components/admin/editors/YoutubeLists";
import { MediaLibraryProvider } from "@/components/admin/MediaLibrary";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { youtubeItems } from "@/db/schema";
import { requireCorePage, toPageContent } from "@/lib/admin/data";
import { requireAdminPage } from "@/lib/auth/guard";
import { listMedia } from "@/lib/media/library";

export const metadata: Metadata = { title: "YouTube – Admin" };

export default async function AdminYoutubePage() {
  await requireAdminPage();
  const db = getDb();
  const [page, items, media] = await Promise.all([
    requireCorePage("youtube"),
    db.select().from(youtubeItems).orderBy(asc(youtubeItems.sort), asc(youtubeItems.id)),
    listMedia(db),
  ]);
  return (
    <MediaLibraryProvider initial={media}>
      <AdminPageHeader
        title="YouTube"
        description={
          <>
            A négy lista (zenék, videók, csatornák, lejátszási listák). Elég beilleszteni egy YouTube linket – a
            címet, a csatornát és a bélyegképet automatikusan lekérem. A bélyegképek helyben tárolódnak, így a
            látogatók böngészője nem kommunikál a Google-lel.
          </>
        }
        viewHref={`/${page.slug}`}
      />
      <div className="space-y-8">
        <PageContentForm page={toPageContent(page)} />
        <YoutubeLists items={items} />
      </div>
    </MediaLibraryProvider>
  );
}
