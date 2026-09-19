"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { ThemeMode } from "@/lib/settings";
import { currentMode, setThemeMode, subscribeTheme } from "@/lib/theme";

const OPTIONS: { mode: ThemeMode; icon: typeof Sun; labelKey: string }[] = [
  { mode: "system", icon: Monitor, labelKey: "theme.system" },
  { mode: "light", icon: Sun, labelKey: "theme.light" },
  { mode: "dark", icon: Moon, labelKey: "theme.dark" },
];

/**
 * Téma-választó: Rendszer / Világos / Sötét.
 * `compact`: csak ikonok (fejléc), `full`: ikon + felirat (mobilmenü, Admin).
 */
export function ThemeSwitcher({ variant = "compact" }: { variant?: "compact" | "full" }) {
  const { t } = useI18n();
  // A szerveren még nem tudjuk a választást → az oldal betöltése után jelenik meg.
  const mode = useSyncExternalStore(subscribeTheme, currentMode, () => null);

  return (
    <div
      role="group"
      aria-label={t("theme.choose")}
      className={
        variant === "compact"
          ? "flex items-center rounded-full border border-current/25 p-0.5"
          : "grid grid-cols-3 gap-2"
      }
    >
      {OPTIONS.map(({ mode: option, icon: Icon, labelKey }) => {
        const active = mode === option;
        const label = t(labelKey);
        return (
          <button
            key={option}
            type="button"
            onClick={() => setThemeMode(option)}
            aria-pressed={mode === null ? undefined : active}
            title={label}
            className={
              variant === "compact"
                ? `grid h-7 w-7 place-items-center rounded-full ${
                    active ? "bg-current/15" : "opacity-80 hover:bg-current/10 hover:opacity-100"
                  }`
                : `flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-sm font-semibold ${
                    active
                      ? "border-rm-gold bg-rm-gold/15"
                      : "border-line hover:border-current/40 hover:bg-surface"
                  }`
            }
          >
            <Icon aria-hidden className={variant === "compact" ? "h-4 w-4" : "h-5 w-5"} />
            {variant === "compact" ? <span className="sr-only">{label}</span> : <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
