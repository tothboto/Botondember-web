import { notFound } from "next/navigation";
import { Markdown } from "@/components/site/Markdown";
import { getLocalizer } from "@/lib/content-i18n/localize";
import { getLegalDoc } from "@/lib/data/content";
import { getAllSettings } from "@/lib/data/settings";
import { formatDate } from "@/lib/format";
import { SOURCE_LOCALE } from "@/lib/i18n/messages";
import { getI18n } from "@/lib/i18n/server";
import { fillLegalTokens } from "@/lib/legal";
import { extractToc } from "@/lib/markdown/toc";

/**
 * Jogi oldal (Adatkezelési / Cookie tájékoztató): letisztult, jól olvasható
 * szöveg (~70 karakteres sorhossz), tartalomjegyzékkel a fejezetekre ugráshoz.
 */
export async function LegalPage({ slug, titleKey }: { slug: "privacy" | "cookie"; titleKey: string }) {
  const [{ t, locale }, settings, doc, l] = await Promise.all([
    getI18n(),
    getAllSettings(),
    getLegalDoc(slug, SOURCE_LOCALE),
    getLocalizer(),
  ]);
  if (!doc) notFound();

  // A fordítás (ha van) az Admin „Saját szövegek fordítása” oldalán készül; a magyar az irányadó.
  const translated = l.get("legal_docs", slug, "bodyMd", doc.bodyMd);
  const isTranslation = translated.lang !== SOURCE_LOCALE;
  const body = isTranslation
    ? fillLegalTokens(
        translated.text,
        { siteName: l.get("settings", "general", "siteName", settings.general.siteName).text },
        settings.legal,
        { locale, missing: t("legal.missingData") },
      )
    : fillLegalTokens(doc.bodyMd, settings.general, settings.legal);
  const toc = extractToc(body);
  const title = t(titleKey);

  return (
    <div className="tpl-legal flex-1 bg-page-bg text-page-fg">
      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-10 sm:py-14 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14">
        <header className="lg:col-span-2">
          <span aria-hidden className="block h-1.5 w-16 bg-[image:var(--gold-gradient)]" />
          <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3.25rem)] leading-tight font-black tracking-tight uppercase">
            {title}
          </h1>
          <p className="mt-3 text-sm text-page-muted">
            {t("legal.updated", { date: formatDate(doc.updatedAt, locale) })}
          </p>
          {locale !== SOURCE_LOCALE && (
            <p className="mt-2 inline-block rounded-lg bg-page-surface px-3 py-1.5 text-sm ring-1 ring-page-line">
              {t(isTranslation ? "legal.translated" : "legal.onlyHungarian")}
            </p>
          )}
        </header>

        {toc.length > 0 && (
          <nav
            aria-labelledby="legal-toc-title"
            className="rounded-2xl bg-page-surface p-5 ring-1 ring-page-line lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto"
          >
            <h2 id="legal-toc-title" className="text-sm font-bold tracking-wider text-page-muted uppercase">
              {t("legal.toc")}
            </h2>
            <ol lang={translated.lang} className="mt-3 space-y-1.5 text-sm">
              {toc.map((item) => (
                <li key={item.id} className={item.depth === 3 ? "pl-4" : ""}>
                  <a
                    href={`#${item.id}`}
                    className="block rounded px-1 py-0.5 text-page-fg underline-offset-4 hover:text-page-accent-text hover:underline"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <article className="min-w-0">
          <Markdown lang={translated.lang} withHeadingIds newTabLabel={t("common.opensInNewTab")} className="max-w-[70ch] prose-lg">
            {body}
          </Markdown>
        </article>
      </div>
    </div>
  );
}
