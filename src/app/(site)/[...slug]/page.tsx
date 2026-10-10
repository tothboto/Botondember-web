import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { FootballPage } from "@/components/pages/FootballPage";
import { GadgetsPage } from "@/components/pages/GadgetsPage";
import { GamesPage } from "@/components/pages/GamesPage";
import { GenericPage } from "@/components/pages/GenericPage";
import { HobbiesPage } from "@/components/pages/HobbiesPage";
import { SchoolPage } from "@/components/pages/SchoolPage";
import { SchoolsPage } from "@/components/pages/SchoolsPage";
import { YoutubePage } from "@/components/pages/YoutubePage";
import type { Page, School } from "@/db/schema";
import { getLocalizer } from "@/lib/content-i18n/localize";
import { getSchoolBySlug } from "@/lib/data/content";
import { getImages } from "@/lib/data/media";
import { getPageBySlug, pageTitleKey } from "@/lib/data/pages";
import { getI18n } from "@/lib/i18n/server";

/**
 * Egy aloldal (`/hobbijaim`), vagy egy iskola saját aloldala (`/iskolaim/<slug>`).
 * Más kétszintű cím nincs, így minden egyéb 404.
 */
async function resolvePage(slugParts: string[]): Promise<{ page: Page; school?: School } | null> {
  const page = await getPageBySlug(decodeURIComponent(slugParts[0] ?? ""));
  if (!page) return null;
  if (slugParts.length === 1) return { page };
  if (slugParts.length === 2 && page.template === "schools") {
    const school = await getSchoolBySlug(decodeURIComponent(slugParts[1]));
    return school ? { page, school } : null;
  }
  return null;
}

export async function generateMetadata({ params }: PageProps<"/[...slug]">): Promise<Metadata> {
  const found = await resolvePage((await params).slug);
  if (!found) return {};
  const { page, school } = found;
  const [{ t }, images, l] = await Promise.all([getI18n(), getImages(), getLocalizer()]);

  if (school) {
    const name = l.get("schools", school.id, "name", school.name).text;
    const description = l.get("schools", school.id, "lead", school.lead).text || undefined;
    const image = images(school.mediaId);
    return {
      title: name,
      description,
      alternates: { canonical: `/${page.slug}/${school.slug}` },
      openGraph: {
        title: name,
        description,
        images: image ? [{ url: image.src, width: image.width, height: image.height, alt: image.alt }] : undefined,
      },
    };
  }

  const title = t(pageTitleKey(page));
  const hero = images(page.heroMediaId);
  const description = l.get("pages", page.id, "seoDescription", page.seoDescription).text || undefined;
  return {
    title,
    description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      title,
      description,
      images: hero ? [{ url: hero.src, width: hero.width, height: hero.height, alt: hero.alt }] : undefined,
    },
  };
}

/** Az aloldalak: minden sablonnak saját stílusa van (világos + sötét változattal). */
export default async function DynamicPage({ params, searchParams }: PageProps<"/[...slug]">) {
  const found = await resolvePage((await params).slug);
  if (!found) notFound();
  const { page, school } = found;

  // Az Adminban aloldalanként beállítható akcentusszín.
  const style = page.accentColor ? ({ "--page-accent": page.accentColor } as CSSProperties) : undefined;

  let content;
  if (school) {
    content = <SchoolPage page={page} school={school} />;
  } else {
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
      case "schools":
        content = <SchoolsPage page={page} />;
        break;
      case "gadgets":
        content = <GadgetsPage page={page} />;
        break;
      default:
        content = <GenericPage page={page} />;
    }
  }

  return (
    <div className={`tpl-${page.template} flex flex-1 flex-col`} style={style}>
      {content}
    </div>
  );
}
