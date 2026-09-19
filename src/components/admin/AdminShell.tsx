"use client";

import { Crown, ExternalLink, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { ADMIN_NAV } from "./nav";
import { ToastProvider } from "./Toast";

/**
 * Az Admin kerete: felső sáv (weboldal link, téma, kilépés), bal oldali menü
 * (mobilon lenyíló), tartalom. Csak magyar nyelvű.
 */
export function AdminShell({
  username,
  siteTitle,
  logoutAction,
  children,
}: {
  username: string;
  siteTitle: string;
  logoutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const current = ADMIN_NAV.find((item) => isActive(item.href));

  return (
    <ToastProvider>
      <div lang="hu" className="flex min-h-dvh flex-col bg-surface text-fg">
        <a href="#admin-main" className="skip-link">
          Ugrás a tartalomra
        </a>
        <header className="sticky top-0 z-40 border-b border-line bg-bg">
          <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
            <Link href="/admin" className="flex min-w-0 items-center gap-2 rounded-md">
              <Crown aria-hidden className="h-6 w-6 shrink-0 text-rm-gold" />
              <span className="brand-text font-royal text-lg font-bold">Admin</span>
              <span className="hidden truncate text-sm text-muted sm:inline">· {siteTitle}</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                target="_blank"
                className="hidden items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-surface md:flex"
              >
                <ExternalLink aria-hidden className="h-4 w-4" />
                Weboldal megnyitása
                <span className="sr-only">(új lapon nyílik meg)</span>
              </Link>
              <ThemeSwitcher variant="compact" />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-surface"
                  title={`Kilépés (${username})`}
                >
                  <LogOut aria-hidden className="h-4 w-4" />
                  <span className="hidden sm:inline">Kilépés</span>
                  <span className="sr-only sm:hidden">Kilépés</span>
                </button>
              </form>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="admin-nav"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-fg lg:hidden"
              >
                {menuOpen ? <X aria-hidden className="h-4 w-4" /> : <Menu aria-hidden className="h-4 w-4" />}
                Menü
              </button>
            </div>
          </div>
          {current && !menuOpen && (
            <p className="border-t border-line px-4 py-2 text-sm font-semibold text-muted lg:hidden">{current.label}</p>
          )}
        </header>

        <div className="flex-1 lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
          <div className={`${menuOpen ? "block" : "hidden"} border-b border-line bg-bg lg:block lg:border-r lg:border-b-0`}>
          <nav
            id="admin-nav"
            aria-label="Admin menü"
            className="lg:sticky lg:top-16 lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto"
          >
            <ul className="grid gap-1 p-3 sm:grid-cols-2 lg:grid-cols-1">
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-[0.95rem] font-semibold ${
                        active
                          ? "bg-primary text-primary-fg"
                          : "text-fg hover:bg-surface-2"
                      }`}
                    >
                      <Icon aria-hidden className="h-5 w-5 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          </div>

          <main id="admin-main" tabIndex={-1} className="min-w-0 px-4 py-6 outline-none sm:px-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
