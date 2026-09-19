"use client";

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react";
import type { MediaInfo } from "@/lib/media/library";

type MediaLibraryApi = {
  items: MediaInfo[];
  byId: (id: number | null | undefined) => MediaInfo | undefined;
  upload: (file: File, alt?: string) => Promise<MediaInfo>;
  add: (item: MediaInfo) => void;
  remove: (id: number) => void;
  updateAlt: (id: number, alt: string) => void;
};

const MediaLibraryContext = createContext<MediaLibraryApi | null>(null);

/** Képfeltöltés az Admin feltöltő útvonalára (hibánál magyar üzenetet dob). */
export async function uploadImage(file: File, alt = ""): Promise<MediaInfo> {
  const form = new FormData();
  form.append("file", file);
  form.append("alt", alt);
  const response = await fetch("/api/admin/media", { method: "POST", body: form });
  const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; media?: MediaInfo } | null;
  if (!response.ok || !data?.ok || !data.media) {
    throw new Error(data?.error ?? "A feltöltés nem sikerült.");
  }
  return data.media;
}

/** A médiatár képei az Admin oldalon (a képmezők és a választó ablak közös listája). */
export function MediaLibraryProvider({ initial, children }: { initial: MediaInfo[]; children: ReactNode }) {
  const [items, setItems] = useState<MediaInfo[]>(initial);

  const add = useCallback((item: MediaInfo) => {
    setItems((list) => [item, ...list.filter((m) => m.id !== item.id)]);
  }, []);

  const api = useMemo<MediaLibraryApi>(
    () => ({
      items,
      byId: (id) => (id ? items.find((m) => m.id === id) : undefined),
      upload: async (file, alt) => {
        const item = await uploadImage(file, alt);
        add(item);
        return item;
      },
      add,
      remove: (id) => setItems((list) => list.filter((m) => m.id !== id)),
      updateAlt: (id, alt) => setItems((list) => list.map((m) => (m.id === id ? { ...m, alt } : m))),
    }),
    [items, add],
  );

  return <MediaLibraryContext value={api}>{children}</MediaLibraryContext>;
}

export function useMediaLibrary(): MediaLibraryApi {
  const api = use(MediaLibraryContext);
  if (!api) throw new Error("MediaLibraryProvider hiányzik");
  return api;
}
