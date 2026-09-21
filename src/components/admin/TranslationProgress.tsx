import type { ContentStatus, LocaleProgress } from "@/lib/content-i18n/status";

/** Kis zászló a nyelvek mellé (díszítés – a nyelv neve mindig ki van írva mellette). */
export function LanguageFlag({ code }: { code: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/${code}.svg`} alt="" width={20} height={15} className="h-[15px] w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-black/10" />;
}

/** A haladásjelző sáv színei (a hiányzó rész üresen marad). */
const BAR_STYLES: Partial<Record<ContentStatus, string>> = {
  manual: "bg-emerald-500",
  keep: "bg-slate-400",
  auto: "bg-violet-500",
  outdated: "bg-orange-500",
  requested: "bg-sky-500",
};

/** Színes sáv: kész · magyarul marad · gépi · elavult · vár (a szöveges összegzés mellette áll). */
export function ProgressBar({ progress }: { progress: LocaleProgress }) {
  return (
    <span aria-hidden className="flex h-2 w-full overflow-hidden rounded-full bg-surface-2 ring-1 ring-line">
      {(["manual", "keep", "auto", "outdated", "requested"] as const).map((status) =>
        progress.counts[status] > 0 ? (
          <span
            key={status}
            className={BAR_STYLES[status]}
            style={{ width: `${(progress.counts[status] / Math.max(1, progress.total)) * 100}%` }}
          />
        ) : null,
      )}
    </span>
  );
}

/** Pl. „12/60 kész · 30 gépi · 2 elavult · 16 hiányzik · 3 vár”. */
export function progressSummary(p: LocaleProgress): string {
  const parts = [`${p.counts.manual + p.counts.keep}/${p.total} kész`, `${p.counts.auto} gépi`, `${p.counts.outdated} elavult`, `${p.counts.missing} hiányzik`];
  if (p.counts.requested > 0) parts.push(`${p.counts.requested} vár`);
  return parts.join(" · ");
}
