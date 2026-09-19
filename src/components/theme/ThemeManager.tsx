"use client";

import { useLayoutEffect } from "react";
import type { ThemeMode } from "@/lib/settings";
import { applyTheme, currentMode, notifyTheme, THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Figyeli a számítógép világos/sötét beállítását („Rendszer” módban) és a
 * többi böngészőlapon történt témaváltást. Fejlesztés közben (Strict Mode)
 * a React törölheti a <html> osztályát – ez azonnal visszaállítja.
 */
export function ThemeManager({ defaultMode }: { defaultMode: ThemeMode }) {
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme-default", defaultMode);
    applyTheme(currentMode());
    notifyTheme();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (currentMode() === "system") applyTheme("system");
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) {
        applyTheme(currentMode());
        notifyTheme();
      }
    };
    media.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [defaultMode]);

  return null;
}
