import { Inbox } from "lucide-react";

/** Barátságos üres állapot: „Még nincs itt semmi.” */
export function EmptyState({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-page-line px-6 py-12 text-center text-page-muted ${className}`}
    >
      <Inbox aria-hidden className="h-10 w-10" strokeWidth={1.6} />
      <p className="text-lg">{text}</p>
    </div>
  );
}
