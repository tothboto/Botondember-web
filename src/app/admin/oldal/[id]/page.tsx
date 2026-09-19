import { and, asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GenericItemsList } from "@/components/admin/editors/GenericItemsList";
import { PageContentForm } from "@/components/admin/editors/PageContentForm";
import { MediaLibraryProvider } from "@/components/admin/MediaLibrary";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { genericItems, pages, translations } from "@/db/schema";
import { toPageContent } from "@/lib/admin/data";
import { contentEditorHref } from "@/lib/admin/page-editors";
import { requireAdminPage } from "@/lib/auth/guard";
import { pageTitleKey } from "@/lib/data/pages";
import { SOURCE_LOCALE } from "@/lib/i18n/messages";
import { listMedia } from "@/lib/media/library";

export const metadata: Metadata = { title: "Aloldal szerkesztése – Admin" };

export default async function AdminGenericPage({ params }: PageProps<"/admin/oldal/[id]">) {
  await requireAdminPage();
  const { id: idText } = await params;
  const id = /^\d{1,9}$/.test(idText) ? Number(idText) : NaN;
  if (!Number.isFinite(id)) notFound();

  const db = getDb();
  const [page] = await db.select().from(pages).where(eq(pages.id, id));
  if (!page) notFound();
  // Az alap aloldalaknak saját szerkesztőjük van.
  if (page.template !== "generic") redirect(contentEditorHref(page));

  const [items, [title], media] = await Promise.all([
    db.select().from(genericItems).where(eq(genericItems.pageId, page.id)).orderBy(asc(genericItems.sort), asc(genericItems.id)),
    db
      .select({ value: translations.value })
      .from(translations)
      .where(and(eq(translations.key, pageTitleKey(page)), eq(translations.locale, SOURCE_LOCALE))),
    listMedia(db),
  ]);

  return (
    <MediaLibraryProvider initial={media}>
      <AdminPageHeader
        title={title?.value || page.slug}
        description={
          <>
            Az „Általános” sablonú aloldal tartalma. A címet, a menüpont nevét, az ikont és az URL-t a{" "}
            <Link href="/admin/menu" className="font-semibold text-link underline underline-offset-2">
              Menü és aloldalak
            </Link>{" "}
            részben módosíthatod.
          </>
        }
        viewHref={page.visible ? `/${page.slug}` : undefined}
      />
      {!page.visible && (
        <p className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          Ez az aloldal most rejtett, ezért a látogatók nem látják. A Menü és aloldalak részben kapcsolhatod be.
        </p>
      )}
      <div className="space-y-8">
        <PageContentForm page={toPageContent(page)} title="Tartalom" showHero showBody />
        <GenericItemsList pageId={page.id} items={items} />
      </div>
    </MediaLibraryProvider>
  );
}
