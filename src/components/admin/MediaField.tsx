"use client";

import { Images, Search, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { MediaInfo } from "@/lib/media/library";
import { useMediaLibrary } from "./MediaLibrary";
import { useToast } from "./Toast";
import { Button, Field, TextInput } from "./ui";

/** Választó ablak: a médiatár képei rácsban, kereséssel. */
function MediaPicker({ onClose, onSelect }: { onClose: () => void; onSelect: (media: MediaInfo) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { items } = useMediaLibrary();
  const [query, setQuery] = useState("");

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? items.filter((m) => `${m.alt} ${m.originalName}`.toLowerCase().includes(needle))
    : items;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="media-picker-title"
      className="modal w-[min(96vw,64rem)]"
      onClick={(event) => {
        if (event.target === event.currentTarget) ref.current?.close();
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line p-4">
        <h2 id="media-picker-title" className="font-display text-xl font-extrabold">
          Válassz képet a médiatárból
        </h2>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Bezárás"
          className="grid h-10 w-10 place-items-center rounded-lg border border-line hover:bg-surface"
        >
          <X aria-hidden className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4 pb-0">
        <label htmlFor="media-picker-search" className="sr-only">
          Keresés a képek között
        </label>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <TextInput
            id="media-picker-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Keresés név vagy alt szöveg alapján…"
            className="pl-9"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="p-6 text-center text-muted">Nincs találat.</p>
      ) : (
        <ul className="grid max-h-[62vh] grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="block w-full overflow-hidden rounded-xl text-left ring-1 ring-line hover:ring-2 hover:ring-primary"
              >
                <span className="relative block aspect-[4/3] bg-surface-2">
                  <Image src={item.src} alt="" fill sizes="220px" className="object-cover" />
                </span>
                <span className="block truncate px-2.5 py-1.5 text-sm">{item.alt || item.originalName || `#${item.id}`}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </dialog>
  );
}

/**
 * Képmező: előnézet, feltöltés, választás a médiatárból, eltávolítás és az
 * alt szöveg (a képernyőolvasóknak – minden képhez kötelezően kérjük).
 */
export function MediaField({
  id,
  label,
  value,
  onChange,
  alt,
  onAltChange,
  aspect = "16 / 9",
  hint,
  fit = "cover",
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (id: number | null, media?: MediaInfo) => void;
  alt: string;
  onAltChange: (alt: string) => void;
  aspect?: string;
  hint?: string;
  /** „contain”: a teljes kép látszik (pl. átlátszó hátterű rajznál). */
  fit?: "cover" | "contain";
}) {
  const library = useMediaLibrary();
  const toast = useToast();
  const current = library.byId(value);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const media = await library.upload(file, alt);
      onChange(media.id, media);
      toast.success("Kép feltöltve!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "A feltöltés nem sikerült.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <fieldset className="space-y-3 rounded-xl border border-line p-4">
      <legend className="px-1 font-semibold">{label}</legend>
      {/* Konténer-lekérdezés: a kép csak akkor kerül a gombok mellé, ha a mező elég széles. */}
      <div className="@container">
        <div className="flex flex-col gap-4 @xl:flex-row @xl:items-start">
          <div
            className="relative w-full max-w-sm shrink-0 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-line @xl:w-52"
            style={{ aspectRatio: aspect }}
          >
            {current ? (
              <Image src={current.src} alt="" fill sizes="384px" className={fit === "contain" ? "object-contain" : "object-cover"} />
            ) : (
              <div className="grid h-full place-items-center p-2 text-center text-sm text-muted">Nincs kép kiválasztva</div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Button tone="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload aria-hidden className="h-4 w-4" />
                {uploading ? "Feltöltés…" : "Kép feltöltése"}
              </Button>
              <Button tone="secondary" onClick={() => setPickerOpen(true)}>
                <Images aria-hidden className="h-4 w-4" />
                Választás a médiatárból
              </Button>
              {value !== null && (
                <Button tone="ghost" onClick={() => onChange(null)}>
                  <X aria-hidden className="h-4 w-4" />
                  Eltávolítás
                </Button>
              )}
            </div>
            <input
              ref={fileRef}
              id={`${id}-file`}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <p className="text-sm text-muted">{hint ?? "PNG, JPG, WEBP vagy GIF, legfeljebb 10 MB."}</p>
            {value !== null && (
              <Field
                label="Alt szöveg – mit ábrázol a kép?"
                htmlFor={`${id}-alt`}
                hint="A képernyőolvasók ezt olvassák fel. Pl.: „Botondember a focipályán”."
              >
                <TextInput id={`${id}-alt`} value={alt} maxLength={300} onChange={(event) => onAltChange(event.target.value)} />
              </Field>
            )}
          </div>
        </div>
      </div>
      {pickerOpen && (
        <MediaPicker
          onClose={() => setPickerOpen(false)}
          onSelect={(media) => {
            onChange(media.id, media);
            setPickerOpen(false);
          }}
        />
      )}
    </fieldset>
  );
}
