/** A kezdő példatartalmak jelölése: „Példa – cseréld le az Adminban”. */
export function ExampleBadge({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.7rem] font-bold tracking-wide text-amber-900 ring-1 ring-amber-900/15 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-100/20 ${className}`}
    >
      {label}
    </span>
  );
}
