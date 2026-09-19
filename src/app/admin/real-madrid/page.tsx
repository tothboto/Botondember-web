import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { FootballLists } from "@/components/admin/editors/FootballLists";
import { FootballSections } from "@/components/admin/editors/FootballSections";
import { PageContentForm } from "@/components/admin/editors/PageContentForm";
import { MediaLibraryProvider } from "@/components/admin/MediaLibrary";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { footballFacts, footballMoments, footballPlayers, footballSections } from "@/db/schema";
import { requireCorePage, toPageContent } from "@/lib/admin/data";
import { requireAdminPage } from "@/lib/auth/guard";
import { listMedia } from "@/lib/media/library";

export const metadata: Metadata = { title: "Real Madrid – Admin" };

export default async function AdminFootballPage() {
  await requireAdminPage();
  const db = getDb();
  const [page, sections, players, moments, facts, media] = await Promise.all([
    requireCorePage("football"),
    db.select().from(footballSections).orderBy(asc(footballSections.sort), asc(footballSections.id)),
    db.select().from(footballPlayers).orderBy(asc(footballPlayers.sort), asc(footballPlayers.id)),
    db.select().from(footballMoments).orderBy(asc(footballMoments.sort), asc(footballMoments.id)),
    db.select().from(footballFacts).orderBy(asc(footballFacts.sort), asc(footballFacts.id)),
    listMedia(db),
  ]);
  return (
    <MediaLibraryProvider initial={media}>
      <AdminPageHeader
        title="Real Madrid"
        description="A Kedvenc focicsapatom oldal szekciói, játékosai, pillanatai és alapadatai. Címert, logót vagy más jogvédett képet csak te tölthetsz fel."
        viewHref={`/${page.slug}`}
      />
      <div className="space-y-8">
        <FootballSections sections={sections} />
        <PageContentForm page={toPageContent(page)} title="Bevezető (a nagy kép alján)" />
        <FootballLists players={players} moments={moments} facts={facts} />
      </div>
    </MediaLibraryProvider>
  );
}
