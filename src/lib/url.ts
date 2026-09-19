/**
 * Csak `http://` és `https://` linkeket engedünk – így `javascript:` vagy
 * `data:` kezdetű (veszélyes) link nem kerülhet az oldalra.
 */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Ha valaki protokoll nélkül írja be (pl. `realmadrid.com`), elé tesszük a `https://`-t. */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

/** Külső (más weboldalra mutató) link-e? */
export function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}
