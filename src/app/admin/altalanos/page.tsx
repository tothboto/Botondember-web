import type { Metadata } from "next";
import { FaviconCard } from "@/components/admin/editors/FaviconCard";
import { GeneralForm } from "@/components/admin/editors/GeneralForm";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guard";
import { readAllSettings } from "@/lib/data/settings";

export const metadata: Metadata = { title: "Általános – Admin" };

export default async function AdminGeneralPage() {
  await requireAdminPage();
  const settings = await readAllSettings();
  const { faviconVersion, ...general } = settings.general;
  return (
    <>
      <AdminPageHeader
        title="Általános"
        description="Az oldal neve, a fejléc felirata, az alap téma, a lábléc és a böngészőfül ikonja."
        viewHref="/"
      />
      <div className="space-y-8">
        <GeneralForm general={general} footer={settings.footer} />
        <FaviconCard version={faviconVersion} siteName={settings.general.siteName} />
      </div>
    </>
  );
}
