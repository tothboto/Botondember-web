"use client";

/**
 * Beágyazott szkript, ami csak a szerveren renderelt HTML-ben fut le (az első
 * kirajzolás előtt). Ha a React a böngészőben újrarajzolja, `text/plain`
 * típust kap, így nem fut le újra, és a React sem figyelmeztet miatta.
 * (A Next.js 16 „Preventing flash before hydration” útmutatója szerint.)
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
