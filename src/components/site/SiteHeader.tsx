import { getAllSettings } from "@/lib/data/settings";
import { getVisiblePages, pageHref, pageMenuKey } from "@/lib/data/pages";
import { getI18n } from "@/lib/i18n/server";
import { HeaderClient, type NavItem } from "./HeaderClient";

/** A fejléc adatai (szerveroldalon): felirat, menüpontok, nyelvek, belépési állapot. */
export async function SiteHeader({
  isAdmin,
  logoutAction,
}: {
  isAdmin: boolean;
  logoutAction?: () => Promise<void>;
}) {
  const [i18n, settings, pages] = await Promise.all([getI18n(), getAllSettings(), getVisiblePages()]);

  const navItems: NavItem[] = pages.map((page) => ({
    href: pageHref(page),
    label: i18n.t(pageMenuKey(page)),
    icon: page.icon,
    template: page.template,
  }));

  return (
    <HeaderClient
      title={settings.general.headerTitle}
      navItems={navItems}
      sticky={settings.general.stickyHeader}
      locales={i18n.locales}
      showFlags={i18n.showFlags}
      isAdmin={isAdmin}
      logoutAction={logoutAction}
    />
  );
}
