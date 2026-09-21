import { Crown } from "lucide-react";
import Link from "next/link";
import { getLocalizer } from "@/lib/content-i18n/localize";
import { getAllSettings } from "@/lib/data/settings";
import { getI18n } from "@/lib/i18n/server";

/**
 * Lábléc: a két jogi oldal linkje, a szabad szöveg (alapból „© 2026 Botondember”)
 * és az opcionális linklista (az Adminból bővíthető).
 */
export async function SiteFooter() {
  const [{ t }, settings, l] = await Promise.all([getI18n(), getAllSettings(), getLocalizer()]);
  const { footer, general } = settings;
  const title = l.get("settings", "general", "headerTitle", general.headerTitle);
  const text = l.get("settings", "footer", "text", footer.text);
  const linkClass =
    "rounded-sm text-white underline decoration-white/35 underline-offset-4 hover:decoration-rm-gold hover:decoration-2";

  return (
    <footer className="mt-auto bg-rm-navy text-[#dfe7f3] [--focus:var(--rm-gold)] dark:bg-[#050f22]">
      <div aria-hidden className="h-1 bg-[image:var(--gold-gradient)]" />
      <div className="container-page grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-3">
          <p className="flex items-center gap-2 font-royal text-lg font-bold">
            <Crown aria-hidden className="h-5 w-5 shrink-0 text-rm-gold" />
            <span lang={title.lang} className="brand-text [--brand-fill:var(--gold-gradient)]">
              {title.text}
            </span>
          </p>
          {text.text && (
            <p lang={text.lang} className="text-sm whitespace-pre-line text-[#c9d5e6]">
              {text.text}
            </p>
          )}
        </div>

        <nav aria-label={t("footer.label")}>
          <ul className="flex flex-col gap-2.5 text-sm md:items-end">
            <li>
              <Link href="/adatkezelesi-tajekoztato" className={linkClass}>
                {t("footer.privacy")}
              </Link>
            </li>
            <li>
              <Link href="/cookie-tajekoztato" className={linkClass}>
                {t("footer.cookies")}
              </Link>
            </li>
          </ul>
        </nav>

        {footer.links.length > 0 && (
          <div className="border-t border-white/10 pt-6 md:col-span-2">
            <h2 className="sr-only">{t("footer.links")}</h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {footer.links.map((link, index) => {
                // A linkek sorszámmal azonosítottak → csak a pontosan ehhez a szöveghez készült fordítás jelenik meg.
                const label = l.get("settings", "footer", `links.${index}.label`, link.label, { strict: true });
                return (
                  <li key={`${index}-${link.url}`}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      <span lang={label.lang}>{label.text}</span>
                      <span className="sr-only"> {t("common.opensInNewTab")}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </footer>
  );
}
