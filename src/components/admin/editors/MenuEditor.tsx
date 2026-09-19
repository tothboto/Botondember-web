"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, FilePenLine, Plus, Settings2, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createGenericPage, deletePage, movePage, savePageMenu, setPageVisible } from "@/app/actions/admin/pages";
import { contentEditorHref, TEMPLATE_LABELS } from "@/lib/admin/page-editors";
import type { ActionResult } from "@/lib/admin/result";
import { slugify } from "@/lib/admin/slug";
import { DEFAULT_PAGE_ICON, PageIcon } from "@/lib/icons";
import { IconButton } from "../CollectionEditor";
import { IconPicker } from "../IconPicker";
import { useToast } from "../Toast";
import { Button, Card, Field, TextInput, Toggle } from "../ui";
import { useUnsavedChanges } from "../useUnsavedChanges";

export type MenuLabels = Record<string, { menu: string; title: string }>;

export type MenuPage = {
  id: number;
  key: string;
  slug: string;
  template: string;
  icon: string;
  visible: boolean;
  isCore: boolean;
  labels: MenuLabels;
};

export type MenuLocale = { code: string; name: string; flag: string; enabled: boolean };

function Flag({ code }: { code: string }) {
  // Dekoratív: a nyelv neve mellette szövegként is ott van.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/${code}.svg`} alt="" width={24} height={18} className="h-[18px] w-6 shrink-0 rounded-sm object-cover ring-1 ring-black/10" />;
}

function SlugInput({
  id,
  value,
  onChange,
  error,
  hint,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint: string;
}) {
  return (
    <Field label="URL-cím (a böngésző címsorában)" htmlFor={id} hint={hint} error={error}>
      <div className="flex items-stretch">
        <span className="grid place-items-center rounded-l-xl border border-r-0 border-line bg-surface-2 px-3 font-mono text-muted">/</span>
        <TextInput
          id={id}
          value={value}
          maxLength={60}
          spellCheck={false}
          autoCapitalize="off"
          onChange={(event) => onChange(event.target.value.toLowerCase().replace(/\s+/g, "-"))}
          className="rounded-l-none font-mono"
          aria-invalid={error ? true : undefined}
        />
      </div>
    </Field>
  );
}

/** Egy menüpont beállításai: nevek nyelvenként, URL-cím, ikon, láthatóság. */
function MenuItemForm({
  page,
  locales,
  onDone,
}: {
  page: MenuPage;
  locales: MenuLocale[];
  onDone: () => void;
}) {
  const toast = useToast();
  const initial = {
    icon: page.icon,
    slug: page.slug,
    visible: page.visible,
    labels: Object.fromEntries(
      locales.map((l) => [l.code, { menu: page.labels[l.code]?.menu ?? "", title: page.labels[l.code]?.title ?? "" }]),
    ) as MenuLabels,
  };
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  useUnsavedChanges(dirty);
  const hu = values.labels.hu ?? { menu: "", title: "" };

  const setLabel = (code: string, field: "menu" | "title", value: string) =>
    setValues((v) => ({ ...v, labels: { ...v.labels, [code]: { ...v.labels[code], [field]: value } } }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (values.slug !== page.slug && !window.confirm(`Megváltoztatod az URL-címet: /${page.slug} → /${values.slug}. A régi link ezután nem működik. Folytatod?`)) {
      return;
    }
    setSaving(true);
    const result = await savePageMenu(page.id, values);
    setSaving(false);
    if (result.ok) {
      toast.success("Mentve!");
      onDone();
    } else {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
    }
  };

  const cancel = () => {
    if (!dirty || window.confirm("Elveted a mentetlen változtatásokat?")) onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-6 rounded-2xl border-2 border-primary/50 bg-surface p-4 sm:p-5" noValidate>
      <fieldset className="space-y-3">
        <legend className="font-semibold">Menüpont neve és az oldal címe nyelvenként</legend>
        <p className="text-sm text-muted">
          A magyar kötelező. Ha egy másik nyelvnél üresen hagyod, ott is a magyar jelenik meg.
        </p>
        <div className="space-y-3">
          {locales.map((locale) => {
            const label = values.labels[locale.code] ?? { menu: "", title: "" };
            const isSource = locale.code === "hu";
            return (
              <div key={locale.code} className="grid gap-2 rounded-xl border border-line bg-bg p-3 md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1.4fr)] md:items-center">
                <div className="flex items-center gap-2 font-semibold">
                  <Flag code={locale.flag} />
                  <span>{locale.name}</span>
                  {!locale.enabled && <span className="text-xs font-normal text-muted">(kikapcsolva)</span>}
                </div>
                <div>
                  <label htmlFor={`menu-${page.id}-${locale.code}-menu`} className="text-sm text-muted">
                    Menüpont neve
                  </label>
                  <TextInput
                    id={`menu-${page.id}-${locale.code}-menu`}
                    lang={locale.code}
                    value={label.menu}
                    maxLength={40}
                    required={isSource}
                    placeholder={isSource ? "" : hu.menu}
                    onChange={(event) => setLabel(locale.code, "menu", event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor={`menu-${page.id}-${locale.code}-title`} className="text-sm text-muted">
                    Az oldal nagy címe
                  </label>
                  <TextInput
                    id={`menu-${page.id}-${locale.code}-title`}
                    lang={locale.code}
                    value={label.title}
                    maxLength={120}
                    required={isSource}
                    placeholder={isSource ? "" : hu.title}
                    onChange={(event) => setLabel(locale.code, "title", event.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      <SlugInput
        id={`menu-${page.id}-slug`}
        value={values.slug}
        error={errors.slug}
        onChange={(slug) => setValues((v) => ({ ...v, slug }))}
        hint="Ékezet nélküli kisbetű, szám és kötőjel (pl. kedvenc-filmjeim). Ha megváltoztatod, a régi link nem működik tovább."
      />

      <IconPicker name={`menu-${page.id}-icon`} value={values.icon} onChange={(icon) => setValues((v) => ({ ...v, icon }))} />

      <Toggle
        id={`menu-${page.id}-visible`}
        label="Megjelenik a menüben"
        description="Kikapcsolva az oldal el van rejtve: a menüben nem látszik, és a címe sem nyitható meg."
        checked={values.visible}
        onChange={(visible) => setValues((v) => ({ ...v, visible }))}
      />

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <Button type="submit" disabled={saving}>
          {saving ? "Mentés…" : "Mentés"}
        </Button>
        <Button tone="secondary" onClick={cancel} disabled={saving}>
          Mégse
        </Button>
        {dirty && <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Mentetlen változások</span>}
      </div>
    </form>
  );
}

/** Új aloldal az „Általános” sablonnal. */
function NewPageForm({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState({ title: "", menu: "", slug: "", icon: DEFAULT_PAGE_ICON });
  const [touched, setTouched] = useState({ menu: false, slug: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = values.title !== "" || values.menu !== "" || values.slug !== "";
  useUnsavedChanges(dirty);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const result = await createGenericPage(values);
    setSaving(false);
    if (result.ok) {
      toast.success("Kész az új aloldal! Most töltsd fel tartalommal.");
      setValues({ title: "", menu: "", slug: "", icon: DEFAULT_PAGE_ICON });
      router.push(`/admin/oldal/${result.data.id}`);
    } else {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border-2 border-primary/50 bg-surface p-4 sm:p-5" noValidate>
      <h3 className="font-display text-lg font-extrabold">Új aloldal</h3>
      <p className="text-sm text-muted">
        Az új oldal az „Általános” sablont kapja: cím, bevezető, kép, szöveg és kártyák. Létrehozás után azonnal szerkesztheted.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Az oldal címe" htmlFor="new-page-title" error={errors.title}>
          <TextInput
            id="new-page-title"
            value={values.title}
            maxLength={120}
            placeholder="pl. Kedvenc filmjeim"
            onChange={(event) => {
              const title = event.target.value;
              setValues((v) => ({
                ...v,
                title,
                menu: touched.menu ? v.menu : title.slice(0, 40),
                slug: touched.slug ? v.slug : slugify(title),
              }));
            }}
          />
        </Field>
        <Field label="Menüpont neve (rövid)" htmlFor="new-page-menu" error={errors.menu}>
          <TextInput
            id="new-page-menu"
            value={values.menu}
            maxLength={40}
            onChange={(event) => {
              setTouched((t) => ({ ...t, menu: true }));
              setValues((v) => ({ ...v, menu: event.target.value }));
            }}
          />
        </Field>
      </div>
      <SlugInput
        id="new-page-slug"
        value={values.slug}
        error={errors.slug}
        onChange={(slug) => {
          setTouched((t) => ({ ...t, slug: true }));
          setValues((v) => ({ ...v, slug }));
        }}
        hint="A címből automatikusan készül – ha kell, átírhatod."
      />
      <IconPicker name="new-page-icon" value={values.icon} onChange={(icon) => setValues((v) => ({ ...v, icon }))} />
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button type="submit" disabled={saving}>
          <Plus aria-hidden className="h-5 w-5" />
          {saving ? "Létrehozás…" : "Aloldal létrehozása"}
        </Button>
        <Button
          tone="secondary"
          disabled={saving}
          onClick={() => {
            if (!dirty || window.confirm("Elveted az új aloldalt?")) onCancel();
          }}
        >
          Mégse
        </Button>
      </div>
    </form>
  );
}

/** Menü és aloldalak: sorrend, láthatóság, ikon, URL-cím, nevek; új oldal; törlés. */
export function MenuEditor({ pages, locales }: { pages: MenuPage[]; locales: MenuLocale[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult>, success?: string) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        if (success) toast.success(success);
        router.refresh();
      } else toast.error(result.error);
    });

  return (
    <Card
      title="Menüpontok"
      description="A menü ebben a sorrendben jelenik meg (a Kezdőlap mindig az első, a logóra kattintva érhető el)."
      actions={
        <Button onClick={() => setEditing("new")} disabled={editing === "new"}>
          <Plus aria-hidden className="h-5 w-5" />
          Új aloldal
        </Button>
      }
    >
      <div className="space-y-3" aria-busy={pending || undefined}>
        {editing === "new" && <NewPageForm onCancel={() => setEditing(null)} />}
        <ol className="space-y-3">
          {pages.map((page, index) => {
            const name = page.labels.hu?.menu || page.slug;
            return (
              <li key={page.id} className="space-y-3">
                <div className={`flex flex-wrap items-center gap-3 rounded-xl border border-line bg-bg p-3 ${page.visible ? "" : "opacity-70"}`}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg">
                    <PageIcon name={page.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      {name}
                      {!page.visible && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs">Rejtett</span>}
                    </p>
                    <p className="truncate text-sm text-muted">
                      <Link href={`/${page.slug}`} target="_blank" className="font-mono text-link underline-offset-2 hover:underline">
                        /{page.slug}
                        <span className="sr-only"> (új lapon nyílik meg)</span>
                      </Link>
                      {" · "}
                      {TEMPLATE_LABELS[page.template] ?? page.template}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <IconButton label={`Feljebb: ${name}`} disabled={index === 0 || pending} onClick={() => run(() => movePage(page.id, "up"))}>
                      <ArrowUp className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label={`Lejjebb: ${name}`}
                      disabled={index === pages.length - 1 || pending}
                      onClick={() => run(() => movePage(page.id, "down"))}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label={`${page.visible ? "Elrejtés" : "Megjelenítés"}: ${name}`}
                      disabled={pending}
                      onClick={() => run(() => setPageVisible(page.id, !page.visible), page.visible ? "Elrejtve a menüből" : "Megjelenítve a menüben")}
                    >
                      {page.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </IconButton>
                    <IconButton
                      label={`Menüpont beállításai: ${name}`}
                      pressed={editing === page.id}
                      onClick={() => setEditing(editing === page.id ? null : page.id)}
                    >
                      <Settings2 className="h-4 w-4" />
                    </IconButton>
                    <Link
                      href={contentEditorHref(page)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-bold hover:bg-surface-2"
                    >
                      <FilePenLine aria-hidden className="h-4 w-4" />
                      Tartalom<span className="sr-only">: {name}</span>
                    </Link>
                    {!page.isCore && (
                      <IconButton
                        label={`Törlés: ${name}`}
                        tone="danger"
                        disabled={pending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Biztosan törlöd a(z) „${name}” aloldalt a teljes tartalmával (kártyák, szövegek) együtt? Ez nem vonható vissza.`,
                            )
                          ) {
                            run(() => deletePage(page.id), "Aloldal törölve");
                          }
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </IconButton>
                    )}
                  </div>
                </div>
                {editing === page.id && (
                  <MenuItemForm
                    page={page}
                    locales={locales}
                    onDone={() => {
                      setEditing(null);
                      router.refresh();
                    }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}
