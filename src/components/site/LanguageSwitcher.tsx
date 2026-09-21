"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useI18n } from "@/lib/i18n/client";
import { setLocaleCookie } from "@/lib/i18n/locale-cookie";
import type { PublicLocale } from "@/lib/i18n/server";

/**
 * Nyelvválasztó zászlók. Kattintásra a választás egy sütibe kerül (1 évre),
 * és az oldal az új nyelven töltődik újra – az URL nem változik.
 * SVG zászlókat használunk, mert a Windows nem jeleníti meg a zászló-emojikat.
 */
export function LanguageSwitcher({ locales, size = "sm" }: { locales: PublicLocale[]; size?: "sm" | "lg" }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (code: string) => {
    if (code === locale) return;
    setLocaleCookie(code);
    startTransition(() => router.refresh());
  };

  const flag = size === "lg" ? { w: 32, h: 24 } : { w: 24, h: 18 };
  // „Váltás erre a nyelvre: {name}” – a mondat az oldal nyelvén van, csak a nyelv neve más nyelvű.
  const [before, after = ""] = t("lang.switchTo").split("{name}");

  return (
    <ul aria-label={t("lang.choose")} aria-busy={pending || undefined} className="flex flex-wrap items-center gap-1">
      {locales.map((l) => {
        const current = l.code === locale;
        return (
          <li key={l.code}>
            <button
              type="button"
              onClick={() => choose(l.code)}
              aria-pressed={current}
              title={l.name}
              className={`grid place-items-center rounded-md p-1 ${
                current ? "ring-2 ring-rm-gold" : "opacity-75 hover:opacity-100"
              }`}
            >
              <Image
                src={`/flags/${l.flag}.svg`}
                alt=""
                width={flag.w}
                height={flag.h}
                className="rounded-[3px] shadow-sm ring-1 ring-black/15"
                style={{ width: flag.w, height: flag.h, objectFit: "cover" }}
              />
              <span className="sr-only">
                {!current && before}
                <span lang={l.code}>{l.name}</span>
                {!current && after}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
