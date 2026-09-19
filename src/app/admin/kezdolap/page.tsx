import type { Metadata } from "next";
import { HomeForm } from "@/components/admin/editors/HomeForm";
import { MediaLibraryProvider } from "@/components/admin/MediaLibrary";
import { AdminPageHeader } from "@/components/admin/ui";
import { getDb } from "@/db/client";
import { requireAdminPage } from "@/lib/auth/guard";
import { readAllSettings } from "@/lib/data/settings";
import { listMedia } from "@/lib/media/library";

export const metadata: Metadata = { title: "Kezdőlap – Admin" };

export default async function AdminHomePage() {
  await requireAdminPage();
  const [settings, media] = await Promise.all([readAllSettings(), listMedia(getDb())]);
  return (
    <MediaLibraryProvider initial={media}>
      <AdminPageHeader
        title="Kezdőlap"
        description="Egyetlen nagy kép és egy rövid, ütős üzenet – a Rainbow Six hangulatában. Jobb oldalt élőben látod, hogyan fog kinézni."
        viewHref="/"
      />
      <HomeForm initial={settings.home} />
    </MediaLibraryProvider>
  );
}
