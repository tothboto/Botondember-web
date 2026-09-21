import { getLocalizer } from "@/lib/content-i18n/localize";
import { getAllSettings } from "@/lib/data/settings";
import { getVisiblePages, pageHref, pageMenuKey } from "@/lib/data/pages";
import { getI18n } from "@/lib/i18n/server";
import { PageIcon } from "@/lib/icons";
import { HeaderClient, type NavItem } from "./HeaderClient";

/** A fejléc adatai (szerveroldalon): felirat, menüpontok, nyelvek, belépési állapot. */
export async function SiteHeader({
  isAdmin,
  logoutAction,
}: {
  isAdmin: boolean;
  logoutAction?: () => Promise<void>;
}) {
  const [i18n, settings, pages, l] = await Promise.all([getI18n(), getAllSettings(), getVisiblePages(), getLocalizer()]);
  const title = l.get("settings", "general", "headerTitle", settings.general.headerTitle);

  // Az ikonokat itt, a szerveren rajzoljuk ki – így a teljes ikonkészlet nem kerül a böngészőbe letöltendő kódba.
  const navItems: NavItem[] = pages.map((page) => ({
    href: pageHref(page),
    label: i18n.t(pageMenuKey(page)),
    icon: <PageIcon name={page.icon} className="size-full" strokeWidth={2.2} />,
    template: page.template,
  }));

  return (
    <HeaderClient
      title={title.text}
      titleLang={title.lang}
      navItems={navItems}
      sticky={settings.general.stickyHeader}
      locales={i18n.locales}
      showFlags={i18n.showFlags}
      isAdmin={isAdmin}
      logoutAction={logoutAction}
    />
  );
}
