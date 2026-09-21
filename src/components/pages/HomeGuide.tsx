"use client";

import { CircleQuestionMark, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Markdown } from "@/components/site/Markdown";
import { useI18n } from "@/lib/i18n/client";

/** Egy saját szöveg a nyelvével (fordítás, vagy ha nincs: a magyar eredeti). */
type Localized = { text: string; lang: string };

/**
 * A kezdőlap útbaigazító leírása egy gomb mögött („Hol vagy? Mi ez?”).
 * Natív <dialog> ablakban nyílik meg: az Esc és a háttérre kattintás bezárja,
 * a fókusz az ablakon belül marad, utána visszakerül a gombra.
 * A gomb felirata és a szöveg az Adminban szerkeszthető (Kezdőlap), a
 * fordításuk a „Saját szövegek fordítása” oldalon.
 */
export function HomeGuide({
  button,
  title,
  text,
  children,
}: {
  button: Localized;
  title: Localized;
  text: Localized;
  /** Az aloldalak dobozai (a szerveren készülnek el). */
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        lang={button.lang}
        data-testid="home-guide-button"
        className="inline-flex items-center gap-2.5 rounded-full border-2 border-white/70 bg-black/35 px-5 py-3 font-display text-base font-extrabold tracking-wide text-white uppercase backdrop-blur hover:border-rm-gold hover:text-rm-gold sm:text-lg"
      >
        <CircleQuestionMark aria-hidden className="h-5 w-5 shrink-0" strokeWidth={2.4} />
        {button.text}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="home-guide-title"
        data-testid="home-guide-dialog"
        className="guide-modal"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
          <h2 id="home-guide-title" lang={title.lang} className="font-display text-2xl font-black tracking-tight uppercase sm:text-3xl">
            {title.text}
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={t("common.close")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line hover:bg-surface"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-6 p-5 sm:p-6">
          <Markdown lang={text.lang} className="prose-lg">
            {text.text}
          </Markdown>
          {children}
        </div>
      </dialog>
    </>
  );
}
