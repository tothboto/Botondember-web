"use client";

import type { Game } from "@/db/schema";
import { CollectionEditor, type FieldDef } from "../CollectionEditor";

const PLATFORM_OPTIONS = [
  { value: "pc", label: "PC" },
  { value: "playstation", label: "PlayStation" },
  { value: "xbox", label: "Xbox" },
  { value: "switch", label: "Switch" },
  { value: "mobile", label: "Mobil" },
];

const FIELDS: FieldDef[] = [
  { type: "text", name: "title", label: "A játék címe", maxLength: 80 },
  { type: "checkboxes", name: "platforms", label: "Platformok", options: PLATFORM_OPTIONS },
  { type: "text", name: "genre", label: "Műfaj", maxLength: 60, placeholder: "pl. Sport / foci" },
  { type: "rating", name: "rating", label: "Értékelésem" },
  { type: "textarea", name: "review", label: "Rövid vélemény", maxLength: 600, rows: 3 },
  { type: "url", name: "link", label: "Link (nem kötelező)", hint: "Pl. a játék hivatalos oldala." },
  { type: "image", name: "coverMediaId", label: "Borítókép (álló, 3:4 arányú)", aspect: "3 / 4" },
  {
    type: "toggle",
    name: "featured",
    label: "Kiemelt játék",
    description: "Nagy bannerben jelenik meg a lista fölött. Egyszerre csak egy játék lehet kiemelt.",
  },
  { type: "toggle", name: "visible", label: "Látható az oldalon" },
];

const EMPTY = {
  title: "",
  platforms: [] as string[],
  genre: "",
  rating: 0,
  review: "",
  link: "",
  coverMediaId: null,
  featured: false,
  visible: true,
};

export function GamesList({ items }: { items: Game[] }) {
  return (
    <CollectionEditor
      collection="games"
      heading="Játékok"
      description="A kiemelt játék nagy bannerben, a többi borítórácsban jelenik meg, ebben a sorrendben."
      items={items}
      fields={FIELDS}
      emptyItem={EMPTY}
      itemTitle={(item) => String(item.title ?? "")}
      itemSubtitle={(item) => {
        const rating = Number(item.rating ?? 0);
        return [item.genre, rating > 0 ? `${"★".repeat(rating)}${"☆".repeat(5 - rating)}` : ""].filter(Boolean).join(" · ");
      }}
      badges={(item) => (item.featured === true ? ["Kiemelt"] : [])}
      imageField="coverMediaId"
      imageAspect="3 / 4"
      addLabel="Új játék"
    />
  );
}
