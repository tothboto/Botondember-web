import { and, asc, eq, like } from "drizzle-orm";
import type { Metadata } from "next";
import { AppearanceForm, type AccentPage } from "@/components/admin/editors/AppearanceForm";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { pages, translations } from "@/db/schema";
import { requireAdminPage } from "@/lib/auth/guard";
import { readAllSettings } from "@/lib/data/settings";
import { pageMenuKey } from "@/lib/data/pages";
import { SOURCE_LOCALE } from "@/lib/i18n/messages";

export const metadata: Metadata = { title: "Megjelenés – Admin" };

export default async function AdminAppearancePage() {
  await requireAdminPage();
  const db = getDb();
  const [settings, pageRows, labels] = await Promise.all([
    readAllSettings(),
    db.select().from(pages).orderBy(asc(pages.sort), asc(pages.id)),
    db
      .select({ key: translations.key, value: translations.value })
      .from(translations)
      .where(and(like(translations.key, "page.%.menu"), eq(translations.locale, SOURCE_LOCALE))),
  ]);
  const accentPages: AccentPage[] = pageRows.map((page) => ({
    id: page.id,
    name: labels.find((l) => l.key === pageMenuKey(page))?.value || page.slug,
    icon: page.icon,
    template: page.template,
    accentColor: page.accentColor,
  }));

  return (
    <>
      <AdminPageHeader
        title="Megjelenés"
        description="Színek és betűtípusok. Mentés előtt az előnézetben kipróbálhatod, és azt is látod, elég jól olvasható-e a szöveg."
        viewHref="/"
      />
      <AppearanceForm appearance={settings.appearance} pages={accentPages} />
    </>
  );
}
