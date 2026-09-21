import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment, type CSSProperties } from "react";
import { HomeGuide } from "@/components/pages/HomeGuide";
import type { Page } from "@/db/schema";
import { getLocalizer, type Localized, type Localizer } from "@/lib/content-i18n/localize";
import { getImages } from "@/lib/data/media";
import { getVisiblePages, pageHref, pageTitleKey } from "@/lib/data/pages";
import { getAllSettings } from "@/lib/data/settings";
import { heroLines, longestLine } from "@/lib/hero";
import { PageIcon } from "@/lib/icons";
import { getI18n } from "@/lib/i18n/server";
import { stripInlineMarkdown } from "@/lib/markdown/toc";
import type { FigurePosition, FocalPoint } from "@/lib/settings";

/** Rövid összefoglaló egy aloldalról a leírás dobozaihoz (a saját bevezetőjéből, a látogató nyelvén). */
function pageSummary(page: Page, l: Localizer): Localized {
  const source = page.introMd.trim()
    ? l.get("pages", page.id, "introMd", page.introMd)
    : l.get("pages", page.id, "seoDescription", page.seoDescription);
  const text = stripInlineMarkdown(source.text.trim().split(/\n{2,}/)[0] ?? "").replace(/\s+/g, " ");
  return { text: text.length > 120 ? `${text.slice(0, 117).trimEnd()}…` : text, lang: source.lang };
}

/** Az előtérben álló alak vízszintes helye. */
const FIGURE_JUSTIFY: Record<FigurePosition, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

/** A kép fókuszpontja (az Adminban választható) → CSS object-position. */
const FOCAL_POSITION: Record<FocalPoint, string> = {
  center: "50% 50%",
  top: "50% 18%",
  bottom: "50% 82%",
  left: "22% 50%",
  right: "78% 50%",
};

export async function generateMetadata(): Promise<Metadata> {
  const [{ home, general }, images, l] = await Promise.all([getAllSettings(), getImages(), getLocalizer()]);
  const hero = images(home.heroMediaId);
  const siteName = l.get("settings", "general", "siteName", general.siteName).text;
  const description = home.subtitle
    ? l.get("settings", "home", "subtitle", home.subtitle).text
    : l.get("settings", "home", "message", home.message).text;
  return {
    title: { absolute: siteName },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      title: siteName,
      description,
      images: hero ? [{ url: hero.src, width: hero.width, height: hero.height, alt: hero.alt }] : undefined,
    },
  };
}

/**
 * Kezdőlap – a Rainbow Six Siege weboldal hangulatában, de nagyon minimalistán:
 * egyetlen teljes képernyős kép sötét rátéttel és egy rövid, ütős üzenet.
 * Semmi más: nincs galéria, számláló, óra vagy animáció.
 */
export default async function HomePage() {
  const [{ home }, images, i18n, pages, l] = await Promise.all([
    getAllSettings(),
    getImages(),
    getI18n(),
    getVisiblePages(),
    getLocalizer(),
  ]);
  const { t } = i18n;
  const hero = images(home.heroMediaId);
  const figure = images(home.figureMediaId);
  // A saját szövegek a látogató nyelvén (ha nincs fordítás: magyarul, lang="hu" jelöléssel).
  const text = (field: string, source: string) => l.get("settings", "home", field, source);
  const message = text("message", home.message);
  const subtitle = text("subtitle", home.subtitle);
  const motto = { text: text("motto.text", home.motto.text), author: text("motto.author", home.motto.author) };
  const guide = {
    button: home.guide.button ? text("guide.button", home.guide.button) : { text: "Hol vagy? Mi ez?", lang: "hu" },
    title: text("guide.title", home.guide.title),
    text: text("guide.text", home.guide.text),
  };
  const lines = heroLines(message.text);
  const a = home.overlay / 100;
  const shade = (k: number) => `rgb(3 7 16 / ${Math.min(1, a * k).toFixed(3)})`;

  return (
    <section className="tpl-home relative isolate flex min-h-[100svh] items-end overflow-hidden bg-[#050b17] text-white">
      {hero ? (
        <Image
          src={hero.src}
          alt={hero.alt}
          lang={hero.altLang}
          fill
          preload
          sizes="100vw"
          className="-z-20 object-cover"
          style={{ objectPosition: FOCAL_POSITION[home.focal] }}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-[radial-gradient(80%_70%_at_25%_35%,#00529f66,transparent),linear-gradient(160deg,#060b16,#0b1f3f_55%,#04070d)]"
        />
      )}

      {/* Sötét színátmenetes rátét – az erőssége az Adminban állítható. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(to top, ${shade(1)} 0%, ${shade(0.62)} 38%, ${shade(0.22)} 72%, ${shade(0.45)} 100%), linear-gradient(to right, ${shade(0.75)} 0%, transparent 68%)`,
        }}
      />

      {/* Előtérben álló alak (rajz): a szöveg mögötte fut. Mobilon fent, hogy ne takarja a szöveget. */}
      {figure && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-[5%] bottom-auto z-20 flex px-3 sm:top-auto sm:bottom-0 sm:px-10 ${FIGURE_JUSTIFY[home.figurePosition]}`}
        >
          <Image
            src={figure.src}
            alt={figure.alt}
            lang={figure.altLang}
            width={figure.width}
            height={figure.height}
            preload
            sizes="(min-width: 640px) 45vw, 70vw"
            className="h-[var(--figure-mobile)] w-auto max-w-[70vw] object-contain drop-shadow-[0_25px_45px_rgb(0_0_0/0.55)] sm:h-[var(--figure-height)] sm:max-w-[45vw]"
            style={
              {
                "--figure-height": `${home.figureSize}svh`,
                "--figure-mobile": `${Math.min(home.figureSize, 44)}svh`,
              } as CSSProperties
            }
          />
        </div>
      )}

      <div className="relative z-10 container-page pt-44 pb-[max(4.5rem,11vh)]">
        <div className="max-w-6xl">
          <span aria-hidden className="mb-7 block h-1.5 w-24 bg-[image:var(--gold-gradient)]" />
          {/* Édesapa oldalának stílusában: soronként váltakozva körvonalas és teli betűk
              (mobilon mindegyik sor teli). A méret a leghosszabb sorhoz igazodik. */}
          <h1
            lang={message.lang}
            className="font-hero text-[length:clamp(2.5rem,calc(min(88vw,74rem)/(var(--hero-chars)*0.6)),11.5rem)] leading-[0.92] font-extrabold tracking-[-0.045em] uppercase"
            style={{ "--hero-chars": longestLine(lines) } as CSSProperties}
          >
            {lines.map((line, index) => (
              <Fragment key={index}>
                {/* A szóköz nem látszik, de a képernyőolvasó és a keresők egy mondatként olvassák. */}
                {index > 0 && " "}
                <span
                  className={
                    index % 2 === 0
                      ? "block [text-shadow:0_2px_28px_rgb(0_0_0/0.45)] sm:text-transparent sm:[-webkit-text-stroke:2px_#ffffff] sm:[text-shadow:none]"
                      : "block [text-shadow:0_2px_28px_rgb(0_0_0/0.45)]"
                  }
                >
                  {line}
                </span>
              </Fragment>
            ))}
          </h1>

          {subtitle.text && (
            <p lang={subtitle.lang} className="mt-7 max-w-2xl text-lg text-white/90 sm:text-xl">
              {subtitle.text}
            </p>
          )}

          {home.motto.enabled && motto.text.text && (
            <figure className="mt-10 max-w-xl border-l-4 border-rm-gold pl-5">
              <figcaption className="sr-only">{t("home.motto")}</figcaption>
              <blockquote lang={motto.text.lang} className="text-lg text-white/90 italic sm:text-xl">
                „{motto.text.text}”
              </blockquote>
              {motto.author.text && (
                <p lang={motto.author.lang} className="mt-2 text-sm font-bold tracking-[0.2em] text-rm-gold uppercase">
                  — {motto.author.text}
                </p>
              )}
            </figure>
          )}

          {/* Útbaigazító leírás egy gomb mögött – a szöveg az Adminban szerkeszthető. */}
          {home.guide.enabled && home.guide.text && (
            <div className="mt-10">
              <HomeGuide button={guide.button} title={guide.title} text={guide.text}>
                {home.guide.showPages && pages.length > 0 && (
                  <nav aria-label={t("home.guide.pages")}>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {pages.map((page) => {
                        const summary = pageSummary(page, l);
                        return (
                          <li key={page.id}>
                            <Link
                              href={pageHref(page)}
                              className="flex h-full items-start gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-primary hover:bg-surface-2"
                            >
                              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg">
                                <PageIcon name={page.icon} className="h-5 w-5" strokeWidth={2.2} />
                              </span>
                              <span className="min-w-0">
                                <span className="block font-display font-extrabold tracking-wide uppercase">
                                  {i18n.t(pageTitleKey(page))}
                                </span>
                                {summary.text && (
                                  <span lang={summary.lang} className="mt-0.5 block text-sm text-muted">
                                    {summary.text}
                                  </span>
                                )}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                )}
              </HomeGuide>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
