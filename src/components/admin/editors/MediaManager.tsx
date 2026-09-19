"use client";

import { Search, Trash, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type DragEvent } from "react";
import { deleteMediaItem, updateMediaAlt } from "@/app/actions/admin/media";
import { formatDate } from "@/lib/format";
import type { MediaInfo } from "@/lib/media/library";
import { uploadImage } from "../MediaLibrary";
import { useToast } from "../Toast";
import { Button, Card, TextInput } from "../ui";
import { useUnsavedChanges } from "../useUnsavedChanges";

type Filter = "all" | "noAlt" | "unused";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Mind" },
  { value: "noAlt", label: "Alt szöveg nélkül" },
  { value: "unused", label: "Nincs használatban" },
];

const SOURCE_LABELS: Record<string, string> = {
  upload: "Feltöltött",
  youtube: "YouTube bélyegkép",
  placeholder: "Minta",
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

function MediaCard({ item, usage, onChanged }: { item: MediaInfo; usage: string[]; onChanged: () => void }) {
  const toast = useToast();
  const [alt, setAlt] = useState(item.alt);
  const [pending, startTransition] = useTransition();
  const dirty = alt.trim() !== item.alt;
  useUnsavedChanges(dirty);
  const name = item.originalName || `#${item.id}`;

  const saveAlt = () =>
    startTransition(async () => {
      const result = await updateMediaAlt(item.id, alt);
      if (result.ok) {
        toast.success("Mentve!");
        onChanged();
      } else toast.error(result.error);
    });

  const remove = () => {
    const warning =
      usage.length > 0
        ? `Ez a kép használatban van:\n\n• ${usage.join("\n• ")}\n\nHa törlöd, ezekről a helyekről eltűnik. Biztosan törlöd?`
        : `Biztosan törlöd ezt a képet: „${name}”? Ez nem vonható vissza.`;
    if (!window.confirm(warning)) return;
    startTransition(async () => {
      let result = await deleteMediaItem(item.id, usage.length > 0);
      // Ha közben valahol használatba került, a friss lista alapján még egyszer rákérdezünk.
      if (result.ok && !result.data.deleted) {
        const again = `Ez a kép közben használatba került:\n\n• ${result.data.usage.join("\n• ")}\n\nMégis törlöd?`;
        if (!window.confirm(again)) return;
        result = await deleteMediaItem(item.id, true);
      }
      if (result.ok) {
        toast.success("Kép törölve");
        onChanged();
      } else toast.error(result.error);
    });
  };

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl bg-bg ring-1 ring-line" aria-busy={pending || undefined}>
      <div className="relative aspect-[4/3] bg-surface-2">
        <Image src={item.src} alt="" fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 45vw, 100vw" className="object-contain" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-bold" title={name}>
            {name}
          </p>
          <p className="text-sm text-muted">
            {item.width}×{item.height} px · {formatSize(item.size)} · {formatDate(item.createdAt, "hu")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold">{SOURCE_LABELS[item.source] ?? item.source}</span>
            {usage.length > 0 ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100" title={usage.join("\n")}>
                Használatban ({usage.length})
              </span>
            ) : (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-muted">Nincs használatban</span>
            )}
            {!item.alt && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                Hiányzik az alt szöveg
              </span>
            )}
          </div>
          {usage.length > 0 && (
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer font-semibold text-link">Hol használom?</summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
                {usage.map((place) => (
                  <li key={place}>{place}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
        <div className="mt-auto space-y-2">
          <label htmlFor={`media-${item.id}-alt`} className="block text-sm font-semibold">
            Alt szöveg (mit ábrázol a kép?)
          </label>
          <TextInput id={`media-${item.id}-alt`} value={alt} maxLength={300} onChange={(event) => setAlt(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveAlt} disabled={!dirty || pending} className="flex-1">
              Mentés
            </Button>
            <Button tone="secondary" onClick={remove} disabled={pending} className="text-red-700 dark:text-red-300">
              <Trash aria-hidden className="h-4 w-4" />
              Törlés<span className="sr-only">: {name}</span>
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

/** Médiatár: feltöltés (több kép egyszerre, húzással is), keresés, alt szöveg, törlés. */
export function MediaManager({ items, usage }: { items: MediaInfo[]; usage: Record<number, string[]> }) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setProgress({ done: 0, total: files.length });
    let ok = 0;
    for (const [index, file] of files.entries()) {
      try {
        await uploadImage(file);
        ok++;
      } catch (error) {
        toast.error(`${file.name}: ${error instanceof Error ? error.message : "a feltöltés nem sikerült."}`);
      }
      setProgress({ done: index + 1, total: files.length });
    }
    setProgress(null);
    if (fileRef.current) fileRef.current.value = "";
    if (ok > 0) {
      toast.success(ok === 1 ? "Kép feltöltve! Ne felejtsd el megadni az alt szövegét." : `${ok} kép feltöltve! Add meg az alt szövegüket is.`);
      router.refresh();
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void uploadFiles(Array.from(event.dataTransfer.files));
  };

  const needle = query.trim().toLowerCase();
  const visible = items.filter((item) => {
    if (needle && !`${item.alt} ${item.originalName}`.toLowerCase().includes(needle)) return false;
    if (filter === "noAlt") return !item.alt;
    if (filter === "unused") return !usage[item.id]?.length;
    return true;
  });
  const totalSize = items.reduce((sum, item) => sum + item.size, 0);

  return (
    <div className="space-y-8">
      <Card title="Feltöltés">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center ${
            dragging ? "border-primary bg-primary/10" : "border-line"
          }`}
        >
          <Upload aria-hidden className="h-8 w-8 text-muted" />
          <p className="font-semibold">Húzd ide a képeket, vagy</p>
          <Button onClick={() => fileRef.current?.click()} disabled={progress !== null}>
            {progress ? `Feltöltés… ${progress.done}/${progress.total}` : "Válassz képeket a gépedről"}
          </Button>
          <p className="text-sm text-muted">
            PNG, JPG, WEBP vagy GIF, képenként legfeljebb 10 MB. A képeket az oldal automatikusan kicsinyíti és WEBP formátumba alakítja.
          </p>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => uploadFiles(Array.from(event.target.files ?? []))}
          />
        </div>
      </Card>

      <section aria-labelledby="media-list-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="media-list-title" className="font-display text-xl font-extrabold">
              Képek ({items.length})
            </h2>
            <p className="text-sm text-muted">Összesen {formatSize(totalSize)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <label htmlFor="media-search" className="sr-only">
                Keresés a képek között
              </label>
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <TextInput
                id="media-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Keresés…"
                className="pl-9 sm:w-64"
              />
            </div>
            <div role="group" aria-label="Szűrés" className="flex flex-wrap gap-1 rounded-xl border border-line p-1">
              {FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    filter === option.value ? "bg-primary text-primary-fg" : "hover:bg-surface-2"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-2xl bg-bg p-6 text-center text-muted ring-1 ring-line">
            {items.length === 0 ? "Még nincs egy kép sem. Tölts fel néhányat!" : "Nincs a keresésnek megfelelő kép."}
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visible.map((item) => (
              <MediaCard
                key={`${item.id}-${item.alt}`}
                item={item}
                usage={usage[item.id] ?? []}
                onChanged={() => router.refresh()}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
