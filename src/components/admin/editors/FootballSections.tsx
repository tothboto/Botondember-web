"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { moveFootballSection, saveFootballSection, setFootballSectionVisible } from "@/app/actions/admin/football";
import type { FootballSection } from "@/db/schema";
import type { ActionResult } from "@/lib/admin/result";
import { IconButton } from "../CollectionEditor";
import { MarkdownEditor } from "../MarkdownEditor";
import { MediaField } from "../MediaField";
import { useMediaLibrary } from "../MediaLibrary";
import { useToast } from "../Toast";
import { Button, Card, Field, TextInput } from "../ui";
import { useUnsavedChanges } from "../useUnsavedChanges";

const LABELS: Record<string, { title: string; note: string }> = {
  hero: { title: "Hero (nagy nyitókép)", note: "Cím, alcím és a háttérkép (pl. a stadion)." },
  why: { title: "Miért a Real Madrid?", note: "A te szöveged – Markdown formázással." },
  players: { title: "Kedvenc játékosaim", note: "A játékosokat lent, a „Játékosok” listában szerkesztheted." },
  moments: { title: "Kedvenc pillanataim / trófeák", note: "Az idővonal elemeit lent, a „Pillanatok” listában szerkesztheted." },
  facts: { title: "Klub alapadatok", note: "Az adatokat lent, az „Alapadatok” listában szerkesztheted." },
  link: { title: "Link a hivatalos oldalra", note: "A gomb címe a Fordítások között módosítható." },
};

function SectionForm({ section, onDone }: { section: FootballSection; onDone: () => void }) {
  const toast = useToast();
  const library = useMediaLibrary();
  const initial = { title: section.title, bodyMd: section.bodyMd, mediaId: section.mediaId, link: section.link };
  const initialAlt = library.byId(section.mediaId)?.alt ?? "";
  const [values, setValues] = useState(initial);
  const [alt, setAlt] = useState(initialAlt);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(values) !== JSON.stringify(initial) || alt !== initialAlt;
  useUnsavedChanges(dirty);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const result: ActionResult = await saveFootballSection(
      section.id,
      { ...values, visible: section.visible },
      values.mediaId ? { [String(values.mediaId)]: alt } : undefined,
    );
    setSaving(false);
    if (result.ok) {
      if (values.mediaId) library.updateAlt(values.mediaId, alt.trim());
      toast.success("Mentve!");
      onDone();
    } else {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border-2 border-primary/50 bg-surface p-4" noValidate>
      {section.type === "hero" && (
        <>
          <Field label="Cím" htmlFor={`fs-${section.id}-title`} hint="Üresen a lap címe jelenik meg." error={errors.title}>
            <TextInput
              id={`fs-${section.id}-title`}
              value={values.title}
              maxLength={120}
              onChange={(event) => setValues((v) => ({ ...v, title: event.target.value }))}
            />
          </Field>
          <Field label="Alcím (arany betűvel)" htmlFor={`fs-${section.id}-sub`} error={errors.bodyMd}>
            <TextInput
              id={`fs-${section.id}-sub`}
              value={values.bodyMd}
              maxLength={200}
              onChange={(event) => setValues((v) => ({ ...v, bodyMd: event.target.value }))}
            />
          </Field>
          <MediaField
            id={`fs-${section.id}-image`}
            label="Háttérkép (pl. stadion) – a jogvédett képeket csak te töltheted fel"
            value={values.mediaId}
            alt={alt}
            onAltChange={setAlt}
            aspect="2 / 1"
            onChange={(mediaId, media) => {
              setValues((v) => ({ ...v, mediaId }));
              if (media) setAlt(media.alt);
            }}
          />
        </>
      )}
      {section.type === "why" && (
        <MarkdownEditor
          id={`fs-${section.id}-body`}
          label="Szöveg"
          value={values.bodyMd}
          rows={10}
          error={errors.bodyMd}
          onChange={(bodyMd) => setValues((v) => ({ ...v, bodyMd }))}
        />
      )}
      {section.type === "link" && (
        <Field label="A hivatalos oldal címe" htmlFor={`fs-${section.id}-link`} error={errors.link}>
          <TextInput
            id={`fs-${section.id}-link`}
            type="url"
            value={values.link}
            onChange={(event) => setValues((v) => ({ ...v, link: event.target.value }))}
          />
        </Field>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Mentés…" : "Mentés"}
        </Button>
        <Button
          tone="secondary"
          onClick={() => {
            if (!dirty || window.confirm("Elveted a mentetlen változtatásokat?")) onDone();
          }}
        >
          Mégse
        </Button>
      </div>
    </form>
  );
}

/** A Real Madrid oldal szekciói: sorrend, láthatóság, és a szövegek/képek szerkesztése. */
export function FootballSections({ sections }: { sections: FootballSection[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<number | null>(null);
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
    <Card title="Szekciók" description="A szekciók ebben a sorrendben jelennek meg. Bármelyik elrejthető.">
      <ol className="space-y-3">
        {sections.map((section, index) => {
          const label = LABELS[section.type] ?? { title: section.type, note: "" };
          const editable = section.type === "hero" || section.type === "why" || section.type === "link";
          return (
            <li key={section.id} className="space-y-3">
              <div className={`flex flex-wrap items-center gap-3 rounded-xl border border-line bg-bg p-3 ${section.visible ? "" : "opacity-70"}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {index + 1}. {label.title} {!section.visible && <span className="ml-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs">Rejtett</span>}
                  </p>
                  <p className="text-sm text-muted">{label.note}</p>
                </div>
                <div className="flex gap-1">
                  <IconButton label={`Feljebb: ${label.title}`} disabled={index === 0 || pending} onClick={() => run(() => moveFootballSection(section.id, "up"))}>
                    <ArrowUp className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label={`Lejjebb: ${label.title}`}
                    disabled={index === sections.length - 1 || pending}
                    onClick={() => run(() => moveFootballSection(section.id, "down"))}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label={`${section.visible ? "Elrejtés" : "Megjelenítés"}: ${label.title}`}
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => setFootballSectionVisible(section.id, !section.visible),
                        section.visible ? "Elrejtve" : "Megjelenítve",
                      )
                    }
                  >
                    {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </IconButton>
                  {editable && (
                    <IconButton
                      label={`Szerkesztés: ${label.title}`}
                      pressed={editing === section.id}
                      onClick={() => setEditing(editing === section.id ? null : section.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                  )}
                </div>
              </div>
              {editing === section.id && (
                <SectionForm
                  section={section}
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
    </Card>
  );
}
