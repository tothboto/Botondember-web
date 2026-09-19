import type { ReactNode } from "react";
import { PageIcon } from "@/lib/icons";
import { Markdown } from "./Markdown";

/**
 * Az aloldalak tetején: nagy cím az ikonnal + rövid bevezető (az Adminból).
 * A színeket az oldal sablonja (tpl-*) adja, így minden aloldalon a saját
 * stílusában jelenik meg.
 */
export function PageHeader({
  title,
  icon,
  intro,
  titleClassName = "",
  className = "",
  children,
}: {
  title: string;
  icon: string;
  intro?: string;
  titleClassName?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header className={`container-page pt-10 pb-8 sm:pt-14 ${className}`}>
      <h1
        className={`flex items-center gap-3 text-[clamp(2rem,6vw,3.75rem)] leading-[1.05] font-extrabold tracking-tight uppercase sm:gap-4 ${titleClassName}`}
      >
        <PageIcon name={icon} className="h-[0.9em] w-[0.9em] shrink-0 text-page-accent" strokeWidth={2.2} />
        <span>{title}</span>
      </h1>
      {intro && <Markdown className="mt-4 max-w-2xl text-lg text-page-muted">{intro}</Markdown>}
      {children}
    </header>
  );
}
