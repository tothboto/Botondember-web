/**
 * Tartalomjegyzék készítése egy Markdown szöveg címsoraiból.
 * Ugyanazt az azonosító-képzést használja (github-slugger), mint a
 * megjelenítéskor a `rehype-slug`, így a linkek pontosan a címsorokra ugranak.
 */
import GithubSlugger from "github-slugger";

export type TocItem = { depth: number; text: string; id: string };

/** A címsor szövegéből kiveszi a Markdown jelöléseket (link, kiemelés, kód). */
export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(.+?)\1/g, "$2")
    .replace(/\\([\\`*_{}[\]()#+\-.!|<>~])/g, "$1")
    .trim();
}

export function extractToc(markdown: string, maxDepth = 3): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const depth = match[1].length;
    const text = stripInlineMarkdown(match[2]);
    // Minden címsort sorban „elnevezünk” (mint a rehype-slug), hogy az ismétlődőknél is egyezzen.
    const id = slugger.slug(text);
    if (depth >= 2 && depth <= maxDepth) items.push({ depth, text, id });
  }
  return items;
}
