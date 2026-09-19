import type { Metadata } from "next";
import { LegalPage } from "@/components/pages/LegalPage";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("footer.cookies") };
}

export default function CookiePage() {
  return <LegalPage slug="cookie" titleKey="footer.cookies" />;
}
