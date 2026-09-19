import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/site/PageHeader";
import { getPageBySlug, pageTitleKey } from "@/lib/data/pages";
import { getI18n } from "@/lib/i18n/server";

async function resolvePage(slugParts: string[]) {
  if (slugParts.length !== 1) return null;
  return getPageBySlug(decodeURIComponent(slugParts[0]));
}

export async function generateMetadata({ params }: PageProps<"/[...slug]">): Promise<Metadata> {
  const page = await resolvePage((await params).slug);
  if (!page) return {};
  const { t } = await getI18n();
  return { title: t(pageTitleKey(page)), description: page.seoDescription || undefined };
}

/** Az aloldalak (Hobbijaim, Játékaim, YouTube, Real Madrid és az „Általános” oldalak). */
export default async function DynamicPage({ params }: PageProps<"/[...slug]">) {
  const page = await resolvePage((await params).slug);
  if (!page) notFound();
  const { t } = await getI18n();

  return (
    <div className={`tpl-${page.template} flex-1 bg-page-bg text-page-fg`}>
      <PageHeader title={t(pageTitleKey(page))} icon={page.icon} intro={page.introMd} />
    </div>
  );
}
