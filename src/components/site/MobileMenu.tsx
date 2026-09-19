"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useI18n } from "@/lib/i18n/client";
import type { PublicLocale } from "@/lib/i18n/server";
import { BossArea } from "./BossArea";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { NavItem } from "./HeaderClient";

/**
 * Mobilon és tableten: hamburger ikon és jobbról beúszó panel a menüvel,
 * a zászlókkal, a téma-választóval és az „Itt a Főnök!” gombbal.
 * Natív <dialog> – az Esc bezárja, a fókusz a panelen belül marad.
 */
export function MobileMenu({
  navItems,
  activeHref,
  locales,
  showFlags,
  isAdmin,
  logoutAction,
}: {
  navItems: NavItem[];
  activeHref: string | null;
  locales: PublicLocale[];
  showFlags: boolean;
  isAdmin: boolean;
  logoutAction?: () => Promise<void>;
}) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
  const pathname = usePathname();

  // Oldalváltáskor a panel bezárul.
  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const openMenu = () => {
    dialogRef.current?.showModal();
    setOpen(true);
  };
  const closeMenu = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        aria-label={t("nav.openMenu")}
        aria-expanded={open}
        aria-controls={id}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-current/25 hover:bg-current/10 xl:hidden"
      >
        <Menu aria-hidden className="h-6 w-6" />
      </button>

      <dialog
        id={id}
        ref={dialogRef}
        aria-label={t("nav.menuTitle")}
        className="drawer [--focus:var(--rm-blue)] xl:hidden dark:[--focus:var(--rm-gold)]"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // Kattintás a sötét háttérre → bezárás
          if (event.target === event.currentTarget) closeMenu();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="font-display text-lg font-extrabold tracking-wider uppercase">{t("nav.menuTitle")}</span>
            <button
              type="button"
              onClick={closeMenu}
              aria-label={t("nav.closeMenu")}
              className="grid h-11 w-11 place-items-center rounded-lg border border-line hover:bg-surface"
            >
              <X aria-hidden className="h-6 w-6" />
            </button>
          </div>

          <nav aria-label={t("nav.mainLabel")} className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const current = item.href === activeHref;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      aria-current={current ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3.5 font-display text-lg font-bold tracking-wide uppercase ${
                        current ? "bg-surface-2 shadow-[inset_4px_0_0_var(--gold-strong)] dark:shadow-[inset_4px_0_0_var(--rm-gold)]" : "hover:bg-surface"
                      }`}
                    >
                      <span aria-hidden className="h-6 w-6 shrink-0 text-link">
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="space-y-5 border-t border-line px-5 py-5">
            {showFlags && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted">{t("lang.label")}</p>
                <LanguageSwitcher locales={locales} size="lg" />
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted">{t("theme.label")}</p>
              <ThemeSwitcher variant="full" />
            </div>
            <BossArea isAdmin={isAdmin} logoutAction={logoutAction} variant="full" />
          </div>
        </div>
      </dialog>
    </>
  );
}
