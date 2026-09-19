"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Star, Trash } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import {
  deleteCollectionItem,
  moveCollectionItem,
  saveCollectionItem,
  setCollectionItemVisible,
} from "@/app/actions/admin/collections";
import type { ActionResult } from "@/lib/admin/result";
import type { CollectionKey } from "@/lib/admin/schemas";
import { MediaField } from "./MediaField";
import { useMediaLibrary } from "./MediaLibrary";
import { useToast } from "./Toast";
import { Button, Card, Field, Select, TextArea, TextInput, Toggle } from "./ui";
import { useUnsavedChanges } from "./useUnsavedChanges";

export type FormValues = Record<string, unknown>;

export type FormContext = {
  values: FormValues;
  set: (name: string, value: unknown) => void;
  setMany: (patch: FormValues) => void;
  alts: Record<string, string>;
  setAlt: (field: string, alt: string) => void;
  errors: Record<string, string>;
};

export type FieldDef =
  | {
      type: "text" | "url" | "textarea";
      name: string;
      label: string;
      hint?: string;
      placeholder?: string;
      maxLength?: number;
      rows?: number;
    }
  | { type: "number"; name: string; label: string; hint?: string; min?: number; max?: number; nullable?: boolean }
  | { type: "select"; name: string; label: string; hint?: string; options: { value: string; label: string }[] }
  | { type: "toggle"; name: string; label: string; description?: string }
  | { type: "image"; name: string; label: string; hint?: string; aspect?: string }
  | { type: "rating"; name: string; label: string }
  | { type: "checkboxes"; name: string; label: string; options: { value: string; label: string }[] }
  | { type: "custom"; name: string; render: (ctx: FormContext) => ReactNode };

type Item = FormValues & { id: number };

const RATING_OPTIONS = [
  { value: "0", label: "Nincs értékelés" },
  { value: "1", label: "★☆☆☆☆  1 csillag" },
  { value: "2", label: "★★☆☆☆  2 csillag" },
  { value: "3", label: "★★★☆☆  3 csillag" },
  { value: "4", label: "★★★★☆  4 csillag" },
  { value: "5", label: "★★★★★  5 csillag" },
];

function FieldRenderer({ field, ctx, idPrefix }: { field: FieldDef; ctx: FormContext; idPrefix: string }) {
  const id = `${idPrefix}-${field.name}`;
  const error = ctx.errors[field.name];
  const value = ctx.values[field.name];

  switch (field.type) {
    case "custom":
      return <>{field.render(ctx)}</>;
    case "toggle":
      return (
        <Toggle
          id={id}
          label={field.label}
          description={field.description}
          checked={value === true}
          onChange={(checked) => ctx.set(field.name, checked)}
        />
      );
    case "image":
      return (
        <div>
          <MediaField
            id={id}
            label={field.label}
            value={(value as number | null) ?? null}
            aspect={field.aspect}
            hint={field.hint}
            alt={ctx.alts[field.name] ?? ""}
            onAltChange={(alt) => ctx.setAlt(field.name, alt)}
            onChange={(mediaId, media) => {
              ctx.set(field.name, mediaId);
              if (media) ctx.setAlt(field.name, media.alt);
            }}
          />
          {error && <p className="mt-1 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>}
        </div>
      );
    case "rating":
      return (
        <Field label={field.label} htmlFor={id} error={error}>
          <Select id={id} value={String(value ?? 0)} onChange={(event) => ctx.set(field.name, Number(event.target.value))}>
            {RATING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      );
    case "select":
      return (
        <Field label={field.label} htmlFor={id} hint={field.hint} error={error}>
          <Select id={id} value={String(value ?? "")} onChange={(event) => ctx.set(field.name, event.target.value)}>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      );
    case "checkboxes": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <fieldset className="space-y-2">
          <legend className="font-semibold">{field.label}</legend>
          <div className="flex flex-wrap gap-2">
            {field.options.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 font-semibold ${
                    checked ? "border-primary bg-primary/10" : "border-line"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      ctx.set(
                        field.name,
                        event.target.checked ? [...selected, option.value] : selected.filter((v) => v !== option.value),
                      )
                    }
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
          {error && <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>}
        </fieldset>
      );
    }
    case "number":
      return (
        <Field label={field.label} htmlFor={id} hint={field.hint} error={error}>
          <TextInput
            id={id}
            type="number"
            inputMode="numeric"
            min={field.min}
            max={field.max}
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(event) => {
              const raw = event.target.value;
              ctx.set(field.name, raw === "" ? (field.nullable ? null : 0) : Number(raw));
            }}
          />
        </Field>
      );
    case "textarea":
      return (
        <Field label={field.label} htmlFor={id} hint={field.hint} error={error}>
          <TextArea
            id={id}
            rows={field.rows ?? 3}
            maxLength={field.maxLength}
            placeholder={field.placeholder}
            value={String(value ?? "")}
            onChange={(event) => ctx.set(field.name, event.target.value)}
          />
        </Field>
      );
    default:
      return (
        <Field label={field.label} htmlFor={id} hint={field.hint} error={error}>
          <TextInput
            id={id}
            type={field.type === "url" ? "url" : "text"}
            inputMode={field.type === "url" ? "url" : undefined}
            maxLength={field.maxLength}
            placeholder={field.placeholder ?? (field.type === "url" ? "https://" : undefined)}
            value={String(value ?? "")}
            onChange={(event) => ctx.set(field.name, event.target.value)}
          />
        </Field>
      );
  }
}

/** Egy elem űrlapja (új vagy meglévő). */
export function ItemForm({
  idPrefix,
  initial,
  fields,
  onCancel,
  onSave,
  title,
}: {
  idPrefix: string;
  initial: FormValues;
  fields: FieldDef[];
  onCancel: () => void;
  onSave: (values: FormValues, alts: Record<string, string>) => Promise<ActionResult<unknown>>;
  title: string;
}) {
  const library = useMediaLibrary();
  const toast = useToast();
  const imageFields = fields.filter((f) => f.type === "image").map((f) => f.name);
  const initialAlts = Object.fromEntries(
    imageFields.map((name) => [name, library.byId(initial[name] as number | null)?.alt ?? ""]),
  );
  const [values, setValues] = useState<FormValues>(initial);
  const [alts, setAlts] = useState<Record<string, string>>(initialAlts);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(values) !== JSON.stringify(initial) || JSON.stringify(alts) !== JSON.stringify(initialAlts);
  useUnsavedChanges(dirty);

  const ctx: FormContext = {
    values,
    set: (name, value) => setValues((current) => ({ ...current, [name]: value })),
    setMany: (patch) => setValues((current) => ({ ...current, ...patch })),
    alts,
    setAlt: (field, alt) => setAlts((current) => ({ ...current, [field]: alt })),
    errors,
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const altMap: Record<string, string> = {};
    for (const name of imageFields) {
      const mediaId = values[name];
      if (typeof mediaId === "number") altMap[String(mediaId)] = alts[name] ?? "";
    }
    const result = await onSave(values, altMap);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
    }
  };

  const cancel = () => {
    if (dirty && !window.confirm("Elveted a mentetlen változtatásokat?")) return;
    onCancel();
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border-2 border-primary/50 bg-surface p-4 sm:p-5" noValidate>
      <h3 className="font-display text-lg font-extrabold">{title}</h3>
      {fields.map((field) => (
        <FieldRenderer key={field.name} field={field} ctx={ctx} idPrefix={idPrefix} />
      ))}
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

/**
 * Lista-szerkesztő: új elem, szerkesztés, sorrend (fel/le), láthatóság, törlés.
 * Minden mentés után a lista a szerverről frissül.
 */
export function CollectionEditor({
  collection,
  heading,
  description,
  items,
  fields,
  emptyItem,
  itemTitle,
  itemSubtitle,
  imageField,
  imageAspect = "4 / 3",
  addLabel,
  extraPayload,
  badges,
  emptyText = "Még nincs egy elem sem. Kattints a „+” gombra az első hozzáadásához!",
}: {
  collection: CollectionKey;
  heading: string;
  description?: ReactNode;
  items: Item[];
  fields: FieldDef[];
  emptyItem: FormValues;
  itemTitle: (item: FormValues) => string;
  itemSubtitle?: (item: FormValues) => string;
  imageField?: string;
  imageAspect?: string;
  addLabel: string;
  extraPayload?: FormValues;
  badges?: (item: FormValues) => string[];
  emptyText?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const library = useMediaLibrary();
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [pending, startTransition] = useTransition();

  const keys = Object.keys(emptyItem);
  const payloadOf = (values: FormValues) => ({
    ...Object.fromEntries(keys.map((key) => [key, values[key]])),
    ...extraPayload,
  });

  const run = (action: () => Promise<ActionResult<unknown>>, success?: string) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        if (success) toast.success(success);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  const save = (id: number | null) => async (values: FormValues, alts: Record<string, string>) => {
    const result = await saveCollectionItem(collection, id, payloadOf(values), alts);
    if (result.ok) {
      for (const [mediaId, alt] of Object.entries(alts)) library.updateAlt(Number(mediaId), alt);
      toast.success("Mentve!");
      setEditing(null);
      router.refresh();
    }
    return result;
  };

  const renderForm = (id: number | null, initial: FormValues, title: string) => (
    <ItemForm
      key={id ?? "new"}
      idPrefix={`${collection}-${id ?? "new"}`}
      initial={initial}
      fields={fields}
      title={title}
      onCancel={() => setEditing(null)}
      onSave={save(id)}
    />
  );

  return (
    <Card
      title={heading}
      description={description}
      actions={
        <Button onClick={() => setEditing("new")} disabled={editing === "new"}>
          <Plus aria-hidden className="h-5 w-5" />
          {addLabel}
        </Button>
      }
    >
      <div className="space-y-3" aria-busy={pending || undefined}>
        {editing === "new" && renderForm(null, { ...emptyItem }, addLabel)}
        {items.length === 0 && editing !== "new" && <p className="rounded-xl bg-surface p-4 text-muted">{emptyText}</p>}
        <ol className="space-y-3">
          {items.map((item, index) => {
            const title = itemTitle(item) || "(névtelen)";
            const subtitle = itemSubtitle?.(item);
            const thumb = imageField ? library.byId(item[imageField] as number | null) : undefined;
            const hidden = item.visible === false;
            const labels = [...(badges?.(item) ?? [])];
            return (
              <li key={item.id} className="space-y-3">
                <div className={`flex flex-wrap items-center gap-3 rounded-xl border border-line bg-bg p-3 ${hidden ? "opacity-70" : ""}`}>
                  {imageField && (
                    <div
                      className="relative w-20 shrink-0 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-line"
                      style={{ aspectRatio: imageAspect }}
                    >
                      {thumb && <Image src={thumb.src} alt="" fill sizes="80px" className="object-cover" />}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{title}</p>
                    {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {hidden && (
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold">Rejtett</span>
                      )}
                      {item.isExample === true && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                          Példa
                        </span>
                      )}
                      {labels.map((label) => (
                        <span key={label} className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold">
                          <Star aria-hidden className="h-3 w-3" />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <IconButton
                      label={`Feljebb: ${title}`}
                      disabled={index === 0 || pending}
                      onClick={() => run(() => moveCollectionItem(collection, item.id, "up"))}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label={`Lejjebb: ${title}`}
                      disabled={index === items.length - 1 || pending}
                      onClick={() => run(() => moveCollectionItem(collection, item.id, "down"))}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label={`${hidden ? "Megjelenítés" : "Elrejtés"}: ${title}`}
                      disabled={pending}
                      onClick={() =>
                        run(
                          () => setCollectionItemVisible(collection, item.id, hidden),
                          hidden ? "Megjelenítve az oldalon" : "Elrejtve az oldalról",
                        )
                      }
                    >
                      {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </IconButton>
                    <IconButton
                      label={`Szerkesztés: ${title}`}
                      onClick={() => setEditing(editing === item.id ? null : item.id)}
                      pressed={editing === item.id}
                    >
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label={`Törlés: ${title}`}
                      tone="danger"
                      disabled={pending}
                      onClick={() => {
                        if (window.confirm(`Biztosan törlöd: „${title}”? Ez nem vonható vissza.`)) {
                          run(() => deleteCollectionItem(collection, item.id), "Törölve");
                        }
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
                {editing === item.id && renderForm(item.id, { ...emptyItem, ...item }, `Szerkesztés: ${title}`)}
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}

export function IconButton({
  label,
  onClick,
  disabled,
  children,
  tone = "default",
  pressed,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  tone?: "default" | "danger";
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={`grid h-10 w-10 place-items-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "danger"
          ? "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
          : pressed
            ? "border-primary bg-primary text-primary-fg"
            : "border-line hover:bg-surface-2"
      }`}
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}
