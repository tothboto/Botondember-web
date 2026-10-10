"use client";

import type { Gadget } from "@/db/schema";
import { CollectionEditor, type FieldDef, type FormContext } from "../CollectionEditor";

/**
 * A csoport (kategória) mezője. Szabadon beírható – így nem digitális tárgyak
 * csoportja is létrehozható –, de a már használt csoportok egy kattintással
 * kiválaszthatók, hogy ne legyen kétféle írásmód ugyanarra.
 */
function CategoryField({ ctx, known }: { ctx: FormContext; known: string[] }) {
  const value = String(ctx.values.category ?? "");
  return (
    <div className="space-y-1.5">
      <label htmlFor="gadget-category" className="block font-semibold">
        Csoport
      </label>
      <input
        id="gadget-category"
        list="gadget-categories"
        value={value}
        maxLength={60}
        onChange={(event) => ctx.set("category", event.target.value)}
        className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-base text-fg placeholder:text-muted/80"
        placeholder="pl. Számítógépek"
      />
      <datalist id="gadget-categories">
        {known.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <p className="text-sm text-muted">
        Az azonos csoportba írt eszközök egy blokkba kerülnek az oldalon (pl. „Számítógépek”, „Okosórák”, „Tabletek”,
        „Egyéb kincseim”). Üresen hagyva a „{"Egyéb kedvenceim"}” csoportba kerül.
      </p>
      {ctx.errors.category && <p className="text-sm font-semibold text-red-700 dark:text-red-300">{ctx.errors.category}</p>}
    </div>
  );
}

const EMPTY = {
  name: "",
  category: "",
  maker: "",
  since: "",
  rating: 0,
  note: "",
  link: "",
  mediaId: null,
  visible: true,
};

export function GadgetsList({ items }: { items: Gadget[] }) {
  const known = [...new Set(items.map((item) => item.category.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "hu"),
  );

  const fields: FieldDef[] = [
    { type: "text", name: "name", label: "Az eszköz neve", maxLength: 120, placeholder: "pl. Lenovo IdeaPad 5" },
    { type: "custom", name: "category", render: (ctx) => <CategoryField ctx={ctx} known={known} /> },
    { type: "text", name: "maker", label: "Gyártó / márka (nem kötelező)", maxLength: 60, placeholder: "pl. Lenovo" },
    { type: "text", name: "since", label: "Mióta van meg (nem kötelező)", maxLength: 30, placeholder: "pl. 2024 óta" },
    { type: "rating", name: "rating", label: "Hány csillagot adsz neki?" },
    {
      type: "textarea",
      name: "note",
      label: "Miért szereted? Mire használod?",
      maxLength: 600,
      rows: 4,
      hint: "Egy-két mondat elég – ez jelenik meg az eszköz mellett.",
    },
    { type: "url", name: "link", label: "Link (nem kötelező)", placeholder: "https://…", hint: "Pl. a gyártó oldala. Új lapon nyílik meg." },
    { type: "image", name: "mediaId", label: "Kép az eszközről (négyzet alakú a legszebb)", aspect: "1 / 1" },
    { type: "toggle", name: "visible", label: "Látható az oldalon" },
  ];

  return (
    <CollectionEditor
      collection="gadgets"
      heading="Eszközök"
      description="Az azonos csoportba írt eszközök egy blokkban jelennek meg. A sorrend itt állítható – a csoportok abban a sorrendben követik egymást, ahogy az első elemük itt szerepel."
      items={items}
      fields={fields}
      emptyItem={EMPTY}
      itemTitle={(item) => String(item.name ?? "")}
      itemSubtitle={(item) => [item.category, item.maker, item.since].filter(Boolean).join(" · ")}
      imageField="mediaId"
      addLabel="Új eszköz"
    />
  );
}
