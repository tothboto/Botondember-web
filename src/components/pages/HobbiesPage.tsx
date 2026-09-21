import Image from "next/image";
import { EmptyState } from "@/components/site/EmptyState";
import { ExampleBadge } from "@/components/site/ExampleBadge";
import { Markdown } from "@/components/site/Markdown";
import type { Page } from "@/db/schema";
import { getHobbies } from "@/lib/data/content";
import { getImages } from "@/lib/data/media";
import { pageTitleKey } from "@/lib/data/pages";
import { getI18n } from "@/lib/i18n/server";
import { PageIcon } from "@/lib/icons";

/**
 * Hobbijaim – sportos magazin / edzésnapló stílus: nagy, bátor tipográfia,
 * erős kék és arany színblokkok, átlós díszítés, sok levegő.
 */
export async function HobbiesPage({ page }: { page: Page }) {
  const [{ t }, items, images] = await Promise.all([getI18n(), getHobbies(), getImages()]);
  const title = t(pageTitleKey(page));

  return (
    <div className="flex-1 bg-page-bg text-page-fg">
      {/* Magazin-címlap */}
      <header className="relative isolate overflow-hidden border-b-[6px] border-page-accent">
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 -z-10 hidden w-[38%] bg-page-accent-2 [clip-path:polygon(24%_0,100%_0,100%_100%,0_100%)] lg:block"
        >
          <div className="stripes-diagonal absolute inset-0" />
        </div>
        <div
          aria-hidden
          className="absolute inset-y-0 right-[34.5%] -z-10 hidden w-10 bg-page-accent [clip-path:polygon(60%_0,100%_0,40%_100%,0_100%)] lg:block"
        />
        <div className="container-page py-12 sm:py-16 lg:py-24">
          <h1 className="flex items-center gap-4 font-magazine text-[clamp(3rem,8.5vw,6.5rem)] leading-[0.92] font-bold tracking-tight text-balance uppercase sm:gap-6 lg:max-w-[58%]">
            <span
              aria-hidden
              className="grid h-[0.82em] w-[0.82em] shrink-0 -skew-x-6 place-items-center bg-page-accent text-rm-navy"
            >
              <PageIcon name={page.icon} className="h-[0.5em] w-[0.5em] skew-x-6" strokeWidth={2.4} />
            </span>
            <span>{title}</span>
          </h1>
          {page.introMd && (
            <Markdown className="mt-6 max-w-xl prose-lg sm:prose-xl lg:max-w-[52%]">{page.introMd}</Markdown>
          )}
        </div>
      </header>

      <section className="container-page py-12 sm:py-16">
        {items.length === 0 ? (
          <EmptyState text={t("common.empty")} />
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => {
              const image = images(item.mediaId);
              return (
                <li key={item.id}>
                  <article
                    className={`flex h-full flex-col bg-page-surface ring-1 ring-page-line ${
                      index % 2 === 0 ? "border-t-8 border-page-accent-2" : "border-t-8 border-page-accent"
                    }`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-page-surface-2 [clip-path:polygon(0_0,100%_0,100%_86%,0_100%)]">
                      {image && (
                        <Image
                          src={image.src}
                          alt={image.alt}
                          lang="hu"
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      )}
                      <span
                        aria-hidden
                        className="absolute top-3 right-4 font-magazine text-6xl leading-none font-bold text-white [text-shadow:0_2px_12px_rgb(0_0_0/0.45)]"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    {item.tag && (
                      <span className="relative z-10 -mt-7 ml-5 w-fit -skew-x-12 bg-page-accent px-3 py-1 shadow-sm">
                        <span
                          lang="hu"
                          className="inline-block skew-x-12 font-magazine text-sm font-bold tracking-[0.2em] text-rm-navy uppercase"
                        >
                          {item.tag}
                        </span>
                      </span>
                    )}

                    <div className="flex flex-1 flex-col gap-3 p-5 pt-4">
                      {item.isExample && <ExampleBadge label={t("common.example")} className="w-fit" />}
                      <h2 lang="hu" className="font-magazine text-3xl leading-none font-bold uppercase">
                        {item.title}
                      </h2>
                      {item.since && (
                        <p className="flex items-center gap-2 text-sm">
                          <span aria-hidden className="h-5 w-1.5 bg-page-accent-2" />
                          <span className="font-semibold tracking-wider text-page-muted uppercase">
                            {t("hobbies.since")}:
                          </span>
                          <span lang="hu" className="font-magazine text-xl font-bold">
                            {item.since}
                          </span>
                        </p>
                      )}
                      {item.body && (
                        <p lang="hu" className="text-page-muted">
                          {item.body}
                        </p>
                      )}
                    </div>
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
