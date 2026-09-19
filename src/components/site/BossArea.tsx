"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";

/** Az „Itt a Főnök!” gomb eseménye – erre nyílik meg a belépő ablak. */
export const OPEN_LOGIN_EVENT = "botondember:open-login";

export function openLoginDialog(): void {
  window.dispatchEvent(new Event(OPEN_LOGIN_EVENT));
}

/**
 * „Itt a Főnök!” gomb, vagy bejelentkezve: „Admin” és „Kilépés”.
 */
export function BossArea({
  isAdmin,
  logoutAction,
  variant = "compact",
}: {
  isAdmin: boolean;
  logoutAction?: () => Promise<void>;
  variant?: "compact" | "full";
}) {
  const { t } = useI18n();
  const full = variant === "full";

  if (isAdmin) {
    return (
      <div className={full ? "grid grid-cols-2 gap-2" : "flex items-center gap-2"}>
        <Link
          href="/admin"
          className={
            full
              ? "flex items-center justify-center gap-2 rounded-xl bg-rm-gold px-4 py-3 font-display font-bold uppercase tracking-wide text-rm-navy"
              : "flex items-center gap-1.5 rounded-full bg-rm-gold px-3 py-1 font-display text-xs font-bold uppercase tracking-wider text-rm-navy hover:brightness-105"
          }
        >
          <LayoutDashboard aria-hidden className="h-4 w-4" />
          {t("header.admin")}
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className={
              full
                ? "flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 font-display font-bold uppercase tracking-wide"
                : "flex items-center gap-1.5 rounded-full border border-current/30 px-3 py-1 font-display text-xs font-bold uppercase tracking-wider hover:bg-current/10"
            }
          >
            <LogOut aria-hidden className="h-4 w-4" />
            {t("header.logout")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={openLoginDialog}
      className={
        full
          ? "w-full rounded-xl border-2 border-rm-gold px-4 py-3 font-display font-bold uppercase tracking-wide hover:bg-rm-gold/15"
          : "rounded-full border-2 border-rm-gold px-3.5 py-0.5 font-display text-xs font-bold uppercase tracking-wider hover:bg-rm-gold/20"
      }
    >
      {t("header.boss")}
      <span className="sr-only"> – {t("header.bossHint")}</span>
    </button>
  );
}
