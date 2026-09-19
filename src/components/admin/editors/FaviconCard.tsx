"use client";

import { RotateCcw, TriangleAlert, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { resetFavicon } from "@/app/actions/admin/settings";
import { useToast } from "../Toast";
import { Button, Card } from "../ui";

/**
 * Favicon (a böngészőfül kis ikonja): előnézet, feltöltés és visszaállítás.
 * A feltöltött képből a szerver elkészíti az összes szükséges méretet.
 */
export function FaviconCard({ version, siteName }: { version: string | null; siteName: string }) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const base = `/icons/${version ?? "default"}`;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setWarning(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/favicon", { method: "POST", body: form });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; warning?: string | null } | null;
      if (!response.ok || !data?.ok) throw new Error(data?.error ?? "A feltöltés nem sikerült.");
      setWarning(data.warning ?? null);
      toast.success("Mentve! Az új ikon a böngészőfülön néhány másodperc (vagy egy frissítés) után látszik.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "A feltöltés nem sikerült.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const reset = () => {
    if (!window.confirm("Visszaállítod a beépített „B” ikont? A feltöltött ikon törlődik.")) return;
    startTransition(async () => {
      const result = await resetFavicon();
      if (result.ok) {
        setWarning(null);
        toast.success("Visszaállítva az alap ikonra.");
        router.refresh();
      } else toast.error(result.error);
    });
  };

  return (
    <Card
      title="Favicon (a böngészőfül ikonja)"
      description="Tölts fel egy négyzetes PNG képet (legalább 512×512 pixel) vagy egy .ico fájlt – a szükséges méreteket az oldal elkészíti."
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Előnézet: böngészőfül világos és sötét módban + a nagy ikonok */}
        <div className="space-y-3">
          {(["light", "dark"] as const).map((mode) => (
            <div
              key={mode}
              className={`flex w-72 max-w-full items-center gap-2 rounded-t-xl px-3 py-2 text-sm ${
                mode === "light" ? "bg-[#f1f3f4] text-[#202124]" : "bg-[#35363a] text-[#e8eaed]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${base}/icon-32.png`} alt="" width={16} height={16} className="h-4 w-4 shrink-0" />
              <span className="truncate">{siteName}</span>
              <span className="sr-only">{mode === "light" ? "(világos böngészőfül)" : "(sötét böngészőfül)"}</span>
            </div>
          ))}
          <div className="flex items-end gap-4 pt-2">
            {[
              { file: "icon-192.png", size: 64, label: "Android" },
              { file: "apple-touch-icon.png", size: 56, label: "iPhone" },
              { file: "icon-32.png", size: 32, label: "32 px" },
              { file: "icon-16.png", size: 16, label: "16 px" },
            ].map((icon) => (
              <figure key={icon.file} className="flex flex-col items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${base}/${icon.file}`}
                  alt=""
                  width={icon.size}
                  height={icon.size}
                  className={icon.file === "apple-touch-icon.png" ? "rounded-xl ring-1 ring-line" : ""}
                />
                <figcaption className="text-xs text-muted">{icon.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <p className="text-sm text-muted">
            Jelenleg: <strong className="text-fg">{version ? "saját, feltöltött ikon" : "a beépített „B” monogram"}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload aria-hidden className="h-4 w-4" />
              {uploading ? "Feltöltés…" : "Új ikon feltöltése"}
            </Button>
            {version && (
              <Button tone="secondary" onClick={reset} disabled={pending || uploading}>
                <RotateCcw aria-hidden className="h-4 w-4" />
                Alap ikon visszaállítása
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/x-icon,image/vnd.microsoft.icon,.ico,image/jpeg,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => upload(event.target.files?.[0])}
          />
          {warning && (
            <p role="alert" className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-50 dark:ring-amber-800">
              <TriangleAlert aria-hidden className="h-5 w-5 shrink-0" />
              {warning}
            </p>
          )}
          <p className="text-sm text-muted">
            Tipp: egy egyszerű, erős színű jel mutat jól ilyen kicsiben (pl. egy betű vagy egy ikon). SVG fájl biztonsági okból nem tölthető fel.
          </p>
        </div>
      </div>
    </Card>
  );
}
