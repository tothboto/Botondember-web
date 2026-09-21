import { ListVideo, Music2, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/site/EmptyState";
import { ExampleBadge } from "@/components/site/ExampleBadge";
import { Markdown } from "@/components/site/Markdown";
import type { Page, YoutubeItem } from "@/db/schema";
import { getYoutubeItems } from "@/lib/data/content";
import { getImages, type ImageInfo } from "@/lib/data/media";
import { pageHref, pageTitleKey } from "@/lib/data/pages";
import { getI18n } from "@/lib/i18n/server";
import { PageIcon } from "@/lib/icons";

type T = (key: string, vars?: Record<string, string | number>) => string;
type Kind = "song" | "video" | "channel" | "playlist";

/** A szűrő fülek – az URL-ben pl. `?tab=zeneszamok`, így megosztható. */
export const YOUTUBE_TABS: { key: string; labelKey: string; kinds: Kind[] }[] = [
  { key: "mind", labelKey: "youtube.tab.all", kinds: ["song", "video", "channel", "playlist"] },
  { key: "zeneszamok", labelKey: "youtube.tab.songs", kinds: ["song"] },
  { key: "videok", labelKey: "youtube.tab.videos", kinds: ["video"] },
  { key: "csatornak", labelKey: "youtube.tab.channels", kinds: ["channel"] },
  { key: "lejatszasi-listak", labelKey: "youtube.tab.playlists", kinds: ["playlist"] },
];

const SECTIONS: { kind: Kind; titleKey: string }[] = [
  { kind: "song", titleKey: "youtube.section.songs" },
  { kind: "video", titleKey: "youtube.section.videos" },
  { kind: "channel", titleKey: "youtube.section.channels" },
  { kind: "playlist", titleKey: "youtube.section.playlists" },
];

function NewTabNote({ t }: { t: T }) {
  return <span className="sr-only">{t("common.opensInNewTab")}</span>;
}

/** Videó- és zenekártya: 16:9 bélyegkép (12 px-es kerekítés), kétsoros cím, szürke csatornanév. */
function VideoCard({ item, image, t }: { item: YoutubeItem; image: ImageInfo | null; t: T }) {
  const Icon = item.kind === "song" ? Music2 : Play;
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="group block rounded-xl">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-page-surface">
        {image && (
          <Image
            src={image.src}
            alt={image.alt}
            lang="hu"
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        )}
        <span
          aria-hidden
          className="absolute right-2 bottom-2 grid h-6 place-items-center rounded-md bg-black/80 px-1.5 text-white"
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
        {item.isExample && <ExampleBadge label={t("common.example")} className="absolute top-2 left-2" />}
      </div>
      <div className="mt-3 pr-6">
        <h3 lang="hu" className="line-clamp-2 text-base leading-snug font-medium group-hover:underline">
          {item.title}
        </h3>
        {item.author && (
          <p lang="hu" className="mt-1 text-sm text-page-muted">
            {item.author}
          </p>
        )}
        {item.note && (
          <p lang="hu" className="mt-0.5 line-clamp-2 text-sm text-page-muted">
            {item.note}
          </p>
        )}
      </div>
      <NewTabNote t={t} />
    </a>
  );
}

/** Lejátszási lista: „egymásra rakott” bélyegkép-hatás és elemszám jelvény. */
function PlaylistCard({ item, image, t }: { item: YoutubeItem; image: ImageInfo | null; t: T }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="group block rounded-xl">
      <div className="relative pt-2.5">
        <div aria-hidden className="absolute inset-x-5 top-0 h-full rounded-xl bg-page-surface-2 opacity-60" />
        <div aria-hidden className="absolute inset-x-2.5 top-1 h-full rounded-xl bg-page-surface-2" />
        <div className="relative aspect-video overflow-hidden rounded-xl bg-page-surface ring-1 ring-black/5">
          {image && (
            <Image
              src={image.src}
              alt={image.alt}
              lang="hu"
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          )}
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
            <ListVideo aria-hidden className="h-3.5 w-3.5" />
            {item.itemCount ? t("youtube.itemCount", { count: item.itemCount }) : null}
          </span>
          {item.isExample && <ExampleBadge label={t("common.example")} className="absolute top-2 left-2" />}
        </div>
      </div>
      <div className="mt-3">
        <h3 lang="hu" className="line-clamp-2 text-base leading-snug font-medium group-hover:underline">
          {item.title}
        </h3>
        {item.author && (
          <p lang="hu" className="mt-1 text-sm text-page-muted">
            {item.author}
          </p>
        )}
        {item.note && (
          <p lang="hu" className="mt-0.5 line-clamp-2 text-sm text-page-muted">
            {item.note}
          </p>
        )}
      </div>
      <NewTabNote t={t} />
    </a>
  );
}

/** Csatorna: kerek avatar, csatornanév, rövid megjegyzés. */
function ChannelCard({ item, image, t }: { item: YoutubeItem; image: ImageInfo | null; t: T }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col items-center gap-3 rounded-xl p-4 text-center hover:bg-page-surface"
    >
      <div className="relative h-28 w-28 overflow-hidden rounded-full bg-page-surface ring-1 ring-black/5 sm:h-32 sm:w-32">
        {image && <Image src={image.src} alt={image.alt} lang="hu" fill sizes="128px" className="object-cover" />}
      </div>
      <h3 lang="hu" className="text-base font-medium group-hover:underline">
        {item.title}
      </h3>
      {item.note && (
        <p lang="hu" className="line-clamp-3 text-sm text-page-muted">
          {item.note}
        </p>
      )}
      {item.isExample && <ExampleBadge label={t("common.example")} />}
      <NewTabNote t={t} />
    </a>
  );
}

function Section({
  kind,
  title,
  items,
  images,
  t,
}: {
  kind: Kind;
  title: string;
  items: YoutubeItem[];
  images: (id: number | null | undefined) => ImageInfo | null;
  t: T;
}) {
  const gridClass =
    kind === "channel"
      ? "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
      : "grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  return (
    <section aria-labelledby={`yt-${kind}`} className="border-t border-page-line py-8 first:border-t-0">
      <h2 id={`yt-${kind}`} className="flex items-center gap-2.5 text-xl font-bold">
        <span aria-hidden className="h-5 w-1 rounded-full bg-page-accent" />
        {title}
      </h2>
      {items.length === 0 ? (
        <EmptyState text={t("common.empty")} className="mt-5" />
      ) : (
        <ul className={`mt-5 ${gridClass}`}>
          {items.map((item) => (
            <li key={item.id}>
              {kind === "channel" ? (
                <ChannelCard item={item} image={images(item.thumbMediaId)} t={t} />
              ) : kind === "playlist" ? (
                <PlaylistCard item={item} image={images(item.thumbMediaId)} t={t} />
              ) : (
                <VideoCard item={item} image={images(item.thumbMediaId)} t={t} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Kedvenceim YouTube-on – a YouTube weboldal kinézete (saját megvalósítás, a
 * YouTube logója és védjegyei nélkül). Minden elem új lapon nyílik meg a
 * YouTube-on; beágyazott lejátszó nincs. A bélyegképek helyben vannak tárolva,
 * így a látogató böngészője nem kommunikál a Google-lel.
 */
export async function YoutubePage({ page, tab }: { page: Page; tab: string }) {
  const [{ t }, items, images] = await Promise.all([getI18n(), getYoutubeItems(), getImages()]);
  const title = t(pageTitleKey(page));
  const active = YOUTUBE_TABS.find((x) => x.key === tab) ?? YOUTUBE_TABS[0];
  const base = pageHref(page);

  return (
    <div className="flex-1 bg-page-bg pb-12 font-yt text-page-fg">
      <header className="container-page pt-8 pb-4 sm:pt-10">
        <h1 className="flex items-center gap-3 text-[clamp(1.8rem,4.5vw,2.75rem)] leading-tight font-bold">
          <span aria-hidden className="grid h-[1.3em] w-[1.3em] shrink-0 place-items-center rounded-full bg-page-surface">
            <PageIcon name={page.icon} className="h-[0.68em] w-[0.68em] text-page-accent" strokeWidth={2.2} />
          </span>
          <span>{title}</span>
        </h1>
        {page.introMd && <Markdown className="mt-3 max-w-3xl [--md-fg:var(--page-muted)]">{page.introMd}</Markdown>}
      </header>

      {/* „Chip” sáv – mint a YouTube szűrő fülei */}
      <nav aria-label={t("youtube.filterLabel")} className="container-page">
        <ul className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 py-3">
          {YOUTUBE_TABS.map((x) => {
            const current = x.key === active.key;
            return (
              <li key={x.key} className="shrink-0">
                <Link
                  href={x.key === "mind" ? base : `${base}?tab=${x.key}`}
                  scroll={false}
                  aria-current={current ? "page" : undefined}
                  className={`inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap ${
                    current
                      ? "bg-[var(--chip-active-bg)] text-[var(--chip-active-fg)]"
                      : "bg-[var(--chip-bg)] text-[var(--chip-fg)] hover:bg-page-surface-2"
                  }`}
                >
                  {t(x.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="container-page">
        {SECTIONS.filter((s) => active.kinds.includes(s.kind)).map((s) => (
          <Section
            key={s.kind}
            kind={s.kind}
            title={t(s.titleKey)}
            items={items.filter((item) => item.kind === s.kind)}
            images={images}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
