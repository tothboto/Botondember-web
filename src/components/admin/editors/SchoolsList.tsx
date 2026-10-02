"use client";

import type { School } from "@/db/schema";
import { slugify } from "@/lib/admin/slug";
import { CollectionEditor, type FieldDef, type FormContext } from "../CollectionEditor";
import { MarkdownEditor } from "../MarkdownEditor";

/** Az iskola saját aloldalának hosszabb szövege (Markdown, előnézettel). */
function BodyField({ ctx }: { ctx: FormContext }) {
  return (
    <MarkdownEditor
      id="school-body"
      label="Az iskola oldalának szövege"
      value={String(ctx.values.bodyMd ?? "")}
      rows={10}
      hint="Ez jelenik meg az iskola saját aloldalán. Formázhatod: **félkövér**, ## címsor, - felsorolás, [link](https://…)."
      error={ctx.errors.bodyMd}
      onChange={(value) => ctx.set("bodyMd", value)}
    />
  );
}

/** Az URL-cím mezője: ha üres, a névből készül (a mentés is ezt teszi). */
function SlugField({ ctx }: { ctx: FormContext }) {
  const name = String(ctx.values.name ?? "");
  const slug = String(ctx.values.slug ?? "");
  const preview = slugify(slug) || slugify(name) || "iskola";
  return (
    <div className="space-y-1.5">
      <label htmlFor="school-slug" className="block font-semibold">
        Az aloldal címe az URL-ben (nem kötelező)
      </label>
      <input
        id="school-slug"
        value={slug}
        maxLength={60}
        autoCapitalize="off"
        spellCheck={false}
        onChange={(event) => ctx.set("slug", event.target.value)}
        className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-base text-fg placeholder:text-muted/80"
        placeholder={slugify(name) || "pelda-iskola"}
      />
      <p className="text-sm text-muted">
        Üresen hagyva a névből készül. Az iskola oldala itt lesz: <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">/iskolaim/{preview}</code>
      </p>
      {ctx.errors.slug && <p className="text-sm font-semibold text-red-700 dark:text-red-300">{ctx.errors.slug}</p>}
    </div>
  );
}

const FIELDS: FieldDef[] = [
  { type: "text", name: "name", label: "Az iskola neve", maxLength: 120, placeholder: "pl. Bajai Szentistváni Általános Iskola" },
  { type: "text", name: "kind", label: "Milyen iskola", maxLength: 60, placeholder: "pl. általános iskola", hint: "Ez a név alatt jelenik meg." },
  { type: "text", name: "years", label: "Mettől meddig jártam ide", maxLength: 30, placeholder: "pl. 2019–2027" },
  { type: "text", name: "city", label: "Város", maxLength: 60, placeholder: "pl. Baja" },
  { type: "text", name: "address", label: "Cím (nem kötelező)", maxLength: 160, placeholder: "pl. 6500 Baja, Dózsa György út 131–133." },
  { type: "url", name: "link", label: "Az iskola honlapja (nem kötelező)", placeholder: "https://…" },
  { type: "textarea", name: "lead", label: "Rövid bemutatás", maxLength: 400, rows: 3, hint: "Ez látszik az iskolák listájában is, az oldal tetején." },
  { type: "custom", name: "bodyMd", render: (ctx) => <BodyField ctx={ctx} /> },
  { type: "image", name: "mediaId", label: "Kép az iskoláról (16:9 arányú a legszebb)", aspect: "16 / 9" },
  { type: "custom", name: "slug", render: (ctx) => <SlugField ctx={ctx} /> },
  { type: "toggle", name: "visible", label: "Látható az oldalon" },
];

const EMPTY = {
  name: "",
  slug: "",
  kind: "",
  city: "",
  address: "",
  years: "",
  link: "",
  lead: "",
  bodyMd: "",
  mediaId: null,
  visible: true,
};

export function SchoolsList({ items }: { items: School[] }) {
  return (
    <CollectionEditor
      collection="schools"
      heading="Iskolák"
      description="Minden iskolának saját aloldala lesz. A sorrend itt állítható – ebben a sorrendben jelennek meg a listában."
      items={items}
      fields={FIELDS}
      emptyItem={EMPTY}
      itemTitle={(item) => String(item.name ?? "")}
      itemSubtitle={(item) => [item.kind, item.city, item.years].filter(Boolean).join(" · ")}
      imageField="mediaId"
      addLabel="Új iskola"
    />
  );
}
