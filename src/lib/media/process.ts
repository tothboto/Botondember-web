/**
 * Képfeldolgozás a `sharp` csomaggal.
 *
 * - A típust a fájl TARTALMA alapján ellenőrizzük (nem a kiterjesztés alapján).
 * - SVG-t nem fogadunk el (XSS kockázat).
 * - Minden képet újrakódolunk WEBP-be, és legfeljebb 2560 px-re kicsinyítünk.
 * - Az újrakódolás eltávolítja a rejtett adatokat (EXIF, pl. GPS-hely) – ez egy
 *   gyerek oldalánál különösen fontos.
 */
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_DIMENSION = 2560;

export type ImageKind = "png" | "jpeg" | "webp" | "gif" | "ico";

/** Barátságos (magyar) hibaüzenetet hordozó hiba. */
export class ImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageError";
  }
}

/** A fájl típusa az első bájtjai („mágikus számok”) alapján. */
export function detectImageType(buf: Uint8Array): ImageKind | null {
  if (buf.length < 12) return null;
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...Array.from(buf.subarray(start, end)));
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return "png";
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return "gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0 && (buf[4] | (buf[5] << 8)) > 0) {
    return "ico";
  }
  return null;
}

export type ProcessedImage = {
  data: Buffer;
  width: number;
  height: number;
  mime: "image/webp";
  ext: "webp";
};

/**
 * Feltöltött kép feldolgozása: ellenőrzés, forgatás (EXIF szerint),
 * kicsinyítés, WEBP-be alakítás. Az animált GIF/WEBP animált WEBP marad.
 */
export async function processImage(
  input: Buffer,
  options: { maxDimension?: number; quality?: number } = {},
): Promise<ProcessedImage> {
  if (input.length > MAX_UPLOAD_BYTES) {
    throw new ImageError("A kép túl nagy – legfeljebb 10 MB lehet.");
  }
  const kind = detectImageType(input);
  if (!kind || kind === "ico") {
    throw new ImageError("Csak PNG, JPG, WEBP vagy GIF kép tölthető fel.");
  }
  const animated = kind === "gif" || kind === "webp";
  const maxDimension = options.maxDimension ?? MAX_DIMENSION;
  try {
    let pipeline = sharp(input, { animated });
    if (!animated) pipeline = pipeline.rotate();
    const data = await pipeline
      .resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true })
      .webp({ quality: options.quality ?? 82, effort: 4 })
      .toBuffer();
    const meta = await sharp(data).metadata();
    if (!meta.width || !meta.height) throw new Error("no size");
    return { data, width: meta.width, height: meta.height, mime: "image/webp", ext: "webp" };
  } catch {
    throw new ImageError("A képet nem sikerült feldolgozni – lehet, hogy sérült a fájl.");
  }
}
