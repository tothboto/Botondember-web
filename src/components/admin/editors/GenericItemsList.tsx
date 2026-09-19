"use client";

import type { GenericItem } from "@/db/schema";
import { CollectionEditor, type FieldDef } from "../CollectionEditor";

const FIELDS: FieldDef[] = [
  { type: "text", name: "title", label: "Cím", maxLength: 120 },
  { type: "textarea", name: "body", label: "Rövid szöveg (nem kötelező)", maxLength: 1000, rows: 4 },
  { type: "image", name: "mediaId", label: "Kép (16:10 arányú a legszebb)", aspect: "16 / 10" },
  { type: "url", name: "link", label: "Link (nem kötelező)", hint: "Ha megadod, a kártya alján egy „Megnézem” link jelenik meg." },
  { type: "toggle", name: "visible", label: "Látható az oldalon" },
];

const EMPTY = { title: "", body: "", mediaId: null, link: "", visible: true };

/** Az „Általános” sablonú aloldal kártyái. */
export function GenericItemsList({ pageId, items }: { pageId: number; items: GenericItem[] }) {
  return (
    <CollectionEditor
      collection="generic"
      heading="Kártyák"
      description="Nem kötelező: kártyák az oldal alján, pl. kedvenc filmek, könyvek, helyek."
      items={items}
      fields={FIELDS}
      emptyItem={EMPTY}
      extraPayload={{ pageId }}
      itemTitle={(item) => String(item.title ?? "")}
      itemSubtitle={(item) => String(item.body ?? "").slice(0, 90)}
      imageField="mediaId"
      imageAspect="16 / 10"
      addLabel="Új kártya"
    />
  );
}
