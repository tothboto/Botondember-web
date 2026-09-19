"use client";

import type { Hobby } from "@/db/schema";
import { CollectionEditor, type FieldDef } from "../CollectionEditor";

const FIELDS: FieldDef[] = [
  { type: "text", name: "title", label: "A hobbi neve", maxLength: 80, placeholder: "pl. Foci" },
  { type: "text", name: "tag", label: "Címke", maxLength: 30, hint: "Szabad szöveg, pl. sport, kreatív, tech." },
  { type: "text", name: "since", label: "Mióta csinálom (nem kötelező)", maxLength: 30, placeholder: "pl. 2020" },
  { type: "textarea", name: "body", label: "Rövid leírás", maxLength: 600, rows: 3 },
  { type: "image", name: "mediaId", label: "Kép (4:3 arányú a legszebb)", aspect: "4 / 3" },
  { type: "toggle", name: "visible", label: "Látható az oldalon" },
];

const EMPTY = { title: "", tag: "", since: "", body: "", mediaId: null, visible: true };

export function HobbiesList({ items }: { items: Hobby[] }) {
  return (
    <CollectionEditor
      collection="hobbies"
      heading="Hobbi-kártyák"
      description="A kártyák ebben a sorrendben jelennek meg az oldalon."
      items={items}
      fields={FIELDS}
      emptyItem={EMPTY}
      itemTitle={(item) => String(item.title ?? "")}
      itemSubtitle={(item) => [item.tag, item.since].filter(Boolean).join(" · ")}
      imageField="mediaId"
      addLabel="Új hobbi"
    />
  );
}
