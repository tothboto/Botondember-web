import { Crown, ExternalLink } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/site/EmptyState";
import { ExampleBadge } from "@/components/site/ExampleBadge";
import { Markdown } from "@/components/site/Markdown";
import { PageHeader } from "@/components/site/PageHeader";
import type { FootballSection, Page } from "@/db/schema";
import { getLocalizer } from "@/lib/content-i18n/localize";
import { getFootball } from "@/lib/data/content";
import { getImages } from "@/lib/data/media";
import { pageTitleKey } from "@/lib/data/pages";
import { getI18n } from "@/lib/i18n/server";
import { PageIcon } from "@/lib/icons";

function SectionTitle({ children, id }: { children: ReactNode; id: string }) {
  return (
    <div>
      <span aria-hidden className="block h-1.5 w-16 bg-page-accent" />
      <h2 id={id} className="mt-5 font-display text-[clamp(2rem,5vw,3.25rem)] leading-none font-black tracking-tight uppercase">
        {children}
      </h2>
    </div>
  );
}

/**
 * Kedvenc focicsapatom: Real Madrid – prémium klub-oldal: fehér, sötétkék,
 * arany; nagy stadion hero, elegáns, sok levegő, nagybetűs címek.
 * A szekciók sorrendje és láthatósága az Adminból állítható.
 * Jogvédett kép, címer vagy logó nincs a kódban – ezeket Botond töltheti fel.
 */
export async function FootballPage({ page }: { page: Page }) {
  const [{ t }, data, images, l] = await Promise.all([getI18n(), getFootball(), getImages(), getLocalizer()]);
  const pageTitle = t(pageTitleKey(page));
  const intro = l.get("pages", page.id, "introMd", page.introMd);
  const players = data.players.map((player) => l.row("football_players", player, ["name", "position", "note"] as const));
  const moments = data.moments.map((moment) => l.row("football_moments", moment, ["year", "title", "body"] as const));
  const facts = data.facts.map((fact) => l.row("football_facts", fact, ["label", "value"] as const));
  const sectionText = (section: FootballSection, field: "title" | "bodyMd") =>
    l.get("football_sections", section.id, field, section[field]);
  const newTab = t("common.opensInNewTab");
  const sections = data.sections.filter((section) => section.visible);
  const hasHero = sections.some((section) => section.type === "hero");

  const render = (section: FootballSection) => {
    switch (section.type) {
      case "hero": {
        const image = images(section.mediaId);
        // Üres cím esetén a lap (felület szerint fordított) címe jelenik meg.
        const heading = section.title ? sectionText(section, "title") : { text: pageTitle, lang: l.locale };
        const subtitle = sectionText(section, "bodyMd");
        return (
          <section
            key={section.id}
            className="relative isolate flex min-h-[62vh] items-end overflow-hidden bg-rm-navy text-white [--focus:var(--rm-gold)] [--page-accent-text:var(--rm-gold)] [--page-fg:#ffffff] [--page-muted:#dbe4f0] lg:min-h-[72vh]"
          >
            {image && (
              <Image
                src={image.src}
                alt={image.alt}
                lang={image.altLang}
                fill
                preload
                sizes="100vw"
                className="-z-20 object-cover"
              />
            )}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-t from-[#050f22] via-[#0b1f3f]/70 to-[#0b1f3f]/20"
            />
            <div className="container-page pt-24 pb-14">
              <p className="flex items-center gap-2 text-sm font-bold tracking-[0.28em] text-rm-gold uppercase">
                <PageIcon name={page.icon} className="h-5 w-5 shrink-0" />
                {pageTitle}
              </p>
              <h1
                lang={heading.lang}
                className="mt-4 font-display text-[clamp(3.2rem,11vw,8.5rem)] leading-[0.88] font-black tracking-tight uppercase"
              >
                {heading.text}
              </h1>
              {subtitle.text && (
                <p lang={subtitle.lang} className="mt-5 font-display text-xl font-semibold text-rm-gold italic sm:text-2xl">
                  {subtitle.text}
                </p>
              )}
              {intro.text && (
                <Markdown lang={intro.lang} className="mt-5 max-w-2xl prose-lg">
                  {intro.text}
                </Markdown>
              )}
            </div>
          </section>
        );
      }

      case "why": {
        const body = sectionText(section, "bodyMd");
        return (
          <section key={section.id} aria-labelledby="rm-why" className="container-page py-16 md:py-24">
            <div className="grid gap-8 md:grid-cols-[1fr_2fr] md:gap-16">
              <SectionTitle id="rm-why">{t("football.section.why")}</SectionTitle>
              {body.text ? (
                <Markdown lang={body.lang} className="prose-lg" newTabLabel={newTab}>
                  {body.text}
                </Markdown>
              ) : (
                <EmptyState text={t("common.empty")} />
              )}
            </div>
          </section>
        );
      }

      case "players":
        return (
          <section key={section.id} aria-labelledby="rm-players" className="bg-page-surface py-16 md:py-24">
            <div className="container-page">
              <SectionTitle id="rm-players">{t("football.section.players")}</SectionTitle>
              {players.length === 0 ? (
                <EmptyState text={t("common.empty")} className="mt-10" />
              ) : (
                <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {players.map((player) => {
                    const image = images(player.mediaId);
                    return (
                      <li key={player.id}>
                        <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-rm-navy text-white shadow-md ring-1 ring-black/5 dark:bg-[#050f22]">
                          <div className="relative aspect-[4/5]">
                            {image && (
                              <Image
                                src={image.src}
                                alt={image.alt}
                                lang={image.altLang}
                                fill
                                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                className="object-cover"
                              />
                            )}
                            <div
                              aria-hidden
                              className="absolute inset-0 bg-gradient-to-t from-[#07152d] via-[#07152d]/35 to-transparent"
                            />
                            {player.number && (
                              <span
                                aria-hidden
                                className="absolute top-3 right-5 font-display text-8xl leading-none font-black text-rm-gold [text-shadow:0_4px_24px_rgb(0_0_0/0.5)]"
                              >
                                {player.number}
                              </span>
                            )}
                            <div className="absolute inset-x-0 bottom-0 p-5">
                              {player.position && (
                                <p className="text-xs font-bold tracking-[0.25em] text-rm-gold uppercase">
                                  <span className="sr-only">{t("football.position")}: </span>
                                  <span lang={player.lang.position}>{player.position}</span>
                                </p>
                              )}
                              <h3 lang={player.lang.name} className="mt-1 font-display text-2xl leading-tight font-black uppercase">
                                {player.name}
                              </h3>
                              {player.number && (
                                <p className="sr-only">
                                  {t("football.number")}: {player.number}
                                </p>
                              )}
                            </div>
                          </div>
                          {(player.note || player.isExample) && (
                            <div className="flex flex-1 flex-col gap-3 p-5 pt-4">
                              {player.note && (
                                <p lang={player.lang.note} className="text-white/85">
                                  {player.note}
                                </p>
                              )}
                              {player.isExample && <ExampleBadge label={t("common.example")} className="w-fit" />}
                            </div>
                          )}
                        </article>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        );

      case "moments":
        return (
          <section key={section.id} aria-labelledby="rm-moments" className="container-page py-16 md:py-24">
            <SectionTitle id="rm-moments">{t("football.section.moments")}</SectionTitle>
            {moments.length === 0 ? (
              <EmptyState text={t("common.empty")} className="mt-10" />
            ) : (
              <ol className="mt-12 space-y-12 border-l-2 border-page-accent pl-7 sm:pl-10">
                {moments.map((moment) => {
                  const image = images(moment.mediaId);
                  return (
                    <li key={moment.id} className="relative">
                      <span
                        aria-hidden
                        className="absolute top-2 -left-[calc(1.75rem+9px)] h-4 w-4 rounded-full bg-page-accent ring-4 ring-page-bg sm:-left-[calc(2.5rem+9px)]"
                      />
                      <div className="grid gap-5 md:grid-cols-[1fr_18rem] md:items-start">
                        <div className="space-y-2">
                          {moment.year && (
                            <p lang={moment.lang.year} className="font-display text-4xl leading-none font-black text-page-accent-text">
                              {moment.year}
                            </p>
                          )}
                          <h3 lang={moment.lang.title} className="font-display text-2xl font-bold uppercase">
                            {moment.title}
                          </h3>
                          {moment.body && (
                            <p lang={moment.lang.body} className="max-w-2xl text-lg text-page-muted">
                              {moment.body}
                            </p>
                          )}
                          {moment.link && (
                            <a
                              href={moment.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 font-bold text-page-accent-text underline-offset-4 hover:underline"
                            >
                              {t("common.visit")}
                              <ExternalLink aria-hidden className="h-4 w-4" />
                              <span className="sr-only">{newTab}</span>
                            </a>
                          )}
                          {moment.isExample && <ExampleBadge label={t("common.example")} className="w-fit" />}
                        </div>
                        {image && (
                          <div className="relative aspect-[3/2] overflow-hidden rounded-xl ring-1 ring-page-line">
                            <Image
                              src={image.src}
                              alt={image.alt}
                              lang={image.altLang}
                              fill
                              sizes="(min-width: 768px) 288px, 100vw"
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        );

      case "facts":
        return (
          <section
            key={section.id}
            aria-labelledby="rm-facts"
            className="bg-rm-navy py-16 text-white [--focus:var(--rm-gold)] [--page-accent:var(--rm-gold)] md:py-24 dark:bg-[#050f22]"
          >
            <div className="container-page">
              <SectionTitle id="rm-facts">{t("football.section.facts")}</SectionTitle>
              {facts.length === 0 ? (
                <p className="mt-8 text-white/80">{t("common.empty")}</p>
              ) : (
                <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {facts.map((fact) => (
                    <div key={fact.id} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/15">
                      <dt lang={fact.lang.label} className="text-xs font-bold tracking-[0.25em] text-rm-gold uppercase">
                        {fact.label}
                      </dt>
                      <dd lang={fact.lang.value} className="mt-2 font-display text-2xl font-bold">
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </section>
        );

      case "link":
        if (!section.link) return null;
        return (
          <section key={section.id} aria-labelledby="rm-link" className="container-page py-16 text-center md:py-20">
            <h2 id="rm-link" className="sr-only">
              {t("football.section.link")}
            </h2>
            <a
              href={section.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-rm-navy px-7 py-4 font-display text-base font-bold tracking-wider text-white uppercase ring-2 ring-rm-gold hover:bg-rm-blue sm:text-lg dark:bg-rm-gold dark:text-rm-navy dark:hover:bg-[var(--gold-light)]"
            >
              <Crown aria-hidden className="h-5 w-5 shrink-0" />
              {t("football.officialLink")}
              <ExternalLink aria-hidden className="h-5 w-5 shrink-0" />
              <span className="sr-only">{newTab}</span>
            </a>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-page-bg text-page-fg">
      {!hasHero && (
        <PageHeader title={pageTitle} icon={page.icon} intro={intro.text} introLang={intro.lang} titleClassName="font-display" />
      )}
      {sections.map(render)}
    </div>
  );
}
