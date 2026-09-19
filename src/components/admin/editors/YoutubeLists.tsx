"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { lookupYoutube } from "@/app/actions/admin/youtube";
import type { YoutubeItem } from "@/db/schema";
import { CollectionEditor, type FieldDef, type FormContext } from "../CollectionEditor";
import { useMediaLibrary } from "../MediaLibrary";
import { useToast } from "../Toast";
import { Button, Field, TextInput } from "../ui";

type Kind = "song" | "video" | "channel" | "playlist";

/** A link mező az „Adatok lekérése” gombbal (oEmbed). */
function YoutubeLinkField({ ctx, kind }: { ctx: FormContext; kind: Kind }) {
  const toast = useToast();
  const library = useMediaLibrary();
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const id = `yt-${kind}-${String(ctx.values.id ?? "new")}-url`;

  const fetchDetails = async () => {
    setLoading(true);
    setWarning(null);
    const result = await lookupYoutube(String(ctx.values.url ?? ""));
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const data = result.data;
    if (kind === "channel" && data.type !== "channel") setWarning("Ez nem csatorna link – biztosan ide szeretnéd tenni?");
    if (kind !== "channel" && data.type === "channel") setWarning("Ez egy csatorna link – a „Kedvenc csatornáim” listába való.");
    if (kind === "playlist" && data.type !== "playlist") setWarning("Ez nem lejátszási lista link.");
    const patch: Record<string, unknown> = { url: data.url, ytId: data.ytId };
    if (data.title) patch.title = data.title;
    if (data.author && kind !== "channel") patch.author = data.author;
    if (data.thumb) {
      library.add(data.thumb);
      patch.thumbMediaId = data.thumb.id;
      ctx.setAlt("thumbMediaId", data.thumb.alt);
    }
    ctx.setMany(patch);
    if (data.warning) setWarning((w) => w ?? data.warning);
    else toast.success("Adatok kitöltve – nézd át, és mentsd el!");
  };

  return (
    <Field
      label="YouTube link"
      htmlFor={id}
      error={ctx.errors.url}
      hint="Másold be a linket, majd kattints az „Adatok lekérése” gombra: a címet, a csatornát és a bélyegképet automatikusan kitöltöm."
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <TextInput
          id={id}
          type="url"
          inputMode="url"
          placeholder={kind === "channel" ? "https://www.youtube.com/@csatornanev" : "https://www.youtube.com/watch?v=…"}
          value={String(ctx.values.url ?? "")}
          onChange={(event) => ctx.set("url", event.target.value)}
        />
        <Button tone="secondary" onClick={fetchDetails} disabled={loading || !String(ctx.values.url ?? "").trim()} className="shrink-0">
          <Download aria-hidden className="h-4 w-4" />
          {loading ? "Lekérés…" : "Adatok lekérése"}
        </Button>
      </div>
      {warning && (
        <p role="status" className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-50 dark:ring-amber-800">
          {warning}
        </p>
      )}
    </Field>
  );
}

function fieldsFor(kind: Kind): FieldDef[] {
  const fields: FieldDef[] = [
    { type: "custom", name: "url", render: (ctx) => <YoutubeLinkField ctx={ctx} kind={kind} /> },
    { type: "text", name: "title", label: kind === "channel" ? "A csatorna neve" : "Cím", maxLength: 150 },
  ];
  if (kind !== "channel") fields.push({ type: "text", name: "author", label: "Csatorna / előadó", maxLength: 100 });
  fields.push({
    type: "textarea",
    name: "note",
    label: kind === "channel" ? "Rövid megjegyzés (miért szereted?)" : "Megjegyzés (nem kötelező)",
    maxLength: 300,
    rows: 2,
  });
  if (kind === "playlist") {
    fields.push({ type: "number", name: "itemCount", label: "Hány videó van benne? (nem kötelező)", min: 0, nullable: true });
  }
  fields.push({
    type: "image",
    name: "thumbMediaId",
    label: kind === "channel" ? "Csatorna avatar (kör alakban jelenik meg)" : "Bélyegkép (16:9)",
    aspect: kind === "channel" ? "1 / 1" : "16 / 9",
  });
  fields.push({ type: "toggle", name: "visible", label: "Látható az oldalon" });
  return fields;
}

const EMPTY = { url: "", ytId: "", title: "", author: "", note: "", itemCount: null, thumbMediaId: null, visible: true };

const LISTS: { kind: Kind; heading: string; add: string; description: string }[] = [
  { kind: "song", heading: "Zeneszámok", add: "Új zeneszám", description: "Vegyes kedvenc zenék – videókártyákként jelennek meg." },
  { kind: "video", heading: "Videók", add: "Új videó", description: "Vegyes kedvenc videók." },
  { kind: "channel", heading: "Kedvenc csatornáim", add: "Új csatorna", description: "Kerek avatar, csatornanév és egy rövid megjegyzés." },
  { kind: "playlist", heading: "Kedvenc lejátszási listáim", add: "Új lejátszási lista", description: "„Egymásra rakott” bélyegkép, cím, elemszám." },
];

export function YoutubeLists({ items }: { items: YoutubeItem[] }) {
  return (
    <div className="space-y-8">
      {LISTS.map((list) => (
        <CollectionEditor
          key={list.kind}
          collection="youtube"
          heading={list.heading}
          description={list.description}
          items={items.filter((item) => item.kind === list.kind)}
          fields={fieldsFor(list.kind)}
          emptyItem={EMPTY}
          extraPayload={{ kind: list.kind }}
          itemTitle={(item) => String(item.title ?? "")}
          itemSubtitle={(item) => String(item.author || item.note || item.url || "")}
          imageField="thumbMediaId"
          imageAspect={list.kind === "channel" ? "1 / 1" : "16 / 9"}
          addLabel={list.add}
        />
      ))}
    </div>
  );
}
