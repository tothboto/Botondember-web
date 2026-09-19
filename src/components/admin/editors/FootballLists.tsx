"use client";

import type { FootballFact, FootballMoment, FootballPlayer } from "@/db/schema";
import { CollectionEditor, type FieldDef } from "../CollectionEditor";

const PLAYER_FIELDS: FieldDef[] = [
  { type: "text", name: "name", label: "Név", maxLength: 80 },
  { type: "text", name: "number", label: "Mezszám", maxLength: 4, placeholder: "pl. 7" },
  { type: "text", name: "position", label: "Poszt", maxLength: 40, placeholder: "pl. Támadó" },
  { type: "textarea", name: "note", label: "Rövid megjegyzés", maxLength: 300, rows: 2 },
  { type: "image", name: "mediaId", label: "Kép (álló, 4:5 arányú a legszebb)", aspect: "4 / 5" },
  { type: "toggle", name: "visible", label: "Látható az oldalon" },
];

const MOMENT_FIELDS: FieldDef[] = [
  { type: "text", name: "year", label: "Év", maxLength: 20, placeholder: "pl. 2024" },
  { type: "text", name: "title", label: "Cím", maxLength: 120 },
  { type: "textarea", name: "body", label: "Rövid szöveg", maxLength: 800, rows: 3 },
  { type: "url", name: "link", label: "Link (nem kötelező)" },
  { type: "image", name: "mediaId", label: "Kép (nem kötelező)", aspect: "3 / 2" },
  { type: "toggle", name: "visible", label: "Látható az oldalon" },
];

const FACT_FIELDS: FieldDef[] = [
  { type: "text", name: "label", label: "Megnevezés", maxLength: 60, placeholder: "pl. Alapítva" },
  { type: "text", name: "value", label: "Érték", maxLength: 120, placeholder: "pl. 1902" },
  { type: "toggle", name: "visible", label: "Látható az oldalon" },
];

export function FootballLists({
  players,
  moments,
  facts,
}: {
  players: FootballPlayer[];
  moments: FootballMoment[];
  facts: FootballFact[];
}) {
  return (
    <div className="space-y-8">
      <CollectionEditor
        collection="players"
        heading="Játékosok"
        description="Kártyák nagy mezszámmal. Időben változó adatot (aktuális keret) nem kell beírni – csak a kedvenceidet."
        items={players}
        fields={PLAYER_FIELDS}
        emptyItem={{ name: "", number: "", position: "", note: "", mediaId: null, visible: true }}
        itemTitle={(item) => `${item.number ? `#${item.number} ` : ""}${String(item.name ?? "")}`}
        itemSubtitle={(item) => String(item.position ?? "")}
        imageField="mediaId"
        imageAspect="4 / 5"
        addLabel="Új játékos"
      />
      <CollectionEditor
        collection="moments"
        heading="Pillanatok / trófeák (idővonal)"
        items={moments}
        fields={MOMENT_FIELDS}
        emptyItem={{ year: "", title: "", body: "", link: "", mediaId: null, visible: true }}
        itemTitle={(item) => `${item.year ? `${String(item.year)} – ` : ""}${String(item.title ?? "")}`}
        itemSubtitle={(item) => String(item.body ?? "")}
        imageField="mediaId"
        imageAspect="3 / 2"
        addLabel="Új pillanat"
      />
      <CollectionEditor
        collection="facts"
        heading="Klub alapadatok"
        description="Kulcs–érték párok, pl. „Alapítva: 1902”."
        items={facts}
        fields={FACT_FIELDS}
        emptyItem={{ label: "", value: "", visible: true }}
        itemTitle={(item) => `${String(item.label ?? "")}: ${String(item.value ?? "")}`}
        addLabel="Új adat"
      />
    </div>
  );
}
