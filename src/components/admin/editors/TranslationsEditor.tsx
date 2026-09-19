"use client";

import { ArrowDown, ArrowUp, Plus, Search, Star, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useCallback, useMemo, useOptimistic, useState, useTransition, type FormEvent } from "react";
import {
  addLocale,
  deleteLocale,
  moveLocale,
  saveTranslations,
  setDefaultLocale,
  setLocaleEnabled,
  setShowFlags,
} from "@/app/actions/admin/i18n";
import type { ActionResult } from "@/lib/admin/result";
import { missingPlaceholders } from "@/lib/i18n/translate";
import { IconButton } from "../CollectionEditor";
import { useToast } from "../Toast";
import { Button, Card, Field, Select, TextInput, Toggle } from "../ui";
import { useUnsavedChanges } from "../useUnsavedChanges";

export type LocaleRow = { code: string; name: string; flag: string; enabled: boolean; isDefault: boolean };

export type TranslationEntry = {
  key: string;
  group: string;
  /** A beépített (kódbeli) magyar szöveg – ha az adatbázisban nincs magyar, ez jelenik meg. */
  builtinHu: string;
  /** Az adatbázisban tárolt értékek nyelvenként. */
  values: Record<string, string>;
};

type Edits = Record<string, Record<string, string>>;

const SOURCE = "hu";

function Flag({ code }: { code: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/${code}.svg`} alt="" width={20} height={15} className="h-[15px] w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-black/10" />;
}

/* -------------------------------------------------------------------------- */
/* Nyelvek                                                                     */
/* -------------------------------------------------------------------------- */

function LocalesCard({
  locales,
  showFlags,
  missingCount,
}: {
  locales: LocaleRow[];
  showFlags: boolean;
  missingCount: Record<string, number>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ code: "", name: "", flag: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // A kapcsolók azonnal átváltanak; ha a mentés nem sikerül, visszaállnak.
  const [shownLocales, setOptimisticLocale] = useOptimistic(locales, (state, patch: { code: string; enabled: boolean }) =>
    state.map((l) => (l.code === patch.code ? { ...l, enabled: patch.enabled } : l)),
  );
  const [shownFlags, setOptimisticFlags] = useOptimistic(showFlags);
  const enabledCount = shownLocales.filter((l) => l.enabled).length;

  const run = (action: () => Promise<ActionResult>, success: string, optimistic?: () => void) =>
    startTransition(async () => {
      optimistic?.();
      const result = await action();
      if (result.ok) {
        toast.success(success);
        router.refresh();
      } else toast.error(result.error);
    });

  const submitNew = async (event: FormEvent) => {
    event.preventDefault();
    const result = await addLocale(draft);
    if (result.ok) {
      toast.success("Új nyelv felvéve! Fordítsd le a szövegeit, majd kapcsold be.");
      setDraft({ code: "", name: "", flag: "" });
      setErrors({});
      setAdding(false);
      router.refresh();
    } else {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
    }
  };

  const flagPreview = /^[a-z]{2}(-[a-z]{2,5})?$/.test(draft.flag.trim().toLowerCase()) ? draft.flag.trim().toLowerCase() : null;

  return (
    <Card
      title="Nyelvek"
      description="A bekapcsolt nyelvek zászlói jelennek meg a fejlécben. Az alapnyelv az, amit egy új látogató először lát."
      actions={
        <Button onClick={() => setAdding(true)} disabled={adding}>
          <Plus aria-hidden className="h-5 w-5" />
          Új nyelv
        </Button>
      }
    >
      <div className="space-y-5" aria-busy={pending || undefined}>
        <Toggle
          id="i18n-show-flags"
          label="Nyelvválasztó (zászlók) megjelenítése a fejlécben"
          description="Kikapcsolva mindenki az alapnyelven látja az oldalt."
          checked={shownFlags}
          onChange={(checked) =>
            run(() => setShowFlags(checked), checked ? "Zászlók bekapcsolva" : "Zászlók kikapcsolva", () => setOptimisticFlags(checked))
          }
        />

        {adding && (
          <form onSubmit={submitNew} className="space-y-4 rounded-2xl border-2 border-primary/50 bg-surface p-4" noValidate>
            <h3 className="font-display text-lg font-extrabold">Új nyelv</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Nyelvkód" htmlFor="new-locale-code" hint="Pl. fr (francia), it (olasz), pt (portugál)." error={errors.code}>
                <TextInput
                  id="new-locale-code"
                  value={draft.code}
                  maxLength={12}
                  autoCapitalize="off"
                  spellCheck={false}
                  onChange={(event) => setDraft((d) => ({ ...d, code: event.target.value.toLowerCase() }))}
                />
              </Field>
              <Field label="A nyelv neve (az adott nyelven)" htmlFor="new-locale-name" hint="Pl. Français, Italiano." error={errors.name}>
                <TextInput id="new-locale-name" value={draft.name} maxLength={40} onChange={(event) => setDraft((d) => ({ ...d, name: event.target.value }))} />
              </Field>
              <Field label="Zászló (ország kódja)" htmlFor="new-locale-flag" hint="Pl. fr, it, gb, us, pt, br." error={errors.flag}>
                <div className="flex items-center gap-2">
                  <TextInput
                    id="new-locale-flag"
                    value={draft.flag}
                    maxLength={8}
                    autoCapitalize="off"
                    spellCheck={false}
                    onChange={(event) => setDraft((d) => ({ ...d, flag: event.target.value.toLowerCase() }))}
                  />
                  {flagPreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/flags/${flagPreview}.svg`} alt="" width={32} height={24} className="h-6 w-8 shrink-0 rounded-sm ring-1 ring-black/10" />
                  )}
                </div>
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Nyelv felvétele</Button>
              <Button tone="secondary" onClick={() => setAdding(false)}>
                Mégse
              </Button>
            </div>
          </form>
        )}

        <ol className="space-y-2">
          {shownLocales.map((locale, index) => (
            <li
              key={locale.code}
              className={`flex flex-wrap items-center gap-3 rounded-xl border border-line bg-bg p-3 ${locale.enabled ? "" : "opacity-80"}`}
            >
              <Flag code={locale.flag} />
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {locale.name} <span className="font-mono text-sm font-normal text-muted">({locale.code})</span>
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5 text-xs font-bold">
                  {locale.isDefault && <span className="rounded-full bg-primary px-2 py-0.5 text-primary-fg">Alapnyelv</span>}
                  {!locale.enabled && <span className="rounded-full bg-surface-2 px-2 py-0.5">Kikapcsolva</span>}
                  {missingCount[locale.code] > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                      {missingCount[locale.code]} hiányzó fordítás
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                      Minden lefordítva
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <label className="mr-2 flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={locale.enabled}
                    disabled={pending || (locale.enabled && (locale.isDefault || enabledCount <= 1))}
                    onChange={(event) => {
                      const enabled = event.target.checked;
                      run(
                        () => setLocaleEnabled(locale.code, enabled),
                        enabled ? `${locale.name} bekapcsolva` : `${locale.name} kikapcsolva`,
                        () => setOptimisticLocale({ code: locale.code, enabled }),
                      );
                    }}
                    className="h-5 w-5 accent-[var(--primary)]"
                  />
                  Bekapcsolva
                </label>
                <IconButton
                  label={`Legyen alapnyelv: ${locale.name}`}
                  disabled={pending || locale.isDefault || !locale.enabled}
                  pressed={locale.isDefault}
                  onClick={() => run(() => setDefaultLocale(locale.code), `Az alapnyelv mostantól: ${locale.name}`)}
                >
                  <Star className="h-4 w-4" />
                </IconButton>
                <IconButton label={`Feljebb: ${locale.name}`} disabled={pending || index === 0} onClick={() => run(() => moveLocale(locale.code, "up"), "Sorrend mentve")}>
                  <ArrowUp className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label={`Lejjebb: ${locale.name}`}
                  disabled={pending || index === locales.length - 1}
                  onClick={() => run(() => moveLocale(locale.code, "down"), "Sorrend mentve")}
                >
                  <ArrowDown className="h-4 w-4" />
                </IconButton>
                {locale.code !== SOURCE && !locale.isDefault && (
                  <IconButton
                    label={`Törlés: ${locale.name}`}
                    tone="danger"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(`Biztosan törlöd a(z) ${locale.name} nyelvet az összes fordításával együtt?`)) {
                        run(() => deleteLocale(locale.code), "Nyelv törölve");
                      }
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </IconButton>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Szövegek                                                                    */
/* -------------------------------------------------------------------------- */

const TranslationRow = memo(function TranslationRow({
  entry,
  locales,
  edits,
  onEdit,
}: {
  entry: TranslationEntry;
  locales: LocaleRow[];
  edits: Record<string, string> | undefined;
  onEdit: (key: string, locale: string, value: string) => void;
}) {
  const valueOf = (code: string) => edits?.[code] ?? entry.values[code] ?? "";
  const hu = valueOf(SOURCE) || entry.builtinHu;

  return (
    <div role="row" className="grid gap-3 border-b border-line py-4 lg:grid-cols-[var(--tr-cols)] lg:gap-2 lg:py-2.5">
      <div role="rowheader" className="min-w-0 lg:pr-2">
        <p lang="hu" className="font-semibold break-words lg:text-sm">
          {hu || <span className="text-muted">(üres)</span>}
        </p>
        <p className="font-mono text-xs break-all text-muted">{entry.key}</p>
      </div>
      {locales.map((locale) => {
        const id = `tr-${entry.key}-${locale.code}`;
        const value = valueOf(locale.code);
        const missing = !value.trim() && !(locale.code === SOURCE && entry.builtinHu);
        const changed = edits?.[locale.code] !== undefined && edits[locale.code] !== (entry.values[locale.code] ?? "");
        const lostPlaceholders = value.trim() ? missingPlaceholders(entry.builtinHu || hu, value) : [];
        return (
          <div role="cell" key={locale.code} className="min-w-0">
            <label htmlFor={id} className="mb-1 flex items-center gap-1.5 text-sm font-semibold lg:sr-only">
              <Flag code={locale.flag} />
              {locale.name}
              <span className="sr-only"> – {entry.key}</span>
            </label>
            {/* Egysoros szöveg, de a mező a hosszabb szövegekhez igazodva megnő (field-sizing). */}
            <textarea
              id={id}
              lang={locale.code}
              rows={1}
              value={value}
              maxLength={500}
              placeholder={locale.code === SOURCE ? entry.builtinHu : hu}
              onChange={(event) => onEdit(entry.key, locale.code, event.target.value.replace(/\r?\n/g, " "))}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
              aria-invalid={lostPlaceholders.length > 0 || undefined}
              className={`block w-full resize-none rounded-xl border border-line bg-bg px-3 py-2 text-sm leading-snug text-fg field-sizing-content placeholder:text-muted/80 ${
                missing ? "border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/60" : ""
              } ${changed ? "ring-2 ring-primary/40" : ""}`}
            />
            {lostPlaceholders.length > 0 && (
              <p className="mt-1 text-xs font-semibold text-red-700 dark:text-red-300">
                Hiányzik: {lostPlaceholders.map((p) => `{${p}}`).join(", ")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
});

function TranslationsTable({
  entries,
  locales,
  groups,
}: {
  entries: TranslationEntry[];
  locales: LocaleRow[];
  groups: Record<string, string>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [edits, setEdits] = useState<Edits>({});
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [saving, setSaving] = useState(false);

  const changes = useMemo(() => {
    const list: { key: string; locale: string; value: string }[] = [];
    for (const entry of entries) {
      for (const [locale, value] of Object.entries(edits[entry.key] ?? {})) {
        if (value !== (entry.values[locale] ?? "")) list.push({ key: entry.key, locale, value });
      }
    }
    return list;
  }, [edits, entries]);
  useUnsavedChanges(changes.length > 0);

  const onEdit = useCallback((key: string, locale: string, value: string) => {
    setEdits((current) => ({ ...current, [key]: { ...current[key], [locale]: value } }));
  }, []);

  const needle = query.trim().toLowerCase();
  const visible = entries.filter((entry) => {
    if (group && entry.group !== group) return false;
    const valueOf = (code: string) => edits[entry.key]?.[code] ?? entry.values[code] ?? "";
    if (onlyMissing && !locales.some((l) => !valueOf(l.code).trim() && !(l.code === SOURCE && entry.builtinHu))) return false;
    if (!needle) return true;
    if (entry.key.toLowerCase().includes(needle) || entry.builtinHu.toLowerCase().includes(needle)) return true;
    return locales.some((l) => valueOf(l.code).toLowerCase().includes(needle));
  });

  const save = async () => {
    setSaving(true);
    const result = await saveTranslations(changes);
    setSaving(false);
    if (result.ok) {
      toast.success(`Mentve! (${result.data.saved} szöveg)`);
      setEdits({});
      router.refresh();
    } else toast.error(result.error);
  };

  const columns = `minmax(12rem,1.1fr) repeat(${locales.length}, minmax(0,1fr))`;

  return (
    <Card
      title="Szövegek"
      description="A felület szövegei (menü, gombok, feliratok) nyelvenként. A sárga mező hiányzó fordítás – ott a magyar szöveg jelenik meg. A {kapcsos zárójeles} jeleket hagyd benne: oda kerül a szám vagy a név."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-60 flex-1">
            <label htmlFor="tr-search" className="sr-only">
              Keresés a szövegek között
            </label>
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <TextInput id="tr-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Keresés (szöveg vagy kulcs)…" className="pl-9" />
          </div>
          <div className="w-full sm:w-64">
            <label htmlFor="tr-group" className="sr-only">
              Csoport
            </label>
            <Select id="tr-group" value={group} onChange={(event) => setGroup(event.target.value)}>
              <option value="">Minden csoport</option>
              {Object.entries(groups).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <Toggle id="tr-only-missing" label="Csak a hiányzók" checked={onlyMissing} onChange={setOnlyMissing} />
        </div>

        <p className="text-sm text-muted" aria-live="polite">
          {visible.length} szöveg látszik a(z) {entries.length} közül.
        </p>

        <div role="table" aria-label="Fordítások" style={{ ["--tr-cols" as string]: columns }}>
          <div role="rowgroup" className="sticky top-16 z-10 hidden border-b-2 border-line bg-bg lg:block">
            <div role="row" className="grid gap-2 py-2 lg:grid-cols-[var(--tr-cols)]">
              <div role="columnheader" className="text-sm font-bold">
                Szöveg (magyarul) és kulcs
              </div>
              {locales.map((locale) => (
                <div role="columnheader" key={locale.code} className="flex items-center gap-1.5 text-sm font-bold">
                  <Flag code={locale.flag} />
                  {locale.name}
                </div>
              ))}
            </div>
          </div>
          <div role="rowgroup">
            {visible.map((entry) => (
              <TranslationRow key={entry.key} entry={entry} locales={locales} edits={edits[entry.key]} onEdit={onEdit} />
            ))}
          </div>
        </div>
        {visible.length === 0 && <p className="rounded-xl bg-surface p-4 text-center text-muted">Nincs találat.</p>}

        {changes.length > 0 && (
          <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-2xl bg-bg p-3 shadow-lg ring-1 ring-line">
            <span className="font-semibold text-amber-700 dark:text-amber-300">{changes.length} mentetlen változás</span>
            <Button onClick={save} disabled={saving}>
              {saving ? "Mentés…" : "Mentés"}
            </Button>
            <Button
              tone="secondary"
              disabled={saving}
              onClick={() => {
                if (window.confirm("Elveted az összes mentetlen változtatást?")) setEdits({});
              }}
            >
              Elvetés
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

/** Fordítások: nyelvek kezelése és a felület szövegeinek táblázata. */
export function TranslationsEditor({
  locales,
  entries,
  groups,
  showFlags,
}: {
  locales: LocaleRow[];
  entries: TranslationEntry[];
  groups: Record<string, string>;
  showFlags: boolean;
}) {
  const missingCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const locale of locales) {
      counts[locale.code] = entries.filter((e) => !(e.values[locale.code] ?? "").trim() && !(locale.code === SOURCE && e.builtinHu)).length;
    }
    return counts;
  }, [locales, entries]);

  return (
    <div className="space-y-8">
      <LocalesCard locales={locales} showFlags={showFlags} missingCount={missingCount} />
      <TranslationsTable entries={entries} locales={locales} groups={groups} />
    </div>
  );
}
