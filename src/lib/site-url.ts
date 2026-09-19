/**
 * Az oldal nyilvános címe (pl. https://botondember.hu) – a megosztási előnézetekhez,
 * a kanonikus címekhez és az oldaltérképhez. Élesítéskor a SITE_URL környezeti
 * változóban kell megadni; addig a helyi fejlesztői cím az alapértelmezés.
 */
export function siteUrl(): URL {
  const raw = process.env.SITE_URL?.trim();
  try {
    if (raw) return new URL(raw);
  } catch {
    // Hibás cím esetén marad a helyi alapértelmezés.
  }
  return new URL("http://localhost:3000");
}
