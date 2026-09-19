"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Színválasztó + hexa kód mező + „Alaphelyzet” gomb. `null` = az alapérték. */
export function ColorField({
  id,
  label,
  value,
  defaultValue,
  onChange,
  description,
}: {
  id: string;
  label: string;
  value: string | null;
  defaultValue: string;
  onChange: (value: string | null) => void;
  description?: string;
}) {
  const effective = (value ?? defaultValue).toUpperCase();
  const [draft, setDraft] = useState(effective);
  const [previous, setPrevious] = useState(effective);
  if (previous !== effective) {
    // Ha kívülről változik (pl. Alaphelyzet), a szövegmező is frissül.
    setPrevious(effective);
    setDraft(effective);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
      <input
        id={id}
        type="color"
        value={effective.toLowerCase()}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        className="h-12 w-14 shrink-0 cursor-pointer rounded-lg border border-line bg-bg p-1"
      />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block font-semibold">
          {label}
        </label>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <input
        aria-label={`${label} – színkód`}
        value={draft}
        maxLength={7}
        onChange={(event) => {
          const next = event.target.value.startsWith("#") ? event.target.value : `#${event.target.value}`;
          setDraft(next.toUpperCase());
          if (HEX.test(next)) onChange(next.toUpperCase());
        }}
        className="w-28 rounded-lg border border-line bg-bg px-2.5 py-2 font-mono text-sm uppercase"
      />
      <button
        type="button"
        onClick={() => onChange(null)}
        disabled={value === null}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50"
        title={`Alaphelyzet: ${defaultValue}`}
      >
        <RotateCcw aria-hidden className="h-4 w-4" />
        Alaphelyzet
      </button>
    </div>
  );
}
