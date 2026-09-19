"use client";

import { PAGE_ICONS } from "@/lib/icons";

/** Ikonválasztó előnézettel (valódi rádiógombok – a nyilakkal is lehet lépkedni). */
export function IconPicker({ name, value, onChange }: { name: string; value: string; onChange: (icon: string) => void }) {
  const selected = PAGE_ICONS[value];
  return (
    <fieldset className="space-y-2">
      <legend className="font-semibold">
        Ikon {selected && <span className="font-normal text-muted">– kiválasztva: {selected.label}</span>}
      </legend>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9 md:grid-cols-12 xl:grid-cols-14">
        {Object.entries(PAGE_ICONS).map(([iconName, { icon: Icon, label }]) => (
          <label key={iconName} title={label} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={iconName}
              checked={value === iconName}
              onChange={() => onChange(iconName)}
              className="peer sr-only"
            />
            <span className="grid aspect-square place-items-center rounded-lg border border-line hover:bg-surface-2 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-fg peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
              <Icon aria-hidden className="h-5 w-5" />
            </span>
            <span className="sr-only">{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
