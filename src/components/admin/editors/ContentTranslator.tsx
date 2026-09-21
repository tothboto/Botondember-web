"use client";

import { Check, CircleSlash, Languages, PencilLine, Search, Send, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useMemo, useState, useTransition, type ReactNode } from "react";
import {
  approveContentTranslation,
  cancelContentTranslationRequest,
  keepContentOriginal,
  requestContentTranslation,
  requestMissingTranslations,
  saveContentTranslations,
  undoKeepOriginal,
} from "@/app/actions/admin/content-i18n";
import type { ActionResult } from "@/lib/admin/result";
import type { ContentFormat } from "@/lib/content-i18n/registry";
import {
  CONTENT_STATUSES,
  emptyCounts,
  lostTokens,
  STATUS_LABELS,
  type ContentStatus,
  type LocaleProgress,
  type Origin,
} from "@/lib/content-i18n/status";
import { LanguageFlag as Flag, ProgressBar, progressSummary } from "../TranslationProgress";
import { useToast } from "../Toast";
import { Button, Card, Select, TextInput } from "../ui";
import { useUnsavedChanges } from "../useUnsavedChanges";

export type ContentItem = {
  key: string;
  section: string;
  label: string;
  format: ContentFormat;
  maxLength: number;
  /** A magyar eredeti. */
  source: string;
  /** Hol szerkeszthető a magyar szöveg. */
  editHref: string;
  status: ContentStatus;
  /** A tárolt fordítás (vagy üres). */
  value: string;
  origin: Origin | null;
};

type Filter = "all" | "todo" | ContentStatus;
type ItemAction = "request" | "cancel" | "approve" | "keep" | "unkeep";

/** „Teendő”: ami még átnézésre vagy fordításra szorul. */
const TODO: readonly ContentStatus[] = ["missing", "auto", "outdated"];

const STATUS_STYLES: Record<ContentStatus, string> = {
  missing: "bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800",
  requested: "bg-sky-100 text-sky-900 ring-sky-300 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-800",
  auto: "bg-violet-100 text-violet-900 ring-violet-300 dark:bg-violet-950 dark:text-violet-100 dark:ring-violet-800",
  outdated: "bg-orange-100 text-orange-900 ring-orange-300 dark:bg-orange-950 dark:text-orange-100 dark:ring-orange-800",
  manual: "bg-emerald-100 text-emerald-900 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-800",
  keep: "bg-slate-100 text-slate-800 ring-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600",
};

const STATUS_HELP: Record<ContentStatus, string> = {
  missing: "Még nincs fordítás – a látogatók ezen a nyelven a magyar szöveget látják.",
  requested: "Fordításra vár: a következő /forditas futtatáskor elkészül.",
  auto: "Gépi fordítás – nézd át! Ha jó, nyomd meg a „Jóváhagyom” gombot; ha nem, javítsd ki és mentsd el.",
  outdated:
    "A magyar szöveg megváltozott, mióta ez a fordítás készült – a látogatók addig ezt a régebbi fordítást látják. Javítsd ki, hagyd jóvá, vagy kérj új fordítást.",
  manual: "Kész. A kézzel írt vagy jóváhagyott fordítást a gép soha nem írja felül.",
  keep: "Ezen a nyelven is a magyar (eredeti) szöveg jelenik meg – pl. egy névnél vagy márkanévnél.",
};

function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Egy szöveg                                                                  */
/* -------------------------------------------------------------------------- */

const ItemCard = memo(function ItemCard({
  item,
  locale,
  languageName,
  flag,
  edit,
  busy,
  onEdit,
  onAction,
}: {
  item: ContentItem;
  locale: string;
  languageName: string;
  flag: string;
  edit: string | undefined;
  busy: boolean;
  onEdit: (key: string, value: string) => void;
  onAction: (action: ItemAction, item: ContentItem) => void;
}) {
  const id = `ct-${item.key.replace(/[^A-Za-z0-9_-]/g, "-")}`;
  const value = edit ?? item.value;
  const dirty = edit !== undefined && edit !== item.value;
  const multiline = item.format !== "text";
  const keepMode = item.status === "keep" && !dirty;
  const lost = value.trim() ? lostTokens(item.source, value) : [];
  // A képernyőolvasónak: melyik szövegről van szó (a látható felirat mindig a név elején áll).
  const context = <span className="sr-only"> ({item.label})</span>;

  const action = (kind: ItemAction, label: string, icon: ReactNode, tone: "primary" | "secondary" = "secondary") => (
    <button
      type="button"
      disabled={busy}
      aria-label={`${label}: ${item.label}`}
      onClick={() => onAction(kind, item)}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${
        tone === "primary" ? "bg-primary text-primary-fg hover:brightness-110" : "border-2 border-line bg-bg text-fg hover:bg-surface-2"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  let actions: ReactNode = null;
  if (!dirty) {
    switch (item.status) {
      case "missing":
        actions = (
          <>
            {action("request", "Fordítás kérése", <Send aria-hidden className="h-4 w-4" />, "primary")}
            {action("keep", "Maradjon magyarul", <CircleSlash aria-hidden className="h-4 w-4" />)}
          </>
        );
        break;
      case "requested":
        actions = action("cancel", "Kérés visszavonása", <Undo2 aria-hidden className="h-4 w-4" />);
        break;
      case "auto":
        actions = (
          <>
            {action("approve", "Jóváhagyom", <Check aria-hidden className="h-4 w-4" />, "primary")}
            {action("request", "Új gépi fordítás kérése", <Send aria-hidden className="h-4 w-4" />)}
            {action("keep", "Maradjon magyarul", <CircleSlash aria-hidden className="h-4 w-4" />)}
          </>
        );
        break;
      case "outdated":
        actions = (
          <>
            {action("approve", "Így is jó – jóváhagyom", <Check aria-hidden className="h-4 w-4" />, "primary")}
            {action("request", "Új gépi fordítás kérése", <Send aria-hidden className="h-4 w-4" />)}
          </>
        );
        break;
      case "keep":
        actions = action("unkeep", "Mégis lefordítom", <Languages aria-hidden className="h-4 w-4" />);
        break;
      default:
        actions = null;
    }
  }

  return (
    <article aria-labelledby={`${id}-label`} className={`rounded-2xl bg-bg p-4 ring-1 sm:p-5 ${dirty ? "ring-2 ring-primary" : "ring-line"}`}>
      <header className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 id={`${id}-label`} className="font-bold">
          {item.label}
        </h3>
        <StatusBadge status={item.status} />
        {dirty && <span className="text-sm font-bold text-amber-700 dark:text-amber-300">• mentetlen</span>}
        <Link
          href={item.editHref}
          aria-label={`Magyar szöveg szerkesztése: ${item.label}`}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-link underline-offset-4 hover:underline"
        >
          <PencilLine aria-hidden className="h-4 w-4" />
          Magyar szöveg szerkesztése
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-muted">
            <Flag code="hu" />
            Magyar (eredeti)
          </p>
          <div lang="hu" className="rounded-xl bg-surface px-3.5 py-2.5 leading-relaxed break-words whitespace-pre-wrap ring-1 ring-line">
            {item.source}
          </div>
        </div>

        <div className="min-w-0">
          {keepMode ? (
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
              <Flag code={flag} />
              {languageName}
            </p>
          ) : (
            <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
              <Flag code={flag} />
              {languageName}
              {context}
            </label>
          )}
          {keepMode ? (
            <p className="rounded-xl border-2 border-dashed border-line px-3.5 py-2.5 text-muted">Itt is a magyar szöveg jelenik meg.</p>
          ) : (
            <textarea
              id={id}
              lang={locale}
              value={value}
              rows={multiline ? 3 : 1}
              maxLength={item.maxLength}
              placeholder="Írd ide a fordítást…"
              spellCheck
              onChange={(event) => onEdit(item.key, multiline ? event.target.value : event.target.value.replace(/\r?\n/g, " "))}
              onKeyDown={(event) => {
                if (!multiline && event.key === "Enter") event.preventDefault();
              }}
              aria-describedby={`${id}-help`}
              aria-invalid={lost.length > 0 || undefined}
              className={`block w-full resize-y rounded-xl border bg-bg px-3.5 py-2.5 leading-relaxed text-fg field-sizing-content placeholder:text-muted/80 ${
                !value.trim() ? "border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40" : "border-line"
              }`}
            />
          )}
          {item.format === "markdown" && !keepMode && (
            <p className="mt-1.5 text-xs text-muted">
              Formázott szöveg (Markdown): a **csillagokat**, a # jeleket és a [link](…) jelöléseket hagyd meg.
            </p>
          )}
          {lost.length > 0 && (
            <p className="mt-1.5 text-sm font-semibold text-red-700 dark:text-red-300">
              Hiányzik: {lost.map((token) => `{{${token}}}`).join(", ")} – ezeket hagyd benne, ide kerülnek az Adminban megadott adatok.
            </p>
          )}
        </div>
      </div>

      <p id={`${id}-help`} className="mt-3 text-sm text-muted">
        {dirty ? "Módosítottad – a lenti „Mentés” gombbal mentheted (kész fordításként)." : STATUS_HELP[item.status]}
      </p>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </article>
  );
});

/* -------------------------------------------------------------------------- */
/* Az oldal                                                                    */
/* -------------------------------------------------------------------------- */

export function ContentTranslator({
  locale,
  progress,
  items,
}: {
  locale: string;
  progress: LocaleProgress[];
  items: ContentItem[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [section, setSection] = useState("");
  const [query, setQuery] = useState("");

  const current = progress.find((p) => p.code === locale) ?? progress[0];
  const changes = useMemo(
    () => items.filter((item) => edits[item.key] !== undefined && edits[item.key] !== item.value).map((item) => ({ key: item.key, value: edits[item.key] })),
    [edits, items],
  );
  useUnsavedChanges(changes.length > 0);

  const onEdit = useCallback((key: string, value: string) => setEdits((all) => ({ ...all, [key]: value })), []);

  /** Egy művelet, utána friss adatok a szerverről. */
  const run = useCallback(
    (action: () => Promise<ActionResult<unknown>>, success: string | ((data: unknown) => string), after?: () => void) =>
      startTransition(async () => {
        const result = await action();
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(typeof success === "string" ? success : success(result.data));
        startTransition(() => {
          after?.();
          router.refresh();
        });
      }),
    [router, toast],
  );

  const onAction = useCallback(
    (kind: ItemAction, item: ContentItem) => {
      const target = { key: item.key, locale };
      if (kind === "request") run(() => requestContentTranslation(target), "Kérés rögzítve – a következő /forditas futtatáskor elkészül.");
      if (kind === "cancel") run(() => cancelContentTranslationRequest(target), "Kérés visszavonva.");
      if (kind === "approve") run(() => approveContentTranslation(target), "Jóváhagyva – kész!");
      if (kind === "keep") run(() => keepContentOriginal(target), "Rendben – ezen a nyelven is a magyar szöveg jelenik meg.");
      if (kind === "unkeep") run(() => undoKeepOriginal(target), "Most már lefordíthatod.");
    },
    [locale, run],
  );

  const save = () =>
    run(
      () => saveContentTranslations({ locale, items: changes }),
      (data) => `Mentve! (${(data as { saved: number }).saved} szöveg)`,
      () => setEdits({}),
    );

  const counts = useMemo(() => {
    const out = emptyCounts();
    for (const item of items) out[item.status]++;
    return out;
  }, [items]);
  const todoCount = TODO.reduce((sum, status) => sum + counts[status], 0);
  const candidates = items.filter((item) => item.status === "missing" || (item.status === "outdated" && item.origin === "auto")).length;

  const sections = useMemo(() => [...new Set(items.map((item) => item.section))], [items]);
  const needle = query.trim().toLowerCase();
  const visible = items.filter((item) => {
    if (filter === "todo" ? !TODO.includes(item.status) : filter !== "all" && item.status !== filter) return false;
    if (section && item.section !== section) return false;
    if (!needle) return true;
    return [item.label, item.source, edits[item.key] ?? item.value].some((text) => text.toLowerCase().includes(needle));
  });
  const grouped = sections
    .map((name) => [name, visible.filter((item) => item.section === name)] as const)
    .filter(([, list]) => list.length > 0);

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "Mind", count: items.length },
    { value: "todo", label: "Teendő", count: todoCount },
    ...CONTENT_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status], count: counts[status] })),
  ];

  return (
    <div className="space-y-8">
      {/* Nyelvválasztó a haladással */}
      <nav aria-label="Melyik nyelvre fordítasz?">
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {progress.map((p) => {
            const active = p.code === locale;
            return (
              <li key={p.code}>
                <Link
                  href={`/admin/tartalom-forditasa?nyelv=${p.code}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-full flex-col gap-2 rounded-2xl p-4 ${
                    active ? "bg-bg shadow-sm ring-2 ring-primary" : "bg-bg/70 ring-1 ring-line hover:bg-bg"
                  }`}
                >
                  <span className="flex items-center gap-2 font-bold">
                    <Flag code={p.flag} />
                    {p.name}
                    {!p.enabled && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold">kikapcsolva</span>}
                  </span>
                  <ProgressBar progress={p} />
                  <span className="text-sm text-muted">{progressSummary(p)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Card
        title="Automatikus fordítás (ingyenes)"
        description="A fordítást Claude készíti el – nem az oldal megnyitásakor, hanem előre: a kész fordítások az adatbázisba kerülnek, és itt bármikor átírhatod őket."
      >
        <div className="space-y-4">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Kérd a fordítást: egyenként a szövegeknél („Fordítás kérése”), vagy egyszerre a lenti gombbal.</li>
            <li>
              Nyisd meg a Claude Code-ot ebben a projektben, és írd be: <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">/forditas</code>
            </li>
            <li>A kész fordítások itt jelennek meg „Gépi – ellenőrizd” jelöléssel: nézd át, javítsd, ha kell, és hagyd jóvá.</li>
          </ol>
          <p className="text-sm text-muted">
            A kézzel írt vagy jóváhagyott fordítást a gép soha nem írja felül. Ha a magyar szöveget később átírod, a fordítás
            „Elavult” lesz – a látogatók addig a régebbi fordítást látják.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={pending || candidates === 0}
              onClick={() =>
                run(
                  () => requestMissingTranslations({ locale }),
                  (data) => `${(data as { requested: number }).requested} szöveg vár fordításra. Futtasd a Claude Code-ban: /forditas`,
                )
              }
            >
              <Send aria-hidden className="h-5 w-5" />
              Minden hiányzó és elavult szöveg kérése – {current.name} ({candidates})
            </Button>
            <Button
              tone="secondary"
              disabled={pending}
              onClick={() =>
                run(
                  () => requestMissingTranslations({ locale: "all" }),
                  (data) => {
                    const count = (data as { requested: number }).requested;
                    return count > 0
                      ? `${count} szöveg vár fordításra (minden nyelven). Futtasd a Claude Code-ban: /forditas`
                      : "Nincs mit kérni – minden szöveg le van fordítva, vagy már vár.";
                  },
                )
              }
            >
              Ugyanez minden bekapcsolt nyelvre
            </Button>
          </div>
          {counts.requested > 0 && (
            <p className="rounded-xl bg-sky-50 px-4 py-3 font-semibold text-sky-900 ring-1 ring-sky-200 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-800">
              {counts.requested} szöveg vár fordításra ezen a nyelven. Futtasd a Claude Code-ban: /forditas
            </p>
          )}
        </div>
      </Card>

      {/* Szűrők */}
      <div className="space-y-4">
        <div role="group" aria-label="Szűrés állapot szerint" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1 ${
                filter === f.value ? "bg-primary text-primary-fg ring-primary" : "bg-bg ring-line hover:bg-surface-2"
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 text-xs ${filter === f.value ? "bg-primary-fg text-primary" : "bg-surface-2"}`}>{f.count}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-60 flex-1">
            <label htmlFor="ct-search" className="sr-only">
              Keresés a szövegek között
            </label>
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <TextInput id="ct-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Keresés (magyarul vagy a fordításban)…" className="pl-9" />
          </div>
          <div className="w-full sm:w-72">
            <label htmlFor="ct-section" className="sr-only">
              Melyik rész
            </label>
            <Select id="ct-section" value={section} onChange={(event) => setSection(event.target.value)}>
              <option value="">Minden rész</option>
              {sections.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          {visible.length} szöveg látszik a(z) {items.length} közül.
        </p>
      </div>

      {/* A szövegek részenként */}
      {grouped.map(([name, list]) => (
        <section key={name} aria-label={name} className="space-y-4">
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold">
            {name}
            <span className="rounded-full bg-surface-2 px-2 text-sm">{list.length}</span>
          </h2>
          <ul className="space-y-4">
            {list.map((item) => (
              <li key={item.key}>
                <ItemCard
                  item={item}
                  locale={locale}
                  languageName={current.name}
                  flag={current.flag}
                  edit={edits[item.key]}
                  busy={pending}
                  onEdit={onEdit}
                  onAction={onAction}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
      {visible.length === 0 && <p className="rounded-xl bg-bg p-6 text-center text-muted ring-1 ring-line">Nincs ilyen szöveg.</p>}

      {changes.length > 0 && (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-2xl bg-bg p-3 shadow-lg ring-1 ring-line">
          <span className="font-semibold text-amber-700 dark:text-amber-300">{changes.length} mentetlen fordítás</span>
          <Button onClick={save} disabled={pending}>
            {pending ? "Mentés…" : "Mentés"}
          </Button>
          <Button
            tone="secondary"
            disabled={pending}
            onClick={() => {
              if (window.confirm("Elveted az összes mentetlen változtatást?")) setEdits({});
            }}
          >
            Elvetés
          </Button>
        </div>
      )}
    </div>
  );
}
