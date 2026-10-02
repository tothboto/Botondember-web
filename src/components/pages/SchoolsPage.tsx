import { ArrowRight, GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/site/EmptyState";
import { ExampleBadge } from "@/components/site/ExampleBadge";
import { PageHeader } from "@/components/site/PageHeader";
import type { Page } from "@/db/schema";
import { getLocalizer } from "@/lib/content-i18n/localize";
import { getSchools } from "@/lib/data/content";
import { getImages } from "@/lib/data/media";
import { pageHref, pageTitleKey } from "@/lib/data/pages";
import { getI18n } from "@/lib/i18n/server";

/** Az iskolák fordítható mezői a listában. */
export const SCHOOL_CARD_FIELDS = ["name", "kind", "city", "years", "lead"] as const;

/**
 * Iskoláim – évkönyv-hangulatú lista: minden iskola egy kártya, saját aloldallal
 * (`/iskolaim/<slug>`). Új iskolát az Adminban lehet felvenni.
 */
export async function SchoolsPage({ page }: { page: Page }) {
  const [{ t }, rows, images, l] = await Promise.all([getI18n(), getSchools(), getImages(), getLocalizer()]);
  const intro = l.get("pages", page.id, "introMd", page.introMd);
  const items = rows.map((school) => l.row("schools", school, SCHOOL_CARD_FIELDS));

  return (
    <div className="flex-1 bg-page-bg pb-16 text-page-fg">
      <PageHeader
        title={t(pageTitleKey(page))}
        icon={page.icon}
        intro={intro.text}
        introLang={intro.lang}
        titleClassName="font-display"
      />

      <section className="container-page">
        {items.length === 0 ? (
          <EmptyState text={t("common.empty")} />
        ) : (
          <ul className="grid gap-6 md:grid-cols-2">
            {items.map((school) => {
              const image = images(school.mediaId);
              const meta = [school.kind, school.city].filter(Boolean).join(" · ");
              return (
                <li key={school.id}>
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-page-surface shadow-sm ring-1 ring-page-line">
                    <Link
                      href={`${pageHref(page)}/${school.slug}`}
                      className="group flex h-full flex-col rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      <div className="relative aspect-[16/9] bg-page-surface-2">
                        {image ? (
                          <Image
                            src={image.src}
                            alt={image.alt}
                            lang={image.altLang}
                            fill
                            sizes="(min-width: 768px) 50vw, 100vw"
                            className="object-cover"
                          />
                        ) : (
                          <GraduationCap aria-hidden className="absolute inset-0 m-auto h-16 w-16 text-page-accent" strokeWidth={1.6} />
                        )}
                        {school.years && (
                          <span className="absolute top-3 left-3 rounded-full bg-page-accent px-3 py-1 font-display text-sm font-bold text-[var(--page-accent-contrast)]">
                            <span className="sr-only">{t("schools.years")}: </span>
                            {school.years}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-5">
                        {school.isExample && <ExampleBadge label={t("common.example")} className="w-fit" />}
                        <h2 lang={school.lang.name} className="font-display text-2xl leading-tight font-bold group-hover:underline">
                          {school.name}
                        </h2>
                        {meta && (
                          <p className="text-sm font-semibold tracking-wide text-page-muted uppercase">
                            <span lang={school.lang.kind}>{school.kind}</span>
                            {school.kind && school.city && " · "}
                            <span lang={school.lang.city}>{school.city}</span>
                          </p>
                        )}
                        {school.lead && (
                          <p lang={school.lang.lead} className="text-page-muted">
                            {school.lead}
                          </p>
                        )}
                        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 font-bold text-page-accent-text">
                          {t("schools.more")}
                          <ArrowRight aria-hidden className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
