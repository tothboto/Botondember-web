import ReactMarkdown, { type Options } from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

type PluggableList = NonNullable<Options["rehypePlugins"]>;

/**
 * Markdown szöveg biztonságos megjelenítése.
 * - Nyers HTML-t nem enged (a react-markdown alapból kihagyja),
 * - a `rehype-sanitize` minden veszélyes elemet és attribútumot kiszűr,
 * - a külső linkek új lapon nyílnak meg (képernyőolvasónak ezt jelezve),
 * - a címsorok azonosítót kaphatnak, hogy a tartalomjegyzék odaugorhasson.
 */
export function Markdown({
  children,
  className = "",
  withHeadingIds = false,
  newTabLabel,
  lang = "hu",
}: {
  children: string;
  className?: string;
  withHeadingIds?: boolean;
  /** A képernyőolvasónak szóló „(új lapon nyílik meg)” szöveg. */
  newTabLabel?: string;
  lang?: string;
}) {
  const rehypePlugins: PluggableList = [rehypeSanitize];
  if (withHeadingIds) rehypePlugins.push(rehypeSlug);
  rehypePlugins.push([
    rehypeExternalLinks,
    {
      target: "_blank",
      rel: ["noopener", "noreferrer"],
      content: newTabLabel
        ? {
            type: "element",
            tagName: "span",
            properties: { className: ["sr-only"] },
            children: [{ type: "text", value: ` ${newTabLabel}` }],
          }
        : undefined,
    },
  ]);

  // A `prose` alapból ~65 karakterre korlátozza a szélességet; ha a hívó nem ad meg mást, kikapcsoljuk.
  const width = /(^|\s)(\w+:)?max-w-/.test(className) ? "" : "max-w-none";
  return (
    <div lang={lang} className={`prose prose-site ${width} ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={rehypePlugins}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
