/**
 * Favicon (böngészőfül-ikon) készlet készítése egyetlen forrásképből.
 * Méretek: 16, 32 (és 48 az .ico-ban), 180 (Apple), 192 és 512 (Android / PWA).
 */
import sharp from "sharp";
import { detectImageType, ImageError, MAX_UPLOAD_BYTES } from "./process";

export const FAVICON_FILES = [
  "favicon.ico",
  "icon-16.png",
  "icon-32.png",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
] as const;
export type FaviconFile = (typeof FAVICON_FILES)[number];

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function pngAt(source: Buffer, size: number): Promise<Buffer> {
  return sharp(source)
    .resize(size, size, { fit: "contain", background: TRANSPARENT })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** .ico fájl összeállítása PNG képekből (a modern böngészők mind ismerik). */
export function buildIco(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const directory = Buffer.alloc(16 * images.length);
  let offset = 6 + 16 * images.length;
  images.forEach((image, i) => {
    const base = i * 16;
    const dim = image.size >= 256 ? 0 : image.size;
    directory.writeUInt8(dim, base);
    directory.writeUInt8(dim, base + 1);
    directory.writeUInt8(0, base + 2);
    directory.writeUInt8(0, base + 3);
    directory.writeUInt16LE(1, base + 4);
    directory.writeUInt16LE(32, base + 6);
    directory.writeUInt32LE(image.png.length, base + 8);
    directory.writeUInt32LE(offset, base + 12);
    offset += image.png.length;
  });
  return Buffer.concat([header, directory, ...images.map((image) => image.png)]);
}

/** Egy .ico fájl legnagyobb képe PNG-ként (PNG és 24/32 bites BMP bejegyzéseket ismer). */
export async function icoLargestToPng(buf: Buffer): Promise<{ png: Buffer; size: number }> {
  if (buf.length < 6 || buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) {
    throw new ImageError("Ez nem érvényes ICO fájl.");
  }
  const count = buf.readUInt16LE(4);
  let best: { width: number; height: number; offset: number; length: number } | null = null;
  for (let i = 0; i < count; i++) {
    const base = 6 + i * 16;
    if (base + 16 > buf.length) break;
    const width = buf.readUInt8(base) || 256;
    const height = buf.readUInt8(base + 1) || 256;
    const length = buf.readUInt32LE(base + 8);
    const offset = buf.readUInt32LE(base + 12);
    if (offset + length > buf.length || length === 0) continue;
    if (!best || width * height > best.width * best.height) best = { width, height, offset, length };
  }
  if (!best) throw new ImageError("Az ICO fájlban nem találtam képet.");

  const data = buf.subarray(best.offset, best.offset + best.length);
  if (detectImageType(data) === "png") {
    const meta = await sharp(data).metadata();
    return { png: Buffer.from(data), size: Math.min(meta.width ?? best.width, meta.height ?? best.height) };
  }

  // BMP (DIB) bejegyzés: BITMAPINFOHEADER + képpontok (alulról felfelé) + AND maszk.
  const headerSize = data.readUInt32LE(0);
  const width = data.readInt32LE(4);
  const height = Math.abs(data.readInt32LE(8)) / 2;
  const bpp = data.readUInt16LE(14);
  const compression = data.readUInt32LE(16);
  if (compression !== 0 || (bpp !== 32 && bpp !== 24) || width <= 0 || height <= 0 || width > 512) {
    throw new ImageError("Ezt az ICO formátumot nem tudom feldolgozni – tölts fel inkább egy PNG képet!");
  }
  const stride = Math.ceil((width * bpp) / 32) * 4;
  const maskStride = Math.ceil(width / 32) * 4;
  const pixelStart = headerSize;
  const maskStart = pixelStart + stride * height;
  if (maskStart > data.length) throw new ImageError("Sérült ICO fájl.");
  const rgba = Buffer.alloc(width * height * 4);
  let anyAlpha = false;
  for (let y = 0; y < height; y++) {
    const srcRow = pixelStart + (height - 1 - y) * stride;
    for (let x = 0; x < width; x++) {
      const src = srcRow + x * (bpp / 8);
      const dst = (y * width + x) * 4;
      rgba[dst] = data[src + 2];
      rgba[dst + 1] = data[src + 1];
      rgba[dst + 2] = data[src];
      rgba[dst + 3] = bpp === 32 ? data[src + 3] : 255;
      if (bpp === 32 && data[src + 3] !== 0) anyAlpha = true;
    }
  }
  if (bpp === 24 || !anyAlpha) {
    for (let y = 0; y < height; y++) {
      const maskRow = maskStart + (height - 1 - y) * maskStride;
      for (let x = 0; x < width; x++) {
        const byte = data[maskRow + (x >> 3)] ?? 0;
        const transparent = (byte >> (7 - (x & 7))) & 1;
        rgba[(y * width + x) * 4 + 3] = transparent ? 0 : 255;
      }
    }
  }
  const png = await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
  return { png, size: Math.min(width, height) };
}

/**
 * A teljes készlet egy forrásképből (PNG/JPG/WEBP vagy ICO).
 * Visszaadja a fájlokat és egy figyelmeztetést, ha a forrás kicsi.
 */
export async function buildFaviconSet(
  input: Buffer,
): Promise<{ files: Record<FaviconFile, Buffer>; warning: string | null }> {
  if (input.length > MAX_UPLOAD_BYTES) throw new ImageError("A fájl túl nagy – legfeljebb 10 MB lehet.");
  const kind = detectImageType(input);
  if (!kind) throw new ImageError("Faviconnak PNG vagy ICO fájlt tölts fel!");

  let source: Buffer;
  let size: number;
  if (kind === "ico") {
    const largest = await icoLargestToPng(input);
    source = largest.png;
    size = largest.size;
  } else {
    try {
      const meta = await sharp(input).metadata();
      size = Math.min(meta.width ?? 0, meta.height ?? 0);
      source = await sharp(input).rotate().png().toBuffer();
    } catch {
      throw new ImageError("A képet nem sikerült feldolgozni – lehet, hogy sérült a fájl.");
    }
  }

  const [p16, p32, p48, p192, p512] = await Promise.all([16, 32, 48, 192, 512].map((s) => pngAt(source, s)));
  // Az Apple ikonon az átlátszó rész fekete lenne, ezért fehér hátteret kap.
  const apple = await sharp(source)
    .resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();
  const ico = buildIco([
    { size: 16, png: p16 },
    { size: 32, png: p32 },
    { size: 48, png: p48 },
  ]);

  const warning =
    size < 512
      ? `A feltöltött kép csak ${size}×${size} pixeles, ezért a nagy ikonok (192 és 512 px) kissé elmosódottak lehetnek. Legjobb egy legalább 512×512 pixeles PNG.`
      : null;

  return {
    files: {
      "favicon.ico": ico,
      "icon-16.png": p16,
      "icon-32.png": p32,
      "apple-touch-icon.png": apple,
      "icon-192.png": p192,
      "icon-512.png": p512,
    },
    warning,
  };
}

/** A tárolóbeli kulcs, pl. `favicon/default/icon-32.png`. */
export function faviconKey(version: string, file: FaviconFile): string {
  return `favicon/${version}/${file}`;
}
