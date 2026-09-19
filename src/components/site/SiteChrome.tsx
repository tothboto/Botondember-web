import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import { getSession } from "@/lib/auth/session";
import { I18nProvider } from "@/lib/i18n/client";
import { getI18n } from "@/lib/i18n/server";
import { BackToTop } from "./BackToTop";
import { LoginDialog } from "./LoginDialog";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/**
 * A publikus oldalak közös kerete: „Ugrás a tartalomra” link, fejléc,
 * tartalom, lábléc, „Vissza a tetejére” gomb és a belépő ablak.
 */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const [i18n, session] = await Promise.all([getI18n(), getSession()]);
  const isAdmin = session !== null;
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
      {!isAdmin && <LoginDialog />}
    </I18nProvider>
  );
}
