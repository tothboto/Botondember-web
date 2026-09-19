import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/NotFoundContent";
import { SiteChrome } from "@/components/site/SiteChrome";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("notFound.metaTitle") };
}

/** Minden más, nem létező címre (a teljes kerettel együtt). */
export default function GlobalNotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
