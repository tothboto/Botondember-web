import type { Metadata } from "next";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/auth/guard";
import { readAllSettings } from "@/lib/data/settings";
import { I18nProvider } from "@/lib/i18n/client";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Az Admin felület kerete – belépés nélkül a kezdőlapra küld, megnyitott belépő ablakkal. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminPage();
  const [settings, dict] = await Promise.all([readAllSettings(), getDictionary("hu")]);
  return (
    <I18nProvider locale="hu" dict={dict}>
      <AdminShell username={session.username} siteTitle={settings.general.siteName} logoutAction={logoutAction}>
        {children}
      </AdminShell>
    </I18nProvider>
  );
}
