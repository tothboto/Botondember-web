"use client";

import { Download, History, TriangleAlert, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { useToast } from "../Toast";
import { Button, Card } from "../ui";

type SafetyBackup = { name: string; size: number; createdAt: number };
type Report = { rows: number; files: number; warnings: string[]; safetyBackup: string | null };

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/** Mentés letöltése, visszaállítás mentésből, automatikus biztonsági mentések. */
export function BackupPanel({
  stats,
  safetyBackups,
}: {
  stats: { images: number; imageBytes: number; items: number };
  safetyBackups: SafetyBackup[];
}) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const restore = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    const ok = window.confirm(
      `Biztosan visszaállítod ezt a mentést: „${file.name}”?\n\nAz oldal TELJES jelenlegi tartalma (szövegek, képek, beállítások, fordítások) lecserélődik a mentésben lévőre. ` +
        "Előtte automatikusan készül egy biztonsági mentés a mostani állapotról, így szükség esetén visszaléphetsz.\n\nA belépési adataid nem változnak.",
    );
    if (!ok) return;
    setRestoring(true);
    setReport(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/backup", { method: "POST", body: form });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; report?: Report } | null;
      if (!response.ok || !data?.ok || !data.report) throw new Error(data?.error ?? "A visszaállítás nem sikerült.");
      setReport(data.report);
      toast.success("Kész! Az oldal tartalma visszaállt a mentésből.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "A visszaállítás nem sikerült.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card
        title="Mentés letöltése"
        description="Egyetlen ZIP fájl az oldal teljes tartalmával: szövegek, beállítások, fordítások és az összes kép. A belépési adatok (felhasználónév, jelszó) nincsenek benne."
      >
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="/api/admin/backup"
            download
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-fg hover:brightness-110"
          >
            <Download aria-hidden className="h-5 w-5" />
            Mentés letöltése (.zip)
          </a>
          <p className="text-sm text-muted">
            Most: {stats.items} tartalmi elem, {stats.images} kép (kb. {formatSize(stats.imageBytes)}).
          </p>
        </div>
        <p className="mt-4 text-sm text-muted">
          Tipp: nagyobb változtatás előtt tölts le egy mentést, és tartsd egy biztonságos helyen (pl. egy pendrive-on vagy a felhőben).
        </p>
      </Card>

      <Card title="Visszaállítás mentésből" description="Egy korábban letöltött mentés visszatöltése. Ez az oldal teljes jelenlegi tartalmát lecseréli.">
        <div className="space-y-4">
          <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-50 dark:ring-amber-800">
            <TriangleAlert aria-hidden className="h-5 w-5 shrink-0" />
            <span>
              A visszaállítás előtt az oldal automatikusan elmenti a mostani állapotot (lásd lent), így ha rossz fájlt választottál,
              vissza tudsz lépni.
            </span>
          </p>
          <Button onClick={() => fileRef.current?.click()} disabled={restoring}>
            <Upload aria-hidden className="h-4 w-4" />
            {restoring ? "Visszaállítás folyamatban…" : "Mentésfájl kiválasztása…"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".zip,application/zip"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => restore(event.target.files?.[0])}
          />
          {report && (
            <div role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-950 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-50 dark:ring-emerald-800">
              <p className="font-bold">Sikeres visszaállítás</p>
              <p className="text-sm">
                {report.rows} adat és {report.files} fájl töltődött vissza.
                {report.safetyBackup && ` A korábbi állapot mentése: ${report.safetyBackup}`}
              </p>
              {report.warnings.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {report.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card
        title="Automatikus biztonsági mentések"
        description="Minden visszaállítás előtt készül egy (a legutóbbi 5 marad meg). Ha egy visszaállítás után mégis a korábbi állapot kell, töltsd le innen, és állítsd vissza."
      >
        {safetyBackups.length === 0 ? (
          <p className="text-muted">Még nincs automatikus mentés.</p>
        ) : (
          <ul className="space-y-2">
            {safetyBackups.map((backup) => (
              <li key={backup.name} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                <History aria-hidden className="h-5 w-5 text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{formatDateTime(backup.createdAt)}</span>
                  <span className="block truncate font-mono text-xs text-muted">
                    {backup.name} · {formatSize(backup.size)}
                  </span>
                </span>
                <a
                  href={`/api/admin/backup?auto=${encodeURIComponent(backup.name)}`}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-bold hover:bg-surface-2"
                >
                  <Download aria-hidden className="h-4 w-4" />
                  Letöltés
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
