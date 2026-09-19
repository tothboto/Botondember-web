/**
 * Kép letöltése egy külső címről – csak a YouTube saját képszervereiről
 * (így senki nem tudja az oldalunkkal tetszőleges címet letöltetni).
 */
import { ImageError, MAX_UPLOAD_BYTES } from "./process";

export const ALLOWED_IMAGE_HOSTS = new Set([
  "i.ytimg.com",
  "i1.ytimg.com",
  "i2.ytimg.com",
  "i3.ytimg.com",
  "i4.ytimg.com",
  "i9.ytimg.com",
  "yt3.ggpht.com",
  "yt3.googleusercontent.com",
]);

export async function downloadImage(address: string): Promise<Buffer> {
  let url: URL;
  try {
    url = new URL(address);
  } catch {
    throw new ImageError("Érvénytelen képcím.");
  }
  if (url.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.has(url.hostname)) {
    throw new ImageError("Csak a YouTube képszervereiről lehet képet letölteni.");
  }
  const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new ImageError(`A képet nem sikerült letölteni (${response.status}).`);
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES) throw new ImageError("A kép túl nagy.");
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length > MAX_UPLOAD_BYTES) throw new ImageError("A kép túl nagy.");
  return data;
}
