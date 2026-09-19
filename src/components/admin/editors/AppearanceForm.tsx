"use client";

import { CircleAlert, CircleCheck, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type FormEvent } from "react";
import { savePageAccents } from "@/app/actions/admin/pages";
import { saveAppearance } from "@/app/actions/admin/settings";
import { contrastLevel, contrastRatio } from "@/lib/color";
import { FONT_OPTIONS, fontCssVar, type FontKey } from "@/lib/font-options";
import { PageIcon } from "@/lib/icons";
import {
  BRAND_COLOR_DEFAULTS,
  resolveBrandColors,
  type AppearanceSettings,
  type BrandColorKey,
} from "@/lib/settings";
import { ColorField } from "../ColorField";
import { useToast } from "../Toast";
import { Button, Card, Field, Select } from "../ui";
import { useUnsavedChanges } from "../useUnsavedChanges";

export type AccentPage = { id: number; name: string; icon: string; template: string; accentColor: string | null };

const COLOR_LABELS: Record<BrandColorKey, { label: string; description: string }> = {
  white: { label: "Fehér", description: "A világos háttér színe." },
  blue: { label: "Királykék", description: "Gombok és linkek világos módban." },
  gold: { label: "Arany", description: "Kiemelések; sötét módban a gombok színe." },
  navy: { label: "Sötétkék", description: "A szöveg, a lábléc és a sötét mód háttere." },
  purple: { label: "Lila", description: "Ritkán használt kiegészítő szín." },
};

const FONT_ROLES: { key: keyof AppearanceSettings["fonts"]; label: string; hint: string }[] = [
  { key: "body", label: "Törzsszöveg", hint: "A bekezdések, leírások betűje – legyen jól olvasható!" },
  { key: "heading", label: "Címek", hint: "Az oldalak nagy címei és a kártyák címei." },
  { key: "title", label: "Fejléc felirat", hint: "Az oldal neve a fejlécben és a láblécben." },
];

const SAMPLE = "Árvíztűrő tükörfúrógép – ŐŰ őű 2026";

/** A sablonok saját akcentusszíne (ha az Adminban nincs felülírva). */
function templateAccent(template: string, gold: string): string {
  if (template === "games") return "#00A8FF";
  if (template === "youtube") return "#FF0000";
  return gold;
}

function ContrastRow({ label, fg, bg, min }: { label: string; fg: string; bg: string; min: number }) {
  const ratio = contrastRatio(fg, bg);
  const ok = ratio >= min;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line p-3">
      <span
        aria-hidden
        className="grid h-10 w-14 shrink-0 place-items-center rounded-lg text-sm font-black ring-1 ring-black/10"
        style={{ color: fg, background: bg }}
      >
        Aa
      </span>
      <span className="min-w-0 flex-1 text-sm">
        <span className="block font-semibold">{label}</span>
        <span className="text-muted">
          Kontraszt: {ratio.toFixed(1).replace(".", ",")} : 1 (legalább {String(min).replace(".", ",")} kell)
        </span>
      </span>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
          ok
            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
            : "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100"
        }`}
      >
        {ok ? <CircleCheck aria-hidden className="h-4 w-4" /> : <CircleAlert aria-hidden className="h-4 w-4" />}
        {ok ? contrastLevel(ratio) : "Gyenge"}
      </span>
    </li>
  );
}

/** Megjelenés: márkaszínek (kontraszt-ellenőrzéssel), betűtípusok, aloldalak akcentusszíne. */
export function AppearanceForm({ appearance, pages }: { appearance: AppearanceSettings; pages: AccentPage[] }) {
  const router = useRouter();
  const toast = useToast();
  const initialAccents = Object.fromEntries(pages.map((p) => [String(p.id), p.accentColor])) as Record<string, string | null>;
  const [values, setValues] = useState(appearance);
  const [accents, setAccents] = useState(initialAccents);
  const [saving, setSaving] = useState(false);
  const appearanceDirty = JSON.stringify(values) !== JSON.stringify(appearance);
  const accentsDirty = JSON.stringify(accents) !== JSON.stringify(initialAccents);
  const dirty = appearanceDirty || accentsDirty;
  useUnsavedChanges(dirty);

  const colors = resolveBrandColors(values);
  const anyColorChanged = Object.values(values.colors).some((c) => c !== null);

  const setColor = (key: BrandColorKey, value: string | null) =>
    setValues((v) => ({ ...v, colors: { ...v.colors, [key]: value } }));
  const setFont = (role: keyof AppearanceSettings["fonts"], font: FontKey) =>
    setValues((v) => ({ ...v, fonts: { ...v.fonts, [role]: font } }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const results = await Promise.all([
      appearanceDirty ? saveAppearance(values) : null,
      accentsDirty ? savePageAccents(accents) : null,
    ]);
    setSaving(false);
    const failed = results.find((r) => r && !r.ok);
    if (failed && !failed.ok) {
      toast.error(failed.error);
      return;
    }
    toast.success("Mentve! Az új színek és betűk már az egész oldalon látszanak.");
    router.refresh();
  };

  const previewStyle = {
    "--p-white": colors.white,
    "--p-blue": colors.blue,
    "--p-gold": colors.gold,
    "--p-navy": colors.navy,
    fontFamily: `var(${fontCssVar(values.fonts.body)})`,
  } as CSSProperties;
  const headingFont = { fontFamily: `var(${fontCssVar(values.fonts.heading)})` };
  const titleFont = { fontFamily: `var(${fontCssVar(values.fonts.title)})` };

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card
          title="Márkaszínek"
          description="A Real Madrid színei. Ha megváltoztatod, az egész oldal (gombok, linkek, fejléc, lábléc) átszíneződik."
          actions={
            <Button
              tone="secondary"
              disabled={!anyColorChanged}
              onClick={() => setValues((v) => ({ ...v, colors: { white: null, blue: null, gold: null, navy: null, purple: null } }))}
            >
              <RotateCcw aria-hidden className="h-4 w-4" />
              Összes alaphelyzetbe
            </Button>
          }
        >
          <div className="space-y-3">
            {(Object.keys(COLOR_LABELS) as BrandColorKey[]).map((key) => (
              <ColorField
                key={key}
                id={`color-${key}`}
                label={COLOR_LABELS[key].label}
                description={COLOR_LABELS[key].description}
                value={values.colors[key]}
                defaultValue={BRAND_COLOR_DEFAULTS[key]}
                onChange={(value) => setColor(key, value)}
              />
            ))}
          </div>
        </Card>

        <div className="space-y-8">
          <Card title="Előnézet">
            <div style={previewStyle} className="grid gap-4 sm:grid-cols-2">
              {/* Világos mód */}
              <div className="overflow-hidden rounded-xl ring-1 ring-line" style={{ background: "var(--p-white)", color: "var(--p-navy)" }}>
                <div className="flex items-center gap-2 px-3 py-2" style={{ background: "var(--p-blue)" }}>
                  <span className="text-sm font-bold" style={{ ...titleFont, color: "var(--p-gold)" }}>
                    Botondember
                  </span>
                </div>
                <div className="space-y-2 p-3">
                  <p className="text-lg leading-tight font-black" style={headingFont}>
                    Világos mód
                  </p>
                  <p className="text-sm">Így néz ki a szöveg, és egy <span className="font-semibold underline" style={{ color: "var(--p-blue)" }}>link</span>.</p>
                  <span className="inline-block rounded-lg px-3 py-1.5 text-sm font-bold" style={{ background: "var(--p-blue)", color: "#FFFFFF" }}>
                    Gomb
                  </span>
                </div>
              </div>
              {/* Sötét mód */}
              <div className="overflow-hidden rounded-xl ring-1 ring-line" style={{ background: "var(--p-navy)", color: "#EEF2F8" }}>
                <div className="flex items-center gap-2 px-3 py-2" style={{ background: "color-mix(in oklab, var(--p-navy) 80%, black)" }}>
                  <span className="text-sm font-bold" style={{ ...titleFont, color: "var(--p-gold)" }}>
                    Botondember
                  </span>
                </div>
                <div className="space-y-2 p-3">
                  <p className="text-lg leading-tight font-black" style={headingFont}>
                    Sötét mód
                  </p>
                  <p className="text-sm">Így néz ki a szöveg, és egy <span className="font-semibold underline" style={{ color: "var(--p-gold)" }}>kiemelés</span>.</p>
                  <span className="inline-block rounded-lg px-3 py-1.5 text-sm font-bold" style={{ background: "var(--p-gold)", color: "var(--p-navy)" }}>
                    Gomb
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Olvashatóság (kontraszt)"
            description="A szöveg és a háttér között elég nagy különbség kell, hogy mindenki könnyen el tudja olvasni (WCAG AA szint)."
          >
            <ul className="space-y-2">
              <ContrastRow label="Szöveg a világos háttéren" fg={colors.navy} bg={colors.white} min={4.5} />
              <ContrastRow label="Link a világos háttéren" fg={colors.blue} bg={colors.white} min={4.5} />
              <ContrastRow label="Gomb felirata (világos mód)" fg="#FFFFFF" bg={colors.blue} min={4.5} />
              <ContrastRow label="Szöveg a sötét háttéren" fg="#EEF2F8" bg={colors.navy} min={4.5} />
              <ContrastRow label="Gomb felirata (sötét mód)" fg={colors.navy} bg={colors.gold} min={4.5} />
              <ContrastRow label="Arany kiemelés a sötét háttéren" fg={colors.gold} bg={colors.navy} min={3} />
            </ul>
          </Card>
        </div>
      </div>

      <Card
        title="Betűtípusok"
        description="Mindegyik betű ismeri a magyar ékezeteket (ő, ű is). A betűket az oldal maga szolgálja ki, a látogató gépe nem kapcsolódik a Google-höz."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {FONT_ROLES.map((role) => {
            const font = values.fonts[role.key];
            const note = FONT_OPTIONS.find((option) => option.key === font)?.note;
            return (
              <div key={role.key} className="space-y-3">
                <Field label={role.label} htmlFor={`font-${role.key}`} hint={role.hint}>
                  <Select id={`font-${role.key}`} value={font} onChange={(event) => setFont(role.key, event.target.value as FontKey)}>
                    {FONT_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <figure className="rounded-xl border border-line bg-surface p-3">
                  <p
                    lang="hu"
                    className="text-xl leading-snug"
                    style={{ fontFamily: `var(${fontCssVar(font)})`, fontWeight: role.key === "body" ? 400 : 800 }}
                  >
                    {SAMPLE}
                  </p>
                  {note && <figcaption className="mt-2 text-sm text-muted">{note}</figcaption>}
                </figure>
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        title="Az aloldalak kiemelő színe"
        description="Aloldalanként megváltoztathatod a díszítő sávok, címkék és kiemelések színét. Az „Alaphelyzet” a sablon saját színét adja vissza."
      >
        <ul className="grid gap-3 lg:grid-cols-2">
          {pages.map((page) => (
            <li key={page.id} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2">
                <PageIcon name={page.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <ColorField
                  id={`accent-${page.id}`}
                  label={page.name}
                  value={accents[String(page.id)] ?? null}
                  defaultValue={templateAccent(page.template, colors.gold)}
                  onChange={(value) => setAccents((a) => ({ ...a, [String(page.id)]: value }))}
                />
              </div>
            </li>
          ))}
        </ul>
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
