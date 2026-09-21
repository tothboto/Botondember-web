/**
 * A jogi szövegek helyőrzőinek kitöltése az Admin > Jogi oldalak adataival.
 * Ha egy adat még nincs megadva, jól látható helykitöltő szöveg jelenik meg.
 */
import { formatDate } from "./format";
import type { GeneralSettings, LegalSettings } from "./settings";

export const LEGAL_TOKENS = [
  "OLDAL_NEVE",
  "ADATKEZELO_NEV",
  "ADATKEZELO_EMAIL",
  "TARHELYSZOLGALTATO",
  "HATALYBALEPES",
] as const;

/** A beírt értékben a Markdown-jeleket „ártalmatlanítja”, hogy szövegként jelenjenek meg. */
export function escapeMarkdownText(value: string): string {
  return value.replace(/([\\`*_{}[\]()#+\-.!|<>~])/g, "\\$1");
}

/**
 * @param options a lefordított szövegnél: a dátum nyelve és a hiányzó adatok helyén
 *                megjelenő rövid felirat (pl. „not provided yet”) az oldal nyelvén.
 */
export function fillLegalTokens(
  markdown: string,
  general: Pick<GeneralSettings, "siteName">,
  legal: LegalSettings,
  options: { locale?: string; missing?: string } = {},
): string {
  const email = legal.controllerEmail.trim();
  const placeholder = (hungarianHint: string) => `*[${options.missing ?? hungarianHint}]*`;
  const values: Record<(typeof LEGAL_TOKENS)[number], string> = {
    OLDAL_NEVE: escapeMarkdownText(general.siteName),
    ADATKEZELO_NEV: legal.controllerName.trim()
      ? escapeMarkdownText(legal.controllerName.trim())
      : placeholder("az adatkezelő neve – az Admin > Jogi oldalak menüben adható meg"),
    ADATKEZELO_EMAIL: email
      ? `[${escapeMarkdownText(email)}](mailto:${encodeURI(email)})`
      : placeholder("az adatkezelő e-mail-címe – az Admin > Jogi oldalak menüben adható meg"),
    TARHELYSZOLGALTATO: legal.hostingProvider.trim()
      ? escapeMarkdownText(legal.hostingProvider.trim())
      : placeholder("a tárhelyszolgáltató neve és elérhetősége – az élesítéskor kerül ide"),
    HATALYBALEPES: formatDate(legal.effectiveDate, options.locale ?? "hu"),
  };
  // A (félkövér) helyőrző után álló mondatvégi pontot is nézzük: a magyar és a horvát dátum
  // pontra végződik („2026. szeptember 19.”), ilyenkor a mondat pontja már nem kell még egyszer.
  return markdown.replace(/\{\{([A-Z_]+)\}\}(\**)(\.?)/g, (match, name: string, stars: string, dot: string) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) return match;
    const value = values[name as keyof typeof values];
    const endsWithDot = name === "HATALYBALEPES" && value.endsWith(".");
    return `${dot && endsWithDot ? value.slice(0, -1) : value}${stars}${dot}`;
  });
}
