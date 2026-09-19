import { asc, like } from "drizzle-orm";
import type { Metadata } from "next";
import { MenuEditor, type MenuLabels, type MenuPage } from "@/components/admin/editors/MenuEditor";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { locales, pages, translations } from "@/db/schema";
import { requireAdminPage } from "@/lib/auth/guard";
import { pageMenuKey, pageTitleKey } from "@/lib/data/pages";

export const metadata: Metadata = { title: "Menü és aloldalak – Admin" };

export default async function AdminMenuPage() {
  await requireAdminPage();
  const db = getDb();
  const [pageRows, localeRows, labelRows] = await Promise.all([
    db.select().from(pages).orderBy(asc(pages.sort), asc(pages.id)),
    db.select().from(locales).orderBy(asc(locales.sort), asc(locales.code)),
    db.select().from(translations).where(like(translations.key, "page.%")),
  ]);

  const value = (key: string, locale: string) => labelRows.find((r) => r.key === key && r.locale === locale)?.value ?? "";
  const menuPages: MenuPage[] = pageRows.map((page) => ({
    id: page.id,
    key: page.key,
    slug: page.slug,
    template: page.template,
    icon: page.icon,
    visible: page.visible,
    isCore: page.isCore,
    labels: Object.fromEntries(
      localeRows.map((l) => [l.code, { menu: value(pageMenuKey(page), l.code), title: value(pageTitleKey(page), l.code) }]),
    ) as MenuLabels,
  }));

  return (
    <>
      <AdminPageHeader
        title="Menü és aloldalak"
        description="Itt rendezheted a menüpontokat, választhatsz nekik ikont, és új aloldalt is létrehozhatsz. A „Tartalom” gombbal az oldal szövegeit és képeit szerkesztheted."
        viewHref="/"
      />
      <MenuEditor
        pages={menuPages}
        locales={localeRows.map((l) => ({ code: l.code, name: l.name, flag: l.flag, enabled: l.enabled }))}
      />
    </>
  );
}
