"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Friend } from "@/db/schema";
import { slugify } from "@/lib/admin/slug";
import { FRIEND_LINK_KINDS, FRIEND_LINK_LABELS, type FriendLinkKind } from "@/lib/friends";
import { CollectionEditor, type FieldDef, type FormContext } from "../CollectionEditor";
import { MarkdownEditor } from "../MarkdownEditor";

type LinkRow = { kind: FriendLinkKind; url: string };

function rowsOf(value: unknown): LinkRow[] {
  return Array.isArray(value) ? (value as LinkRow[]) : [];
}

/** A barát profiljaira mutató linkek: hálózat + cím, soronként. */
function LinksField({ ctx }: { ctx: FormContext }) {
  const rows = rowsOf(ctx.values.links);
  const update = (next: LinkRow[]) => ctx.set("links", next);

  return (
    <fieldset className="space-y-3">
      <legend className="font-semibold">Hol találod meg az interneten? (nem kötelező)</legend>
      <p className="text-sm text-muted">
        Legfeljebb 8 link. A listában és a barát oldalán egy-egy kerek gomb lesz belőlük, és új lapon nyílnak meg.
      </p>

      {rows.map((row, index) => (
        <div key={index} className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <label htmlFor={`friend-link-kind-${index}`} className="block text-sm font-semibold">
              Hol?
            </label>
            <select
              id={`friend-link-kind-${index}`}
              value={row.kind}
              onChange={(event) => {
                const next = [...rows];
                next[index] = { ...row, kind: event.target.value as FriendLinkKind };
                update(next);
              }}
              className="rounded-xl border border-line bg-bg px-3 py-2.5 text-base text-fg"
            >
              {FRIEND_LINK_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {FRIEND_LINK_LABELS[kind]}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-48 flex-1 space-y-1.5">
            <label htmlFor={`friend-link-url-${index}`} className="block text-sm font-semibold">
              A link címe
            </label>
            <input
              id={`friend-link-url-${index}`}
              value={row.url}
              inputMode="url"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="https://…"
              onChange={(event) => {
                const next = [...rows];
                next[index] = { ...row, url: event.target.value };
                update(next);
              }}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-base text-fg placeholder:text-muted/80"
            />
          </div>

          <button
            type="button"
            onClick={() => update(rows.filter((_, i) => i !== index))}
            aria-label={`Link törlése: ${FRIEND_LINK_LABELS[row.kind]}`}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-fg hover:bg-surface-2"
          >
            <Trash2 aria-hidden className="h-5 w-5" />
          </button>
        </div>
      ))}

      {rows.length < 8 && (
        <button
          type="button"
          onClick={() => update([...rows, { kind: "youtube", url: "" }])}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2.5 font-semibold text-fg hover:bg-surface-2"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Új link
        </button>
      )}

      {ctx.errors.links && <p className="text-sm font-semibold text-red-700 dark:text-red-300">{ctx.errors.links}</p>}
    </fieldset>
  );
}

/** A „Bemutatás” szöveg a barát saját aloldalán. */
function BodyField({ ctx }: { ctx: FormContext }) {
  return (
    <MarkdownEditor
      id="friend-body"
      label="Bemutatás (a barát saját oldalán jelenik meg)"
      value={String(ctx.values.bodyMd ?? "")}
      rows={8}
      hint="Mesélj róla: honnan ismeritek egymást, mit szoktatok együtt csinálni? Formázhatod: **félkövér**, ## címsor, - felsorolás."
      error={ctx.errors.bodyMd}
      onChange={(value) => ctx.set("bodyMd", value)}
    />
  );
}

/** Az URL-cím mezője: ha üres, a névből készül (a mentés is ezt teszi). */
function SlugField({ ctx }: { ctx: FormContext }) {
  const name = String(ctx.values.name ?? "");
  const slug = String(ctx.values.slug ?? "");
  const preview = slugify(slug) || slugify(name) || "barat";
  return (
    <div className="space-y-1.5">
      <label htmlFor="friend-slug" className="block font-semibold">
        Az aloldal címe az URL-ben (nem kötelező)
      </label>
      <input
        id="friend-slug"
        value={slug}
        maxLength={60}
        autoCapitalize="off"
        spellCheck={false}
        onChange={(event) => ctx.set("slug", event.target.value)}
        className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-base text-fg placeholder:text-muted/80"
        placeholder={slugify(name) || "pelda-barat"}
      />
      <p className="text-sm text-muted">
        Üresen hagyva a névből készül. A barát oldala itt lesz:{" "}
        <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">/baratok/{preview}</code>
      </p>
      {ctx.errors.slug && <p className="text-sm font-semibold text-red-700 dark:text-red-300">{ctx.errors.slug}</p>}
    </div>
  );
}

const FIELDS: FieldDef[] = [
  {
    type: "text",
    name: "name",
    label: "A barát neve",
    maxLength: 80,
    placeholder: "pl. Peti vagy Zöld Sárkány",
    hint: "Becenév vagy keresztnév is elég – teljes nevet csak akkor írj ide, ha ő és a szülei is beleegyeztek.",
  },
  { type: "image", name: "mediaId", label: "Profilkép (négyzet alakú a legszebb)", aspect: "1 / 1" },
  { type: "custom", name: "links", render: (ctx) => <LinksField ctx={ctx} /> },
  { type: "custom", name: "bodyMd", render: (ctx) => <BodyField ctx={ctx} /> },
  { type: "custom", name: "slug", render: (ctx) => <SlugField ctx={ctx} /> },
  { type: "toggle", name: "visible", label: "Látható az oldalon" },
];

const EMPTY = { name: "", slug: "", mediaId: null, bodyMd: "", links: [], visible: true };

export function FriendsList({ items }: { items: Friend[] }) {
  return (
    <CollectionEditor
      collection="friends"
      heading="Barátok"
      description="Minden barátnak saját aloldala lesz. A sorrend itt állítható – ebben a sorrendben jelennek meg a listában."
      items={items}
      fields={FIELDS}
      emptyItem={EMPTY}
      itemTitle={(item) => String(item.name ?? "")}
      itemSubtitle={(item) => {
        const count = rowsOf(item.links).length;
        return count > 0 ? `${count} link` : "";
      }}
      imageField="mediaId"
      addLabel="Új barát"
    />
  );
}
