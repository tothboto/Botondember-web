"use client";

import { ArrowDown, ArrowUp, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveGeneralPage } from "@/app/actions/admin/settings";
import type { FooterSettings, GeneralSettings, ThemeMode } from "@/lib/settings";
import { IconButton } from "../CollectionEditor";
import { useToast } from "../Toast";
import { Button, Card, Field, Select, TextArea, TextInput, Toggle } from "../ui";
import { useUnsavedChanges } from "../useUnsavedChanges";

type GeneralValues = Omit<GeneralSettings, "faviconVersion">;

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "Automatikus (a látogató készüléke szerint)" },
  { value: "light", label: "Világos" },
  { value: "dark", label: "Sötét" },
];

const MAX_LINKS = 12;

/** Általános beállítások: az oldal neve, fejléc, alap téma, ragadós fejléc, keresők, lábléc. */
export function GeneralForm({ general, footer }: { general: GeneralValues; footer: FooterSettings }) {
  const router = useRouter();
  const toast = useToast();
  const initial = { general, footer };
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  useUnsavedChanges(dirty);

  const setGeneral = <K extends keyof GeneralValues>(key: K, value: GeneralValues[K]) =>
    setValues((v) => ({ ...v, general: { ...v.general, [key]: value } }));
  const setLinks = (update: (links: FooterSettings["links"]) => FooterSettings["links"]) =>
    setValues((v) => ({ ...v, footer: { ...v.footer, links: update(v.footer.links) } }));
  const moveLink = (index: number, delta: number) =>
    setLinks((links) => {
      const next = [...links];
      const target = index + delta;
      if (target < 0 || target >= next.length) return links;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const result = await saveGeneralPage(values);
    setSaving(false);
    if (result.ok) {
      setErrors({});
      toast.success("Mentve!");
      router.refresh();
    } else {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <Card title="Az oldal neve">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Az oldal neve"
            htmlFor="general-site-name"
            hint="A böngészőfülön, a keresőkben és a megosztásoknál jelenik meg."
            error={errors.siteName}
          >
            <TextInput
              id="general-site-name"
              value={values.general.siteName}
              maxLength={80}
              onChange={(event) => setGeneral("siteName", event.target.value)}
            />
          </Field>
          <Field
            label="A fejléc felirata"
            htmlFor="general-header-title"
            hint="A fejléc bal oldalán, a korona mellett – és a láblécben."
            error={errors.headerTitle}
          >
            <TextInput
              id="general-header-title"
              value={values.general.headerTitle}
              maxLength={80}
              onChange={(event) => setGeneral("headerTitle", event.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card title="Működés">
        <div className="space-y-6">
          <Field
            label="Alap téma (világos vagy sötét)"
            htmlFor="general-theme"
            hint="Ez csak a kiinduló állapot: a látogató a fejlécben bármikor átválthatja, és a böngészője megjegyzi."
          >
            <Select
              id="general-theme"
              value={values.general.defaultTheme}
              onChange={(event) => setGeneral("defaultTheme", event.target.value as ThemeMode)}
              className="md:max-w-md"
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Toggle
            id="general-sticky"
            label="Ragadós fejléc"
            description="Görgetéskor a fejléc a képernyő tetején marad (a kezdőlapon a kép fölött átlátszó)."
            checked={values.general.stickyHeader}
            onChange={(checked) => setGeneral("stickyHeader", checked)}
          />
          <Toggle
            id="general-noindex"
            label="Elrejtés a keresők elől (noindex)"
            description="Bekapcsolva a Google és a többi kereső nem veszi fel az oldalt a találatai közé. Amíg az oldal készül, hagyd bekapcsolva!"
            checked={values.general.noindex}
            onChange={(checked) => setGeneral("noindex", checked)}
          />
        </div>
      </Card>

      <Card
        title="Lábléc"
        description="Az adatkezelési és a cookie tájékoztató linkje mindig ott van a láblécben – ide további linkeket vehetsz fel."
      >
        <div className="space-y-6">
          <Field label="Lábléc szövege" htmlFor="footer-text" hint="Pl. „© 2026 Botondember”. Több sor is lehet." error={errors.text}>
            <TextArea
              id="footer-text"
              rows={2}
              maxLength={500}
              value={values.footer.text}
              onChange={(event) => setValues((v) => ({ ...v, footer: { ...v.footer, text: event.target.value } }))}
            />
          </Field>

          <fieldset className="space-y-3">
            <legend className="font-semibold">További linkek a láblécben ({values.footer.links.length}/{MAX_LINKS})</legend>
            {values.footer.links.length === 0 && <p className="text-sm text-muted">Még nincs további link.</p>}
            <ol className="space-y-3">
              {values.footer.links.map((link, index) => (
                <li key={index} className="grid gap-3 rounded-xl border border-line bg-surface p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] md:items-end">
                  <Field label="Link szövege" htmlFor={`footer-link-${index}-label`} error={errors[`links.${index}.label`]}>
                    <TextInput
                      id={`footer-link-${index}-label`}
                      value={link.label}
                      maxLength={60}
                      onChange={(event) =>
                        setLinks((links) => links.map((l, i) => (i === index ? { ...l, label: event.target.value } : l)))
                      }
                    />
                  </Field>
                  <Field label="Cím (URL)" htmlFor={`footer-link-${index}-url`} error={errors[`links.${index}.url`]}>
                    <TextInput
                      id={`footer-link-${index}-url`}
                      type="url"
                      inputMode="url"
                      placeholder="https://"
                      value={link.url}
                      onChange={(event) =>
                        setLinks((links) => links.map((l, i) => (i === index ? { ...l, url: event.target.value } : l)))
                      }
                    />
                  </Field>
                  <div className="flex gap-1">
                    <IconButton label={`Feljebb: ${link.label || "link"}`} disabled={index === 0} onClick={() => moveLink(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label={`Lejjebb: ${link.label || "link"}`}
                      disabled={index === values.footer.links.length - 1}
                      onClick={() => moveLink(index, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label={`Törlés: ${link.label || "link"}`}
                      tone="danger"
                      onClick={() => setLinks((links) => links.filter((_, i) => i !== index))}
                    >
                      <Trash className="h-4 w-4" />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ol>
            <Button
              tone="secondary"
              disabled={values.footer.links.length >= MAX_LINKS}
              onClick={() => setLinks((links) => [...links, { label: "", url: "" }])}
            >
              <Plus aria-hidden className="h-4 w-4" />
              Új link
            </Button>
          </fieldset>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || !dirty} className="px-6 py-3 text-lg">
          {saving ? "Mentés…" : "Mentés"}
        </Button>
        {dirty && <span className="font-semibold text-amber-700 dark:text-amber-300">Mentetlen változások</span>}
      </div>
    </form>
  );
}
