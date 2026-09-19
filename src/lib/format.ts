/** Dátumok és egyéb értékek formázása a felület nyelvén. */

const LOCALE_TAGS: Record<string, string> = {
  hu: "hu-HU",
  en: "en-GB",
  es: "es-ES",
  de: "de-DE",
  is: "is-IS",
};

export function localeTag(locale: string): string {
  return LOCALE_TAGS[locale] ?? locale;
}

/** Pl. „2026. szeptember 19.” (magyarul) vagy „19 September 2026” (angolul). */
export function formatDate(value: number | string | Date, locale: string): string {
  const date =
    value instanceof Date ? value : typeof value === "number" ? new Date(value) : new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(localeTag(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Budapest",
  }).format(date);
}

/** Dátum és idő (az Adminhoz), pl. „2026. 09. 19. 14:05”. */
export function formatDateTime(value: number, locale = "hu"): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Budapest",
  }).format(new Date(value));
}
