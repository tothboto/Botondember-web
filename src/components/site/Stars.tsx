import { Star } from "lucide-react";

/**
 * 1–5 csillagos értékelés. A képernyőolvasó a teljes szöveget kapja
 * (pl. „4 / 5 csillag”), a csillagok mellett a szám is látszik.
 */
export function Stars({ rating, label }: { rating: number; label: string }) {
  if (rating < 1) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span role="img" aria-label={label} className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            aria-hidden
            className={`h-4 w-4 ${
              n <= rating
                ? "fill-[#ffb800] text-[#b45309] dark:fill-[#ffc53d] dark:text-[#ffc53d]"
                : "fill-transparent text-page-muted/60"
            }`}
            strokeWidth={1.8}
          />
        ))}
      </span>
      <span aria-hidden className="text-xs font-semibold text-page-muted">
        {rating}/5
      </span>
    </div>
  );
}
