"use client";

import { Bold, Heading2, Italic, Link2, List, ListOrdered, Quote } from "lucide-react";
import { useRef, useState } from "react";
import { Markdown } from "@/components/site/Markdown";

type ToolId = "bold" | "italic" | "heading" | "list" | "ordered" | "quote" | "link";

const TOOLS: { id: ToolId; label: string; icon: typeof Bold }[] = [
  { id: "bold", label: "Félkövér", icon: Bold },
  { id: "italic", label: "Dőlt", icon: Italic },
  { id: "heading", label: "Címsor", icon: Heading2 },
  { id: "list", label: "Felsorolás", icon: List },
  { id: "ordered", label: "Számozott lista", icon: ListOrdered },
  { id: "quote", label: "Idézet", icon: Quote },
  { id: "link", label: "Link", icon: Link2 },
];

/**
 * Markdown szerkesztő formázó gombokkal és élő előnézettel
 * (nagy képernyőn egymás mellett, mobilon fülekkel váltható).
 */
export function MarkdownEditor({
  id,
  label,
  value,
  onChange,
  rows = 10,
  hint,
  previewTransform,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
  /** Az előnézet előtt a szövegen végzett átalakítás (pl. a jogi oldalak helyőrzői). */
  previewTransform?: (markdown: string) => string;
  error?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [view, setView] = useState<"edit" | "preview">("edit");

  const select = (start: number, end: number) => {
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(start, end);
    });
  };

  const wrap = (before: string, after = before, placeholder = "szöveg") => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end) || placeholder;
    onChange(value.slice(0, start) + before + selected + after + value.slice(end));
    select(start + before.length, start + before.length + selected.length);
  };

  const prefixLines = (prefix: (index: number) => string) => {
    const el = ref.current;
    if (!el) return;
    const lineStart = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    const lineEnd = value.indexOf("\n", el.selectionEnd);
    const end = lineEnd === -1 ? value.length : lineEnd;
    const block = value.slice(lineStart, end) || "szöveg";
    const replaced = block
      .split("\n")
      .map((line, index) => prefix(index) + line)
      .join("\n");
    onChange(value.slice(0, lineStart) + replaced + value.slice(end));
    select(lineStart, lineStart + replaced.length);
  };

  const runTool = (tool: ToolId) => {
    switch (tool) {
      case "bold":
        return wrap("**");
      case "italic":
        return wrap("_");
      case "heading":
        return prefixLines(() => "## ");
      case "list":
        return prefixLines(() => "- ");
      case "ordered":
        return prefixLines((i) => `${i + 1}. `);
      case "quote":
        return prefixLines(() => "> ");
      case "link":
        return wrap("[", "](https://)", "link szövege");
    }
  };

  const preview = previewTransform ? previewTransform(value) : value;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <div className="flex rounded-lg border border-line p-0.5 lg:hidden">
          {(["edit", "preview"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={view === mode}
              onClick={() => setView(mode)}
              className={`rounded-md px-3 py-1 text-sm font-semibold ${view === mode ? "bg-primary text-primary-fg" : ""}`}
            >
              {mode === "edit" ? "Szerkesztés" : "Előnézet"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className={view === "edit" ? "" : "hidden lg:block"}>
          <div role="toolbar" aria-label="Formázás" className="flex flex-wrap gap-1 rounded-t-xl border border-b-0 border-line bg-surface p-1.5">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => runTool(tool.id)}
                  aria-label={tool.label}
                  title={tool.label}
                  className="grid h-9 w-9 place-items-center rounded-md hover:bg-surface-2"
                >
                  <Icon aria-hidden className="h-4 w-4" />
                </button>
              );
            })}
          </div>
          <textarea
            ref={ref}
            id={id}
            value={value}
            rows={rows}
            onChange={(event) => onChange(event.target.value)}
            aria-describedby={hint ? `${id}-hint` : undefined}
            aria-invalid={error ? true : undefined}
            className="block w-full rounded-b-xl border border-line bg-bg px-3.5 py-3 font-mono text-sm leading-relaxed text-fg"
          />
        </div>
        <div className={view === "preview" ? "" : "hidden lg:block"}>
          <p className="mb-1.5 text-sm font-semibold text-muted">Előnézet</p>
          {/* A doboz görgethető, ezért billentyűzettel is elérhetőnek kell lennie (tabIndex).
              A neve tartalmazza a mező nevét is, hogy egy oldalon több előnézet is megkülönböztethető legyen. */}
          <div
            tabIndex={0}
            role="group"
            aria-label={`Előnézet: ${label}`}
            className="max-h-[36rem] overflow-y-auto rounded-xl border border-line bg-bg p-4"
          >
            {preview.trim() ? <Markdown>{preview}</Markdown> : <p className="text-muted">(üres)</p>}
          </div>
        </div>
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>}
    </div>
  );
}
