"use client";

import { ExternalLink, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveLegalDoc, saveLegalSettings } from "@/app/actions/admin/settings";
import { formatDateTime } from "@/lib/format";
import { fillLegalTokens } from "@/lib/legal";
import type { LegalSettings } from "@/lib/settings";
import { MarkdownEditor } from "../MarkdownEditor";
import { useToast } from "../Toast";
import { Button, Card, Field, TextInput } from "../ui";
import { useUnsavedChanges } from "../useUnsavedChanges";

export type LegalDocState = { slug: "privacy" | "cookie"; bodyMd: string; updatedAt: number | null };

const DOCS: Record<LegalDocState["slug"], { title: string; href: string }> = {
  privacy: { title: "Adatkezelési tájékoztató", href: "/adatkezelesi-tajekoztato" },
  cookie: { title: "Cookie (süti) tájékoztató", href: "/cookie-tajekoztato" },
};

const TOKENS: { token: string; meaning: string }[] = [
  { token: "{{OLDAL_NEVE}}", meaning: "az oldal neve (Általános menü)" },
  { token: "{{ADATKEZELO_NEV}}", meaning: "az adatkezelő neve" },
  { token: "{{ADATKEZELO_EMAIL}}", meaning: "az adatkezelő e-mail-címe (kattintható link lesz)" },
  { token: "{{TARHELYSZOLGALTATO}}", meaning: "a tárhelyszolgáltató" },
  { token: "{{HATALYBALEPES}}", meaning: "a hatálybalépés dátuma" },
];

function ControllerForm({
  values,
  onChange,
  initial,
}: {
  values: LegalSettings;
  onChange: (values: LegalSettings) => void;
  initial: LegalSettings;
}) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  useUnsavedChanges(dirty);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const result = await saveLegalSettings(values);
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
    <Card
      title="Az adatkezelő adatai"
      description="Ezek kerülnek a tájékoztatókba a {{…}} helyőrzők helyére. Kiskorú üzemeltetőnél általában a szülő az adatkezelő."
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Az adatkezelő neve" htmlFor="legal-name" hint="Pl. a szülő neve." error={errors.controllerName}>
            <TextInput
              id="legal-name"
              value={values.controllerName}
              maxLength={120}
              autoComplete="off"
              onChange={(event) => onChange({ ...values, controllerName: event.target.value })}
            />
          </Field>
          <Field
            label="Az adatkezelő e-mail-címe"
            htmlFor="legal-email"
            hint="Ezen kereshetnek meg a látogatók adatvédelmi kérdéssel."
            error={errors.controllerEmail}
          >
            <TextInput
              id="legal-email"
              type="email"
              inputMode="email"
              value={values.controllerEmail}
              maxLength={200}
              autoComplete="off"
              onChange={(event) => onChange({ ...values, controllerEmail: event.target.value })}
            />
          </Field>
          <Field
            label="Tárhelyszolgáltató"
            htmlFor="legal-hosting"
            hint="Neve, címe, elérhetősége – az élesítéskor derül ki, addig maradhat üresen."
            error={errors.hostingProvider}
          >
            <TextInput
              id="legal-hosting"
              value={values.hostingProvider}
              maxLength={300}
              onChange={(event) => onChange({ ...values, hostingProvider: event.target.value })}
            />
          </Field>
          <Field label="Hatálybalépés dátuma" htmlFor="legal-date" error={errors.effectiveDate}>
            <TextInput
              id="legal-date"
              type="date"
              value={values.effectiveDate}
              onChange={(event) => onChange({ ...values, effectiveDate: event.target.value })}
              className="md:max-w-xs"
            />
          </Field>
        </div>
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

function DocForm({ doc, fill }: { doc: LegalDocState; fill: (markdown: string) => string }) {
  const router = useRouter();
  const toast = useToast();
  const [bodyMd, setBodyMd] = useState(doc.bodyMd);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const dirty = bodyMd !== doc.bodyMd;
  useUnsavedChanges(dirty);
  const meta = DOCS[doc.slug];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const result = await saveLegalDoc({ slug: doc.slug, bodyMd });
    setSaving(false);
    if (result.ok) {
      setError(undefined);
      toast.success("Mentve!");
      router.refresh();
    } else {
      setError(result.fieldErrors?.bodyMd ?? result.error);
      toast.error(result.error);
    }
  };

  return (
    <Card
      title={meta.title}
      description={doc.updatedAt ? `Utoljára mentve: ${formatDateTime(doc.updatedAt)}` : undefined}
      actions={
        <Link
          href={meta.href}
          target="_blank"
          className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-bold hover:bg-surface-2"
        >
          <ExternalLink aria-hidden className="h-4 w-4" />
          Megnyitás
          <span className="sr-only">(új lapon)</span>
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <MarkdownEditor
          id={`legal-${doc.slug}`}
          label="A tájékoztató szövege (Markdown)"
          value={bodyMd}
          rows={22}
          onChange={setBodyMd}
          previewTransform={fill}
          error={error}
          hint="A „## ” kezdetű sorokból fejezetcímek lesznek – ezekből készül az oldal tetején a tartalomjegyzék."
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving || !dirty}>
            {saving ? "Mentés…" : "Mentés"}
          </Button>
          {dirty && (
            <Button
              tone="secondary"
              onClick={() => {
                if (window.confirm("Elveted a módosításokat, és visszatöltöd az utoljára mentett szöveget?")) setBodyMd(doc.bodyMd);
              }}
            >
              Módosítások elvetése
            </Button>
          )}
          {dirty && <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Mentetlen változások</span>}
        </div>
      </form>
    </Card>
  );
}

/** Jogi oldalak: az adatkezelő adatai és a két tájékoztató Markdown-szerkesztője, élő előnézettel. */
export function LegalEditor({ siteName, legal, docs }: { siteName: string; legal: LegalSettings; docs: LegalDocState[] }) {
  const [values, setValues] = useState(legal);
  // Az előnézet a még el nem mentett adatkezelői adatokkal is frissül.
  const fill = (markdown: string) => fillLegalTokens(markdown, { siteName }, values);

  return (
    <div className="space-y-8">
      <p className="flex gap-3 rounded-2xl bg-sky-50 p-4 text-sky-950 ring-1 ring-sky-200 dark:bg-sky-950 dark:text-sky-50 dark:ring-sky-800">
        <Info aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
        <span>
          A tájékoztatók <strong>minták</strong>, nem jogi tanácsadás. Mielőtt az oldal nyilvános lesz, érdemes egy
          felnőttel (vagy szakemberrel) átnézni őket. Ha később statisztikát, beágyazott videót vagy külső betűket
          használnál, a cookie tájékoztatót is frissíteni kell.
        </span>
      </p>

      <ControllerForm values={values} onChange={setValues} initial={legal} />

      <Card title="Helyőrzők" description="Ezeket a jeleket a szövegben hagyva az oldal automatikusan kitölti:">
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
          {TOKENS.map((item) => (
            <div key={item.token} className="contents">
              <dt>
                <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">{item.token}</code>
              </dt>
              <dd className="text-sm text-muted">{item.meaning}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {docs.map((doc) => (
        <DocForm key={doc.slug} doc={doc} fill={fill} />
      ))}
    </div>
  );
}
