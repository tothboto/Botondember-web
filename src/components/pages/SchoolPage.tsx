import { ArrowLeft, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ExampleBadge } from "@/components/site/ExampleBadge";
import { Markdown } from "@/components/site/Markdown";
import type { Page, School } from "@/db/schema";
import { getLocalizer } from "@/lib/content-i18n/localize";
import { getImages } from "@/lib/data/media";
import { pageHref, pageTitleKey } from "@/lib/data/pages";
import { getI18n } from "@/lib/i18n/server";
import { PageIcon } from "@/lib/icons";

/** Egy iskola fordítható mezői az aloldalon. */
export const SCHOOL_FIELDS = ["name", "kind", "city", "address", "years", "lead"] as const;

/** Egy iskola saját aloldala (`/iskolaim/<slug>`): adatok, kép és szabad szöveg. */
export async function SchoolPage({ page, school: row }: { page: Page; school: School }) {
  const [{ t }, images, l] = await Promise.all([getI18n(), getImages(), getLocalizer()]);
  const school = l.row("schools", row, SCHOOL_FIELDS);
  const body = l.get("schools", row.id, "bodyMd", row.bodyMd);
  const image = images(row.mediaId);

  const facts = [
    { label: t("schools.years"), value: school.years, lang: school.lang.years },
    { label: t("schools.place"), value: school.city, lang: school.lang.city },
    { label: t("schools.address"), value: school.address, lang: school.lang.address },
  ].filter((fact) => fact.value);

  return (
    <div className="flex-1 bg-page-bg pb-16 text-page-fg">
      <div className="container-page pt-8 sm:pt-10">
        <Link
          href={pageHref(page)}
          className="inline-flex items-center gap-2 rounded-md font-semibold text-page-accent-text underline-offset-4 hover:underline"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          {t("schools.back")}
        </Link>
      </div>

      <header className="container-page pt-6 pb-8">
        <p className="flex items-center gap-2 text-sm font-bold tracking-[0.22em] text-page-accent-text uppercase">
          <PageIcon name={page.icon} className="h-5 w-5 shrink-0" />
          {t(pageTitleKey(page))}
        </p>
        <h1
          lang={school.lang.name}
          className="mt-3 font-display text-[clamp(2rem,5.5vw,3.5rem)] leading-tight font-black tracking-tight"
        >
          {school.name}
        </h1>
        {school.kind && (
          <p lang={school.lang.kind} className="mt-2 text-lg text-page-muted">
            {school.kind}
          </p>
        )}
        {row.isExample && <ExampleBadge label={t("common.example")} className="mt-3 w-fit" />}
      </header>

      {image && (
        <div className="container-page">
          <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-page-surface ring-1 ring-page-line">
            <Image
              src={image.src}
              alt={image.alt}
              lang={image.altLang}
              fill
              preload
              sizes="(min-width: 1280px) 1216px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0">
          {school.lead && (
            <p lang={school.lang.lead} className="font-display text-xl leading-relaxed text-page-fg sm:text-2xl">
              {school.lead}
            </p>
          )}
          {body.text && (
            <Markdown lang={body.lang} className="mt-6 max-w-3xl prose-lg" newTabLabel={t("common.opensInNewTab")}>
              {body.text}
            </Markdown>
          )}
        </div>

        {(facts.length > 0 || row.link) && (
          <aside className="h-fit rounded-2xl bg-page-surface p-5 ring-1 ring-page-line">
            <dl className="space-y-3">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs font-bold tracking-[0.18em] text-page-muted uppercase">{fact.label}</dt>
                  <dd lang={fact.lang} className="font-display text-lg font-bold">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
            {row.link && (
              <a
                href={row.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-page-accent px-4 py-2.5 font-bold text-[var(--page-accent-contrast)] hover:brightness-110"
              >
                {t("schools.website")}
                <ExternalLink aria-hidden className="h-4 w-4" />
                <span className="sr-only">{t("common.opensInNewTab")}</span>
              </a>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
