"use client";

import { Crown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useI18n } from "@/lib/i18n/client";
import type { PublicLocale } from "@/lib/i18n/server";
import { BossArea } from "./BossArea";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";

/** Egy menüpont; az ikon a szerveren kirajzolt SVG. */
export type NavItem = { href: string; label: string; icon: ReactNode; template: string };

const LEGAL_PATHS = ["/adatkezelesi-tajekoztato", "/cookie-tajekoztato"];

function subscribeScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

export function HeaderClient({
  title,
  titleLang,
  navItems,
  sticky,
  locales,
  showFlags,
  isAdmin,
  logoutAction,
}: {
  title: string;
  /** A felirat nyelve (a látogató nyelve, ha van fordítás; különben magyar). */
  titleLang: string;
  navItems: NavItem[];
  sticky: boolean;
  locales: PublicLocale[];
  showFlags: boolean;
  isAdmin: boolean;
  logoutAction?: () => Promise<void>;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const active = navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? null;
  const template = isHome ? "home" : (active?.template ?? (LEGAL_PATHS.includes(pathname) ? "legal" : "default"));

  // Kezdőlapon, rögzített fejléccel: görgetés után sötét hátteret kap.
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 24,
    () => false,
  );

  const position = isHome ? (sticky ? "fixed" : "absolute") : sticky ? "sticky" : "relative";
  const surface = isHome
    ? scrolled && sticky
      ? "bg-rm-navy/95 shadow-lg backdrop-blur"
      : "bg-gradient-to-b from-black/55 to-transparent"
    : "bg-header-bg border-b border-header-line";

  return (
    <header
      className={`tpl-${template} ${position} inset-x-0 top-0 z-40 text-header-fg [--focus:var(--header-focus)] ${surface}`}
      data-template={template}
    >
      {/* Kis sáv a menü fölött: zászlók, téma, „Itt a Főnök!” (asztali nézet) */}
      <div className="hidden border-b border-header-line xl:block">
        <div className="container-page flex h-11 items-center justify-end gap-5 text-sm">
          {showFlags && <LanguageSwitcher locales={locales} />}
          <ThemeSwitcher variant="compact" />
          <BossArea isAdmin={isAdmin} logoutAction={logoutAction} />
        </div>
      </div>

      <div className="container-page flex min-h-16 items-center justify-between gap-4 py-2.5 xl:min-h-20">
        <Link
          href="/"
          data-brand-link
          aria-label={t("header.homeLinkLabel", { title })}
          className="flex min-w-0 items-center gap-2.5 rounded-md py-1"
        >
          <Crown aria-hidden className="h-6 w-6 shrink-0 text-rm-gold sm:h-7 sm:w-7" strokeWidth={2.2} />
          <span
            lang={titleLang}
            className="brand-text font-royal text-[clamp(1rem,4.4vw,1.5rem)] leading-tight font-bold tracking-wide text-balance"
          >
            {title}
          </span>
        </Link>

        <nav aria-label={t("nav.mainLabel")} className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const current = item === active;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`group relative flex items-center gap-2 rounded-md px-3 py-2.5 font-display text-[0.9rem] font-extrabold tracking-[0.08em] uppercase ${
                      current ? "" : "text-header-fg/90 hover:text-header-fg"
                    }`}
                  >
                    <span aria-hidden className="h-[1.15rem] w-[1.15rem] shrink-0">
                      {item.icon}
                    </span>
                    {item.label}
                    <span
                      aria-hidden
                      className={`absolute inset-x-3 -bottom-0.5 h-[3px] rounded-full ${
                        current ? "bg-header-active" : "bg-transparent group-hover:bg-header-line"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <MobileMenu
          navItems={navItems}
          activeHref={active?.href ?? null}
          locales={locales}
          showFlags={showFlags}
          isAdmin={isAdmin}
          logoutAction={logoutAction}
        />
      </div>
    </header>
  );
}
