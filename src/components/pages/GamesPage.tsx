import { ExternalLink, Sparkles } from "lucide-react";
import Image from "next/image";
import { EmptyState } from "@/components/site/EmptyState";
import { ExampleBadge } from "@/components/site/ExampleBadge";
import { Markdown } from "@/components/site/Markdown";
import { Stars } from "@/components/site/Stars";
import type { Game, Page } from "@/db/schema";
import { getLocalizer, type LocalizedRow } from "@/lib/content-i18n/localize";
import { getGames } from "@/lib/data/content";
import { getImages, type ImageInfo } from "@/lib/data/media";
import { pageTitleKey } from "@/lib/data/pages";
import { getI18n } from "@/lib/i18n/server";
import { PageIcon } from "@/lib/icons";

type T = (key: string, vars?: Record<string, string | number>) => string;

/** A játékok fordítható mezői. */
const GAME_FIELDS = ["title", "genre", "review"] as const;
type LocalizedGame = LocalizedRow<Game, (typeof GAME_FIELDS)[number]>;

/** A platformok felirata (a „Mobil” fordítódik, a többi márkanév). */
export const PLATFORMS: { code: string; label: string | null }[] = [
  { code: "pc", label: "PC" },
  { code: "playstation", label: "PlayStation" },
  { code: "xbox", label: "Xbox" },
  { code: "switch", label: "Switch" },
  { code: "mobile", label: null },
];

function platformLabel(code: string, t: T): string {
  const found = PLATFORMS.find((p) => p.code === code);
  if (!found) return code;
  return found.label ?? t(`games.platform.${code}`);
}

function PlatformBadges({ platforms, t }: { platforms: string[]; t: T }) {
  if (platforms.length === 0) return null;
  return (
    <ul aria-label={t("games.platforms")} className="flex flex-wrap gap-1.5">
      {platforms.map((code) => (
        <li
          key={code}
          className="rounded-md border border-page-line bg-page-surface-2 px-2 py-0.5 font-gamer text-[0.7rem] font-bold tracking-wider text-page-fg uppercase"
        >
          {platformLabel(code, t)}
        </li>
      ))}
    </ul>
  );
}

function VisitLink({ href, t, size = "sm" }: { href: string; t: T; size?: "sm" | "lg" }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        size === "lg"
          ? "inline-flex w-fit items-center gap-2 rounded-lg bg-[#1fb6ff] px-5 py-2.5 font-gamer font-bold tracking-wider text-[#031524] uppercase hover:bg-[#5cc8ff]"
          : "inline-flex w-fit items-center gap-1.5 text-sm font-bold text-page-accent-text underline-offset-4 hover:underline"
      }
    >
      {t("common.visit")}
      <ExternalLink aria-hidden className="h-4 w-4" />
      <span className="sr-only">{t("common.opensInNewTab")}</span>
    </a>
  );
}

function FeaturedGame({ game, image, t }: { game: LocalizedGame; image: ImageInfo | null; t: T }) {
  return (
    <section aria-labelledby="featured-game-title" className="container-page">
      {/* A banner mindkét témában sötét – a helyi tokenek ehhez igazodnak. */}
      <div className="relative isolate overflow-hidden rounded-2xl bg-[#0b1220] text-white ring-1 ring-[#1fb6ff]/40 [--page-fg:#ffffff] [--page-line:#2b3a55] [--page-muted:#cbd5e1] [--page-surface-2:#16223a] [--page-accent-text:#7dd3fc] [--focus:#7dd3fc]">
        {image && (
          <Image
            src={image.src}
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="-z-20 scale-110 object-cover opacity-55 blur-2xl"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b1220] via-[#0b1220]/85 to-[#0b1220]/35"
        />
        <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[minmax(0,15rem)_1fr] md:items-center md:gap-10 lg:p-10">
          <div className="relative mx-auto aspect-[3/4] w-44 overflow-hidden rounded-xl bg-[#16223a] shadow-2xl ring-1 ring-white/15 sm:w-52 md:w-full">
            {image && (
              <Image
                src={image.src}
                alt={image.alt}
                lang={image.altLang}
                fill
                sizes="(min-width: 768px) 240px, 208px"
                className="object-cover"
              />
            )}
          </div>
          <div className="flex flex-col gap-4">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-[#1fb6ff]/15 px-3 py-1 font-gamer text-sm font-bold tracking-[0.18em] text-[#7dd3fc] uppercase ring-1 ring-[#1fb6ff]/40">
              <Sparkles aria-hidden className="h-4 w-4" />
              {t("games.featured")}
            </p>
            <h2
              id="featured-game-title"
              lang={game.lang.title}
              className="font-gamer text-[clamp(2rem,5vw,3.5rem)] leading-none font-bold uppercase"
            >
              {game.title}
            </h2>
            <PlatformBadges platforms={game.platforms} t={t} />
            {game.genre && (
              <p className="text-white/80">
                <span className="sr-only">{t("games.genre")}: </span>
                <span lang={game.lang.genre}>{game.genre}</span>
              </p>
            )}
            <Stars rating={game.rating} label={t("games.ratingValue", { rating: game.rating })} />
            {game.review && (
              <p lang={game.lang.review} className="max-w-2xl text-lg text-white/90">
                {game.review}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {game.link && <VisitLink href={game.link} t={t} size="lg" />}
              {game.isExample && <ExampleBadge label={t("common.example")} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Kedvenc játékaim – játékindító / játékbolt hangulat (Steam, PlayStation Store,
 * Xbox): sötét alap neon kék akcentussal, kiemelt játék nagy bannerrel, alatta
 * álló (3:4) borítókból álló rács.
 */
export async function GamesPage({ page }: { page: Page }) {
  const [{ t }, rows, images, l] = await Promise.all([getI18n(), getGames(), getImages(), getLocalizer()]);
  const title = t(pageTitleKey(page));
  const intro = l.get("pages", page.id, "introMd", page.introMd);
  const items = rows.map((game) => l.row("games", game, GAME_FIELDS));
  const featured = items.find((game) => game.featured) ?? null;
  const others = featured ? items.filter((game) => game.id !== featured.id) : items;

  return (
    <div className="flex-1 bg-page-bg pb-16 text-page-fg">
      <header className="container-page pt-10 pb-8 sm:pt-14">
        <h1 className="flex items-center gap-3 font-gamer text-[clamp(2.2rem,6vw,4rem)] leading-none font-bold tracking-wide uppercase sm:gap-4">
          <span
            aria-hidden
            className="grid h-[1.15em] w-[1.15em] shrink-0 place-items-center rounded-xl bg-page-accent/15 ring-1 ring-page-accent/50"
          >
            <PageIcon name={page.icon} className="h-[0.7em] w-[0.7em] text-page-accent" strokeWidth={2.2} />
          </span>
          <span>{title}</span>
        </h1>
        {intro.text && (
          <Markdown lang={intro.lang} className="mt-4 max-w-2xl prose-lg [--md-fg:var(--page-muted)]">
            {intro.text}
          </Markdown>
        )}
      </header>

      {items.length === 0 ? (
        <div className="container-page">
          <EmptyState text={t("common.empty")} />
        </div>
      ) : (
        <>
          {featured && <FeaturedGame game={featured} image={images(featured.coverMediaId)} t={t} />}

          {others.length > 0 && (
            <section aria-labelledby="all-games-title" className="container-page pt-12">
              <h2
                id="all-games-title"
                className="flex items-center gap-3 font-gamer text-2xl font-bold tracking-wider uppercase"
              >
                <span aria-hidden className="h-7 w-1.5 rounded-full bg-page-accent" />
                {t("games.allGames")}
              </h2>
              <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
                {others.map((game) => {
                  const cover = images(game.coverMediaId);
                  return (
                    <li key={game.id}>
                      <article className="flex h-full flex-col">
                        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-page-surface-2 shadow-sm ring-1 ring-page-line">
                          {cover && (
                            <Image
                              src={cover.src}
                              alt={cover.alt}
                              lang={cover.altLang}
                              fill
                              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                              className="object-cover"
                            />
                          )}
                          {game.isExample && (
                            <ExampleBadge label={t("common.example")} className="absolute top-2 left-2 max-w-[90%]" />
                          )}
                        </div>
                        <div className="mt-3 flex flex-1 flex-col gap-2">
                          <h3 lang={game.lang.title} className="font-gamer text-lg leading-tight font-bold uppercase">
                            {game.title}
                          </h3>
                          {game.genre && (
                            <p className="text-sm text-page-muted">
                              <span className="sr-only">{t("games.genre")}: </span>
                              <span lang={game.lang.genre}>{game.genre}</span>
                            </p>
                          )}
                          <PlatformBadges platforms={game.platforms} t={t} />
                          <Stars rating={game.rating} label={t("games.ratingValue", { rating: game.rating })} />
                          {game.review && (
                            <p lang={game.lang.review} className="line-clamp-3 text-sm text-page-muted">
                              {game.review}
                            </p>
                          )}
                          {game.link && <VisitLink href={game.link} t={t} />}
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
