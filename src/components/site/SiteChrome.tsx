import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n/client";
import { getI18n } from "@/lib/i18n/server";
import { BackToTop } from "./BackToTop";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/**
 * A publikus oldalak közös kerete: „Ugrás a tartalomra” link, fejléc,
 * tartalom, lábléc és a „Vissza a tetejére” gomb.
 */
export async function SiteChrome({
  children,
  isAdmin = false,
  logoutAction,
  overlay,
}: {
  children: ReactNode;
  isAdmin?: boolean;
  logoutAction?: () => Promise<void>;
  /** Az oldal fölött megjelenő elemek (pl. a belépő ablak). */
  overlay?: ReactNode;
}) {
  const i18n = await getI18n();
  return (
    <I18nProvider locale={i18n.locale} dict={i18n.dict}>
      <a href="#main-content" className="skip-link">
        {i18n.t("common.skipToContent")}
      </a>
      <SiteHeader isAdmin={isAdmin} logoutAction={logoutAction} />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </main>
      <SiteFooter />
      <BackToTop />
      {overlay}
    </I18nProvider>
  );
}
