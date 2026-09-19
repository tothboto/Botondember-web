import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { LegalEditor, type LegalDocState } from "@/components/admin/editors/LegalEditor";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { legalDocs } from "@/db/schema";
import { requireAdminPage } from "@/lib/auth/guard";
import { readAllSettings } from "@/lib/data/settings";
import { SOURCE_LOCALE } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Jogi oldalak – Admin" };

export default async function AdminLegalPage() {
  await requireAdminPage();
  const [settings, rows] = await Promise.all([
    readAllSettings(),
    getDb().select().from(legalDocs).where(eq(legalDocs.locale, SOURCE_LOCALE)),
  ]);
  const docs: LegalDocState[] = (["privacy", "cookie"] as const).map((slug) => {
    const row = rows.find((r) => r.slug === slug);
    return { slug, bodyMd: row?.bodyMd ?? "", updatedAt: row?.updatedAt ?? null };
  });

  return (
    <>
      <AdminPageHeader
        title="Jogi oldalak"
        description="Az Adatkezelési tájékoztató és a Cookie tájékoztató szövege, valamint az adatkezelő adatai."
        viewHref="/adatkezelesi-tajekoztato"
      />
      <LegalEditor siteName={settings.general.siteName} legal={settings.legal} docs={docs} />
    </>
  );
}
