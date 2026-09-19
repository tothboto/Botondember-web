import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown } from "@/components/site/Markdown";
import { COOKIE_MD, PRIVACY_MD } from "@/db/seed/legal";
import { LOCALE_COOKIE } from "@/lib/i18n/constants";
import { escapeMarkdownText, fillLegalTokens } from "@/lib/legal";
import { extractToc, stripInlineMarkdown } from "@/lib/markdown/toc";
import { settingDefaults } from "@/lib/settings";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const render = (markdown: string) => renderToStaticMarkup(<Markdown withHeadingIds>{markdown}</Markdown>);

describe("tartalomjegyzék", () => {
  it("minden bejegyzése egy valódi címsorra mutat (a jogi szövegekben is)", () => {
    const samples = [PRIVACY_MD, COOKIE_MD, "## Alma\n\n## Alma\n\n### Más **fontos** [link](https://x.hu) és `kód`"];
    for (const markdown of samples) {
      const toc = extractToc(markdown);
      expect(toc.length).toBeGreaterThan(0);
      const html = render(markdown);
      for (const item of toc) expect(html, item.text).toContain(`id="${item.id}"`);
    }
  });

  it("a fejezeteket és az alfejezeteket is felsorolja", () => {
    const toc = extractToc(PRIVACY_MD);
    expect(toc.filter((i) => i.depth === 2)).toHaveLength(9);
    expect(toc.some((i) => i.depth === 3 && i.text.startsWith("6.1"))).toBe(true);
    expect(toc[0]).toEqual({ depth: 2, text: "1. Bevezetés", id: "1-bevezetés" });
  });

  it("a kódblokkban lévő # jeleket nem veszi címsornak", () => {
    expect(extractToc("```\n## nem cím\n```\n## Cím")).toEqual([{ depth: 2, text: "Cím", id: "cím" }]);
  });

  it("kiszedi a Markdown jelöléseket a címsor szövegéből", () => {
    expect(stripInlineMarkdown("**Fontos** _dolog_ [link](https://a.hu) `x`")).toBe("Fontos dolog link x");
  });
});

describe("jogi szövegek helyőrzői", () => {
  it("üres adatnál jól látható helykitöltő jelenik meg", () => {
    const filled = fillLegalTokens(PRIVACY_MD, settingDefaults.general, settingDefaults.legal);
    expect(filled).not.toMatch(/\{\{[A-Z_]+\}\}/);
    expect(filled).toContain("az adatkezelő neve – az Admin > Jogi oldalak menüben adható meg");
    expect(filled).toContain("2026. szeptember 19.");
  });

  it("a megadott adatok bekerülnek, az e-mail kattintható link lesz", () => {
    const filled = fillLegalTokens(COOKIE_MD, settingDefaults.general, {
      ...settingDefaults.legal,
      controllerName: "Minta Szülő",
      controllerEmail: "szulo@pelda.hu",
    });
    expect(filled).toContain("Minta Szülő");
    expect(filled).toContain("(mailto:szulo@pelda.hu)");
    expect(render(filled)).toContain('href="mailto:szulo@pelda.hu"');
  });

  it("a beírt szövegben lévő Markdown jeleket nem hajtja végre", () => {
    const html = render(escapeMarkdownText("[kattints](javascript:alert(1)) *csillag*"));
    expect(html).not.toContain("<a");
    expect(html).not.toContain("<em>");
  });
});

describe("a Cookie tájékoztató a kódban ténylegesen használt neveket sorolja fel", () => {
  it("nyelvi süti és téma tároló", () => {
    expect(COOKIE_MD).toContain(`\`${LOCALE_COOKIE}\``);
    expect(COOKIE_MD).toContain(`\`${THEME_STORAGE_KEY}\``);
  });
});

describe("biztonságos Markdown megjelenítés", () => {
  it("nyers HTML-t és veszélyes linket nem enged", () => {
    const html = render('Szia <script>alert(1)</script> <img src=x onerror="alert(1)"> [x](javascript:alert(1))');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
  });

  it("a külső link új lapon nyílik meg", () => {
    const html = render("[Real Madrid](https://www.realmadrid.com)");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
