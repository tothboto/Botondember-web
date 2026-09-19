"use client";

import { ArrowUp } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/client";

const THRESHOLD = 400;

function subscribe(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  window.addEventListener("resize", callback);
  return () => {
    window.removeEventListener("scroll", callback);
    window.removeEventListener("resize", callback);
  };
}

/**
 * „Vissza a tetejére” gomb – kb. 400 px görgetés után jelenik meg a jobb alsó
 * sarokban. Sima görgetés, kivéve ha a látogató gépén be van kapcsolva a
 * „csökkentett mozgás”. Utána a fókusz a fejléc feliratára kerül.
 */
export function BackToTop() {
  const { t } = useI18n();
  const visible = useSyncExternalStore(
    subscribe,
    () => window.scrollY > THRESHOLD,
    () => false,
  );

  if (!visible) return null;

  const scrollToTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    document.querySelector<HTMLElement>("[data-brand-link]")?.focus({ preventScroll: true });
  };

  const label = t("common.backToTop");
  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={label}
      title={label}
      data-testid="back-to-top"
      className="fixed right-4 bottom-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-rm-gold text-rm-navy shadow-lg ring-2 ring-rm-navy/15 hover:bg-[var(--gold-light)] focus-visible:outline-rm-navy sm:right-6 sm:bottom-6 dark:ring-white/20 dark:focus-visible:outline-white"
    >
      <ArrowUp aria-hidden className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
}
