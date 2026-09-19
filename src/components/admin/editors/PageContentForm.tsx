"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { savePageContent } from "@/app/actions/admin/pages";
import { MarkdownEditor } from "../MarkdownEditor";
import { MediaField } from "../MediaField";
import { useMediaLibrary } from "../MediaLibrary";
import { useToast } from "../Toast";
import { Button, Card, Field, TextArea } from "../ui";
import { useUnsavedChanges } from "../useUnsavedChanges";

export type PageContent = {
  id: number;
  introMd: string;
  bodyMd: string;
  seoDescription: string;
  heroMediaId: number | null;
};

/** Egy aloldal tartalma: bevezető, (opcionálisan) kép és fő szöveg, keresőknek szóló leírás. */
export function PageContentForm({
  page,
  title = "Az oldal tetején",
  showHero = false,
  showBody = false,
  heroLabel = "Kép az oldal tetején (és a megosztásnál)",
}: {
  page: PageContent;
  title?: string;
  showHero?: boolean;
  showBody?: boolean;
  heroLabel?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const library = useMediaLibrary();
  const initial = page;
  const [values, setValues] = useState(initial);
  const initialAlt = library.byId(initial.heroMediaId)?.alt ?? "";
  const [alt, setAlt] = useState(initialAlt);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial) || alt !== initialAlt;
  useUnsavedChanges(dirty);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const result = await savePageContent(
      page.id,
      { introMd: values.introMd, bodyMd: values.bodyMd, seoDescription: values.seoDescription, heroMediaId: values.heroMediaId },
      values.heroMediaId ? { [String(values.heroMediaId)]: alt } : undefined,
    );
    setSaving(false);
    if (result.ok) {
      if (values.heroMediaId) library.updateAlt(values.heroMediaId, alt.trim());
      toast.success("Mentve!");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Card title={title}>
      <form onSubmit={submit} className="space-y-5">
        <MarkdownEditor
          id={`page-${page.id}-intro`}
          label="Bevezető (a nagy cím alatt)"
          value={values.introMd}
          rows={4}
          onChange={(introMd) => setValues((v) => ({ ...v, introMd }))}
          hint="Rövid, egy-két mondatos bemutatkozás. Markdown formázás is használható."
        />
        {showHero && (
          <MediaField
            id={`page-${page.id}-hero`}
            label={heroLabel}
            value={values.heroMediaId}
            alt={alt}
            onAltChange={setAlt}
            aspect="16 / 7"
            onChange={(heroMediaId, media) => {
              setValues((v) => ({ ...v, heroMediaId }));
              if (media) setAlt(media.alt);
            }}
          />
        )}
        {showBody && (
          <MarkdownEditor
            id={`page-${page.id}-body`}
            label="Fő szöveg"
            value={values.bodyMd}
            rows={12}
            onChange={(bodyMd) => setValues((v) => ({ ...v, bodyMd }))}
          />
        )}
        <Field
          label="Rövid leírás a keresőknek és a megosztáshoz"
          htmlFor={`page-${page.id}-seo`}
          hint="1–2 mondat. Ez jelenik meg pl. a Google találatokban (ha az oldal nincs elrejtve a keresők elől)."
        >
          <TextArea
            id={`page-${page.id}-seo`}
            rows={2}
            maxLength={300}
            value={values.seoDescription}
            onChange={(event) => setValues((v) => ({ ...v, seoDescription: event.target.value }))}
          />
        </Field>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving || !dirty}>
            {saving ? "Mentés…" : "Mentés"}
          </Button>
          {dirty && <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Mentetlen változások</span>}
        </div>
      </form>
    </Card>
  );
}
