import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { ExampleBadge } from "@/components/site/ExampleBadge";
import { Markdown } from "@/components/site/Markdown";
import { PageHeader } from "@/components/site/PageHeader";
import type { Page } from "@/db/schema";
import { getLocalizer } from "@/lib/content-i18n/localize";
import { getGenericItems } from "@/lib/data/content";
import { getImages } from "@/lib/data/media";
import { pageTitleKey } from "@/lib/data/pages";
import { getI18n } from "@/lib/i18n/server";

/**
 * „Általános” sablon az Adminban létrehozott új aloldalakhoz:
 * cím, bevezető, kép, Markdown szöveg és kártyalista.
 */
export async function GenericPage({ page }: { page: Page }) {
  const [{ t }, rows, images, l] = await Promise.all([getI18n(), getGenericItems(page.id), getImages(), getLocalizer()]);
  const hero = images(page.heroMediaId);
  const intro = l.get("pages", page.id, "introMd", page.introMd);
  const body = l.get("pages", page.id, "bodyMd", page.bodyMd);
  const items = rows.map((item) => l.row("generic_items", item, ["title", "body"] as const));
  const newTab = t("common.opensInNewTab");

  return (
    <div className="flex-1 bg-page-bg pb-16 text-page-fg">
      <PageHeader title={t(pageTitleKey(page))} icon={page.icon} intro={intro.text} introLang={intro.lang} titleClassName="font-display" />

      {hero && (
        <div className="container-page">
          <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-page-surface ring-1 ring-page-line">
            <Image src={hero.src} alt={hero.alt} lang={hero.altLang} fill preload sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover" />
          </div>
        </div>
      )}

      {body.text && (
        <div className="container-page py-10">
          <Markdown lang={body.lang} className="max-w-3xl prose-lg" newTabLabel={newTab}>
            {body.text}
          </Markdown>
        </div>
      )}

      {items.length > 0 && (
        <section className="container-page pt-4">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const image = images(item.mediaId);
              return (
                <li key={item.id}>
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-page-surface ring-1 ring-page-line">
                    {image && (
                      <div className="relative aspect-[16/10]">
                        <Image
                          src={image.src}
                          alt={image.alt}
                          lang={image.altLang}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      {item.isExample && <ExampleBadge label={t("common.example")} className="w-fit" />}
                      <h2 lang={item.lang.title} className="font-display text-xl font-bold">
                        {item.title}
                      </h2>
                      {item.body && (
                        <p lang={item.lang.body} className="text-page-muted">
                          {item.body}
                        </p>
                      )}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-auto inline-flex w-fit items-center gap-1.5 font-bold text-page-accent-text underline-offset-4 hover:underline"
                        >
                          {t("common.visit")}
                          <ExternalLink aria-hidden className="h-4 w-4" />
                          <span className="sr-only">{newTab}</span>
                        </a>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
