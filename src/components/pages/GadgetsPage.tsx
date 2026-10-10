import { ExternalLink, Laptop } from "lucide-react";
import Image from "next/image";
import { EmptyState } from "@/components/site/EmptyState";
import { ExampleBadge } from "@/components/site/ExampleBadge";
import { PageHeader } from "@/components/site/PageHeader";
import { Stars } from "@/components/site/Stars";
import type { Gadget, Page } from "@/db/schema";
import type { LocalizedRow } from "@/lib/content-i18n/localizer";
import { getLocalizer } from "@/lib/content-i18n/localize";
import { getGadgets } from "@/lib/data/content";
import { getImages } from "@/lib/data/media";
import { pageTitleKey } from "@/lib/data/pages";
import { getI18n } from "@/lib/i18n/server";

/** Az eszközök fordítható mezői. */
export const GADGET_FIELDS = ["name", "category", "maker", "since", "note"] as const;

/**
 * Kedvenc eszközeim – katalógus-stílusú lista: az azonos csoportba
 * (kategóriába) írt eszközök egy blokkba kerülnek. A csoport nevét az Adminban
 * szabadon be lehet írni, így nem digitális tárgyak is felvehetők.
 */
export async function GadgetsPage({ page }: { page: Page }) {
  const [{ t }, rows, images, l] = await Promise.all([getI18n(), getGadgets(), getImages(), getLocalizer()]);
  const intro = l.get("pages", page.id, "introMd", page.introMd);
  const items = rows.map((row) => l.row("gadgets", row, GADGET_FIELDS));

  // Csoportosítás a MAGYAR kategória szerint (így minden nyelven ugyanazok a
  // csoportok), a csoport felirata viszont a látogató nyelvén jelenik meg.
  // A csoportok sorrendje: ahogy az első elemük a listában szerepel.
  type Row = LocalizedRow<Gadget, (typeof GADGET_FIELDS)[number]>;
  const groups = new Map<string, { title: string; lang?: string; items: Row[] }>();
  rows.forEach((row, index) => {
    const item = items[index];
    const source = row.category.trim();
    const key = source.toLocaleLowerCase("hu");
    const group = groups.get(key);
    if (group) {
      group.items.push(item);
      return;
    }
    groups.set(key, {
      title: item.category.trim() || t("gadgets.other"),
      lang: source ? item.lang.category : undefined,
      items: [item],
    });
  });

  let imageIndex = 0;

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
          <div className="space-y-12">
            {[...groups.entries()].map(([key, group]) => (
              <section key={key}>
                <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 border-page-accent pb-2">
                  <span lang={group.lang} className="font-display text-2xl font-bold tracking-wide uppercase">
                    {group.title}
                  </span>
                  {/* Egy elemnél elhagyjuk: a „{count} darab” alak egy nyelven sem
                      helyes egyesben (pl. „1 items”). */}
                  {group.items.length > 1 && (
                    <span className="text-sm font-semibold text-page-muted">
                      {t("gadgets.count", { count: group.items.length })}
                    </span>
                  )}
                </h2>

                <ul className="mt-6 grid gap-5 lg:grid-cols-2">
                  {group.items.map((item) => {
                    const image = images(item.mediaId);
                    const first = imageIndex++ === 0;
                    const meta = [item.maker, item.since].filter(Boolean);
                    return (
                      <li key={item.id}>
                        <article className="flex h-full gap-4 rounded-2xl bg-page-surface p-4 ring-1 ring-page-line">
                          <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-page-surface-2 sm:w-32">
                            {image ? (
                              <Image
                                src={image.src}
                                alt={image.alt}
                                lang={image.altLang}
                                fill
                                preload={first}
                                sizes="(min-width: 640px) 128px, 96px"
                                className="object-cover"
                              />
                            ) : (
                              <Laptop aria-hidden className="absolute inset-0 m-auto h-10 w-10 text-page-accent" strokeWidth={1.6} />
                            )}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            {item.isExample && <ExampleBadge label={t("common.example")} className="w-fit" />}
                            <h3 lang={item.lang.name} className="font-display text-lg leading-tight font-bold">
                              {item.name}
                            </h3>
                            {meta.length > 0 && (
                              <p className="text-sm text-page-muted">
                                {item.maker && (
                                  <>
                                    <span className="sr-only">{t("gadgets.maker")}: </span>
                                    <span lang={item.lang.maker}>{item.maker}</span>
                                  </>
                                )}
                                {meta.length === 2 && " · "}
                                {item.since && (
                                  <>
                                    <span className="sr-only">{t("gadgets.since")}: </span>
                                    <span lang={item.lang.since}>{item.since}</span>
                                  </>
                                )}
                              </p>
                            )}
                            <Stars rating={item.rating} label={t("games.ratingValue", { rating: item.rating })} />
                            {item.note && (
                              <p lang={item.lang.note} className="text-sm text-page-muted">
                                {item.note}
                              </p>
                            )}
                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-auto inline-flex w-fit items-center gap-1.5 pt-1 text-sm font-bold text-page-accent-text underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
                              >
                                {t("gadgets.link")}
                                <ExternalLink aria-hidden className="h-4 w-4" />
                                <span className="sr-only">
                                  {" – "}
                                  <span lang={item.lang.name}>{item.name}</span> ({t("common.opensInNewTab")})
                                </span>
                              </a>
                            )}
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
