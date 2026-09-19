import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { FootballPage } from "@/components/pages/FootballPage";
import { GamesPage } from "@/components/pages/GamesPage";
import { GenericPage } from "@/components/pages/GenericPage";
import { HobbiesPage } from "@/components/pages/HobbiesPage";
import { YoutubePage } from "@/components/pages/YoutubePage";
import type { Page } from "@/db/schema";
import { getImages } from "@/lib/data/media";
import { getPageBySlug, pageTitleKey } from "@/lib/data/pages";
import { getI18n } from "@/lib/i18n/server";

async function resolvePage(slugParts: string[]): Promise<Page | null> {
  if (slugParts.length !== 1) return null;
  return getPageBySlug(decodeURIComponent(slugParts[0]));
}

export async function generateMetadata({ params }: PageProps<"/[...slug]">): Promise<Metadata> {
  const page = await resolvePage((await params).slug);
  if (!page) return {};
  const [{ t }, images] = await Promise.all([getI18n(), getImages()]);
  const title = t(pageTitleKey(page));
  const hero = images(page.heroMediaId);
  return {
    title,
    description: page.seoDescription || undefined,
    openGraph: {
      title,
      description: page.seoDescription || undefined,
      images: hero ? [{ url: hero.src, width: hero.width, height: hero.height, alt: hero.alt }] : undefined,
    },
  };
}

/** Az aloldalak: minden sablonnak saját stílusa van (világos + sötét változattal). */
export default async function DynamicPage({ params, searchParams }: PageProps<"/[...slug]">) {
  const page = await resolvePage((await params).slug);
  if (!page) notFound();

  // Az Adminban aloldalanként beállítható akcentusszín.
  const style = page.accentColor ? ({ "--page-accent": page.accentColor } as CSSProperties) : undefined;

  let content;
  switch (page.template) {
    case "hobbies":
      content = <HobbiesPage page={page} />;
      break;
    case "games":
      content = <GamesPage page={page} />;
      break;
    case "youtube": {
      const tab = (await searchParams).tab;
      content = <YoutubePage page={page} tab={typeof tab === "string" ? tab : "mind"} />;
      break;
    }
    case "football":
      content = <FootballPage page={page} />;
      break;
    default:
      content = <GenericPage page={page} />;
  }

  return (
    <div className={`tpl-${page.template} flex flex-1 flex-col`} style={style}>
      {content}
    </div>
  );
}
